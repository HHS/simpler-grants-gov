import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus
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


def get_submission_list_expanded_response(
    db_session: db.Session,
    get_submission_list_expanded_request: schemas.GetSubmissionListExpandedRequest,
    soap_request: SOAPRequest,
) -> schemas.GetSubmissionListExpandedResponseSOAPEnvelope:
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

    grants_gov_tracking_numbers = None
    cfda_numbers = None
    funding_opportunity_numbers = None
    opportunity_ids = None
    competition_ids = None
    package_ids = None
    status = None
    simpler_status = None
    submission_titles = None
    if get_submission_list_expanded_request.expanded_application_filter:
        if (
            submission_filters := get_submission_list_expanded_request.expanded_application_filter.filters
        ):
            grants_gov_tracking_numbers = submission_filters.get("GrantsGovTrackingNumber")
            cfda_numbers = submission_filters.get("CFDANumber")
            funding_opportunity_numbers = submission_filters.get("FundingOpportunityNumber")
            opportunity_ids = submission_filters.get("OpportunityID")
            competition_ids = submission_filters.get("CompetitionID")
            package_ids = submission_filters.get("PackageID")
            status = submission_filters.get("Status")
            submission_titles = submission_filters.get("SubmissionTitle")

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
    # Getting only one status from a potential list of statuses because multiple statuses on a filter don't make sense'
    if isinstance(status, list) and len(status) > 0:
        simpler_status = STATUS_TRANSFORM.get(status[0]) if isinstance(status[0], str) else None
    else:
        simpler_status = None

    certificate = validate_certificate(db_session, soap_request.auth, soap_request.api_name)
    if certificate.agency is not None:
        stmt = stmt.where(Opportunity.agency_code == certificate.agency.agency_code)
    if grants_gov_tracking_numbers:
        stmt = stmt.where(
            ApplicationSubmission.legacy_tracking_number.in_(grants_gov_tracking_numbers)
        )
    if cfda_numbers:
        stmt = stmt.where(OpportunityAssistanceListing.assistance_listing_number.in_(cfda_numbers))
    if funding_opportunity_numbers:
        stmt = stmt.where(Opportunity.opportunity_number.in_(funding_opportunity_numbers))
    if opportunity_ids:
        stmt = stmt.where(
            Opportunity.legacy_opportunity_id.in_([int(oid) for oid in opportunity_ids if oid])
        )
    if simpler_status:
        stmt = stmt.where(Application.application_status == simpler_status)

    # Unsupported but logged
    if competition_ids:
        logger.info(f"GetSubmissionListExpanded Filter: CompetitionIDs {competition_ids}")
    if package_ids:
        logger.info(f"GetSubmissionListExpanded Filter: PackageIDs {package_ids}")
    if submission_titles:
        logger.info(f"GetSubmissionListExpanded Filter: SubmissionTitles {submission_titles}")

    info = []
    for submission in db_session.execute(stmt).scalars().all():
        submission_list_obj = transform_submission(submission)
        info.append(schemas.SubmissionInfo(**submission_list_obj))
    get_submission_list_expanded_response = schemas.GetSubmissionListExpandedResponse(
        **dict(success=True, available_application_number=len(info), submission_info=info)
    )
    soap_body = schemas.GetSubmissionListExpandedResponseSOAPBody(
        **{"ns2:GetSubmissionListExpandedResponse": get_submission_list_expanded_response}
    )
    return schemas.GetSubmissionListExpandedResponseSOAPEnvelope(**{"Body": soap_body})
