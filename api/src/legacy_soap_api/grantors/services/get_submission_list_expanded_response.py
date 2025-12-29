import logging
from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.legacy_soap_api_auth import validate_certificate
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import convert_bool_to_yes_no
from src.util.datetime_util import adjust_timezone

logger = logging.getLogger(__name__)

GRANTS_APPLICATION_STATUSES = {
    None: None,
    ApplicationStatus.IN_PROGRESS: None,
    ApplicationStatus.SUBMITTED: "Received",
    ApplicationStatus.ACCEPTED: "Validated",
}
# TODO - this will require new statuses, we will need to adjust this later (2025-12-18)
STATUS_TRANSFORM = {
    "Receiving": None,
    "Received": None,
    "Processing": ApplicationStatus.SUBMITTED,
    "Validated": ApplicationStatus.ACCEPTED,
    "Rejected with Errors": None,
    "Download Preparation": None,
    "Received by Agency": ApplicationStatus.ACCEPTED,
    "Agency Tracking Number Assigned": ApplicationStatus.ACCEPTED,
}


def transform_submission(submission: ApplicationSubmission) -> dict[str, str | datetime | None]:
    application = submission.application
    competition = application.competition
    opportunity = competition.opportunity
    assistance_listing = competition.opportunity_assistance_listing
    application_list_obj = {
        "FundingOpportunityNumber": opportunity.opportunity_number,
        "CFDANumber": assistance_listing.assistance_listing_number if assistance_listing else None,
        "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
        "GrantsGovApplicationStatus": GRANTS_APPLICATION_STATUSES[application.application_status],
        "SubmissionTitle": application.application_name,
        "PackageID": competition.legacy_package_id,
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
    request: schemas.GetSubmissionListExpandedRequest,
    soap_request: SOAPRequest,
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
            selectinload(ApplicationSubmission.application).options(
                selectinload(Application.organization),
                selectinload(Application.competition).options(
                    selectinload(Competition.opportunity),
                    selectinload(Competition.opportunity_assistance_listing),
                ),
            )
        )
    )

    if request.expanded_application_filter and request.expanded_application_filter.filters:
        submission_filters = request.expanded_application_filter.filters
        if status := submission_filters.get("Status"):
            # If more than one status in filter then just return nothing
            if status and len(status) > 1:
                return []
            simpler_status = STATUS_TRANSFORM.get(str(status[0])) if status else None
            if simpler_status:
                stmt = stmt.where(Application.application_status == simpler_status)
        # Each one of these filters is Last One Wins so if multiple of the same type are entered the last one is the only one that matters
        if grants_gov_tracking_numbers := submission_filters.get("GrantsGovTrackingNumber"):
            stmt = stmt.where(
                [
                    ApplicationSubmission.legacy_tracking_number == tracking_number
                    for tracking_number in grants_gov_tracking_numbers
                ][-1]
            )
        if cfda_numbers := submission_filters.get("CFDANumber"):
            stmt = stmt.where(
                [
                    OpportunityAssistanceListing.assistance_listing_number == cfda
                    for cfda in cfda_numbers
                ][-1]
            )
        if funding_opportunity_numbers := submission_filters.get("FundingOpportunityNumber"):
            stmt = stmt.where(
                [
                    Opportunity.opportunity_number == opportunity_number
                    for opportunity_number in funding_opportunity_numbers
                ][-1]
            )
        if opportunity_ids := submission_filters.get("OpportunityID"):
            stmt = stmt.where(
                [Opportunity.legacy_opportunity_id == int(oid) for oid in opportunity_ids if oid][
                    -1
                ]
            )

        # Unsupported but logged
        if competition_ids := submission_filters.get("CompetitionID"):
            logger.info(f"GetSubmissionListExpanded Filter: CompetitionIDs {competition_ids}")
        if package_ids := submission_filters.get("PackageID"):
            logger.info(f"GetSubmissionListExpanded Filter: PackageIDs {package_ids}")
        if submission_titles := submission_filters.get("SubmissionTitle"):
            logger.info(f"GetSubmissionListExpanded Filter: SubmissionTitles {submission_titles}")

    certificate = validate_certificate(db_session, soap_request.auth, soap_request.api_name)
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


def get_submission_list_expanded_response(
    db_session: db.Session,
    request: schemas.GetSubmissionListExpandedRequest,
    soap_request: SOAPRequest,
) -> schemas.GetSubmissionListExpandedResponse:
    submissions = get_submissions(db_session, request, soap_request)
    info = []
    for submission in submissions:
        submission_list_obj = transform_submission(submission)
        info.append(schemas.SubmissionInfo(**submission_list_obj))
    return schemas.GetSubmissionListExpandedResponse(
        success=True, available_application_number=len(info), submission_info=info
    )
