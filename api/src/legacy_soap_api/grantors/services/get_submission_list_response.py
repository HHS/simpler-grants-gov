import logging
from collections.abc import Generator, Iterator
from datetime import datetime, timezone

import grants_shared.adapters.db as db
import xmltodict
from grants_shared.util.datetime_util import adjust_timezone
from lxml import etree
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

from src.constants.lookup_constants import ApplicationStatus
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.grantors.filters import GetSubmissionListFilter
from src.legacy_soap_api.grantors.statuses import (
    AGENCY_TRACKING_NUMBER_ASSIGNED_STATUS,
    RECEIVED_BY_AGENCY_STATUS,
)
from src.legacy_soap_api.legacy_soap_api_auth import validate_certificate, verify_certificate_access
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import convert_bool_to_yes_no

logger = logging.getLogger(__name__)
GRANTS_APPLICATION_STATUSES = {
    None: None,
    ApplicationStatus.IN_PROGRESS: None,
    ApplicationStatus.SUBMITTED: "Received",
    ApplicationStatus.ACCEPTED: "Validated",
}
STATUS_TRANSFORM = {
    "Receiving": None,
    "Received": None,
    "Processing": ApplicationStatus.SUBMITTED,
    "Validated": ApplicationStatus.ACCEPTED,
    "Rejected with Errors": None,
    "Download Preparation": None,
}


def get_grants_gov_application_status(submission: ApplicationSubmission) -> str | None:
    """
    This method gets the GrantsGovTrackingNumber
    NOTE: The order of operations is VERY important to get the correct GrantsGovTrackingNumber
    IF there's a row on the ApplicationSubmissionTrackingNumber table -> "Agency Tracking Number Assigned"
    IF there's NOT a row on the ApplicationSubmissionTrackingNumber table but there IS a row on the ApplicationSubmissionRetrieval table -> "Received by Agency"
    IF there's not a row on either table -> application.application_status
    """
    grants_gov_application_status = GRANTS_APPLICATION_STATUSES.get(
        submission.application.application_status
    )
    if len(submission.application_submission_tracking_numbers) > 0:
        grants_gov_application_status = AGENCY_TRACKING_NUMBER_ASSIGNED_STATUS
    elif len(submission.application_submission_retrievals) > 0:
        grants_gov_application_status = RECEIVED_BY_AGENCY_STATUS
    return grants_gov_application_status


def get_filter_values(
    submission_filters: list[schemas.ExpandedApplicationFilter], filter_type: str
) -> list[str | int]:
    return [d.filter_value for d in submission_filters if d.filter_type == filter_type]


def transform_submission(submission: ApplicationSubmission) -> dict[str, str | datetime | None]:
    application = submission.application
    competition = application.competition
    opportunity = competition.opportunity
    assistance_listing = competition.opportunity_assistance_listing
    application_list_obj = {
        "FundingOpportunityNumber": opportunity.opportunity_number,
        "CFDANumber": assistance_listing.assistance_listing_number if assistance_listing else None,
        "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
        "GrantsGovApplicationStatus": None,
        "SubmissionTitle": application.application_name,
        "PackageID": competition.legacy_package_id,
        "CompetitionID": competition.public_competition_id,
        "ns2:ReceivedDateTime": (
            adjust_timezone(application.submitted_at, "America/New_York")
            if application.submitted_at
            else None
        ),
        "SubmissionMethod": "web",
        "DelinquentFederalDebt": None,
        "ActiveExclusions": None,
        "UEI": None,
    }
    if grants_gov_application_status := get_grants_gov_application_status(submission):
        application_list_obj.update({"GrantsGovApplicationStatus": grants_gov_application_status})
    organization = application.organization
    if organization and organization.sam_gov_entity:
        sam_gov_entity = organization.sam_gov_entity
        application_list_obj.update(
            {
                "DelinquentFederalDebt": (
                    convert_bool_to_yes_no(sam_gov_entity.has_debt_subject_to_offset)
                ),
                "ActiveExclusions": (convert_bool_to_yes_no(sam_gov_entity.has_exclusion_status)),
                "UEI": sam_gov_entity.uei,
            }
        )
    return application_list_obj


def get_submissions(
    db_session: db.Session,
    request: schemas.GetSubmissionListRequest,
    soap_request: SOAPRequest,
    soap_config: SOAPOperationConfig,
) -> list[ApplicationSubmission]:
    stmt = (
        select(ApplicationSubmission)
        .join(ApplicationSubmission.application)
        # Joins for where clauses
        .join(Application.competition)
        .join(Opportunity, Competition.opportunity)
        .join(
            OpportunityAssistanceListing, Competition.opportunity_assistance_listing, isouter=True
        )
        # Prefetch values for better performance
        .options(
            selectinload(ApplicationSubmission.application_submission_tracking_numbers),
            selectinload(ApplicationSubmission.application_submission_retrievals),
            selectinload(ApplicationSubmission.application).options(
                selectinload(Application.organization),
                selectinload(Application.competition).options(
                    selectinload(Competition.opportunity),
                    selectinload(Competition.opportunity_assistance_listing),
                ),
            ),
        )
    )

    if request.expanded_application_filter and request.expanded_application_filter.filters:
        submission_filters = request.expanded_application_filter.filters
        status = get_filter_values(submission_filters, GetSubmissionListFilter.STATUS)
        if status:
            if len(status) > 1:
                return []
            status_value = str(status[0])
            # GrantsGovTrackingNumber comes from three different places with a hierarchy
            # A submissions is in "Agency Tracking Number Assigned Status" IF it has any rows on application_submission_tracking_numbers table
            # A submissions is in "Received by Agency" IF it has any rows on application_submission_retrievals table AND no rows on application_submission_tracking_numbers table
            # A submissions is in  application.application_status IF there are no rows on either of the above tables
            if status_value == AGENCY_TRACKING_NUMBER_ASSIGNED_STATUS:
                stmt = stmt.where(
                    ApplicationSubmission.application_submission_tracking_numbers.any()
                )
            elif status_value == RECEIVED_BY_AGENCY_STATUS:
                stmt = stmt.where(
                    ApplicationSubmission.application_submission_retrievals.any(),
                    ~ApplicationSubmission.application_submission_tracking_numbers.any(),
                )
            else:
                simpler_status = STATUS_TRANSFORM.get(status_value)
                if simpler_status:
                    stmt = stmt.where(
                        ~ApplicationSubmission.application_submission_retrievals.any(),
                        ~ApplicationSubmission.application_submission_tracking_numbers.any(),
                        Application.application_status == simpler_status,
                    )
        # Each one of these filters is Last One Wins so if multiple of the same type are entered the last one is the only one that matters
        grants_gov_tracking_numbers = get_filter_values(
            submission_filters, GetSubmissionListFilter.GRANTS_GOV_TRACKING_NUMBER
        )
        if grants_gov_tracking_numbers:
            stmt = stmt.where(
                [
                    ApplicationSubmission.legacy_tracking_number == tracking_number
                    for tracking_number in grants_gov_tracking_numbers
                ][-1]
            )
        cfda_numbers = get_filter_values(submission_filters, GetSubmissionListFilter.CFDA_NUMBER)
        if cfda_numbers:
            stmt = stmt.where(
                [
                    OpportunityAssistanceListing.assistance_listing_number == cfda
                    for cfda in cfda_numbers
                ][-1]
            )
        funding_opportunity_numbers = get_filter_values(
            submission_filters, GetSubmissionListFilter.FUNDING_OPPORTUNITY_NUMBER
        )
        if funding_opportunity_numbers:
            stmt = stmt.where(
                [
                    Opportunity.opportunity_number == opportunity_number
                    for opportunity_number in funding_opportunity_numbers
                ][-1]
            )
        opportunity_ids = get_filter_values(
            submission_filters, GetSubmissionListFilter.OPPORTUNITY_ID
        )
        if opportunity_ids:
            stmt = stmt.where(
                [Opportunity.legacy_opportunity_id == int(oid) for oid in opportunity_ids if oid][
                    -1
                ]
            )

        # Unsupported but logged
        unsupported_filters = {
            "competition_id": get_filter_values(
                submission_filters, GetSubmissionListFilter.COMPETITION_ID
            ),
            "package_id": get_filter_values(submission_filters, GetSubmissionListFilter.PACKAGE_ID),
            "submission_title": get_filter_values(
                submission_filters, GetSubmissionListFilter.SUBMISSION_TITLE
            ),
        }
        for filter_type, filter_values in unsupported_filters.items():
            if filter_values:
                extra = {
                    f"{filter_type}s": str(filter_values),
                }
                logger.info(
                    f"GetSubmissionListExpanded Filter: {GetSubmissionListFilter[filter_type.upper()]}s",
                    extra=extra,
                )

    certificate = validate_certificate(db_session, soap_request.auth, soap_request.api_name)
    verify_certificate_access(certificate, soap_config, certificate.agency)
    stmt = _apply_agency_filter(stmt, certificate.agency)

    return list(db_session.execute(stmt).scalars().all())


def _apply_agency_filter(stmt: Select, agency: Agency | None) -> Select:
    if agency is None:
        return stmt

    if agency.is_multilevel_agency:
        return stmt.where(
            or_(
                Opportunity.agency_code == agency.agency_code,
                Opportunity.agency_code.like(f"{agency.agency_code}-%"),
            )
        )

    return stmt.where(Opportunity.agency_code == agency.agency_code)


def get_submission_list(
    db_session: db.Session,
    request: schemas.GetSubmissionListRequest,
    soap_request: SOAPRequest,
    soap_config: SOAPOperationConfig,
    is_expanded: bool = False,
) -> list[schemas.SubmissionInfo] | list[schemas.SubmissionInfoExpanded]:
    """Gather submission data from the database.

    Performs authentication, authorization, filtering, and transforms
    database submissions into SubmissionInfo or SubmissionInfoExpanded objects.

    Returns a list of SubmissionInfo or SubmissionInfoExpanded from Simpler.
    """
    schema: type[schemas.SubmissionInfoExpanded | schemas.SubmissionInfo]

    if is_expanded:
        schema = schemas.SubmissionInfoExpanded
    else:
        schema = schemas.SubmissionInfo
    submissions = get_submissions(db_session, request, soap_request, soap_config)
    return [schema(**transform_submission(submission)) for submission in submissions]


def get_submission_list_response(
    simpler_submissions: list[schemas.SubmissionInfo] | list[schemas.SubmissionInfoExpanded],
    proxy_response: SOAPResponse,
) -> schemas.GetSubmissionListResponse:
    """Build the SOAP response envelope from Simpler and proxy data.

    Parses proxy submissions, merges with Simpler submissions,
    sorts by date, and constructs the response.
    """
    info: list[schemas.SubmissionInfo | schemas.SubmissionInfoExpanded] = []
    try:
        info.extend(parse_submissions_from_proxy(proxy_response))
    except Exception:
        logger.exception("Failed to parse submission list XML response")
    info.extend(simpler_submissions)
    info.sort(
        key=lambda x: x.received_date_time or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return schemas.GetSubmissionListResponse(
        success=True, available_application_number=len(info), submission_info=info
    )


def parse_submissions_from_proxy(
    proxy_response: SOAPResponse,
) -> list[schemas.SubmissionInfoExpanded]:
    xml_bytes = b"".join(clean_mtom_generator(proxy_response.stream()))
    info = []
    if xml_bytes:
        parser = etree.XMLParser(recover=True)
        root = etree.fromstring(xml_bytes, parser=parser)
        for element in root.iter("{*}SubmissionInfo"):
            try:
                element_bytes = etree.tostring(element)
                submission_info_dict = xmltodict.parse(element_bytes).get("ns2:SubmissionInfo")
                info.append(schemas.SubmissionInfoExpanded(**submission_info_dict))
            except PydanticValidationError:
                logger.exception("Skipping invalid submission due to validation error")
                continue
    return info


def clean_mtom_generator(byte_gen: Iterator[bytes] | list[bytes]) -> Generator[bytes]:
    """
    This will take the bytes of an MTOM messages and remove the header
    to prevent errors when processing the xml
    """
    found_xml = False
    for chunk in byte_gen:
        if not found_xml:
            start_idx = chunk.find(b"<soap:Envelope")
            if start_idx != -1:
                found_xml = True
                yield chunk[start_idx:]
        else:
            yield chunk
