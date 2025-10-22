import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.legacy_soap_api.grantors import schemas

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
        "n2:ReceivedDateTime": (
            application.submitted_at.astimezone(ZoneInfo("America/New_York"))
            if application.submitted_at
            else None
        ),
        "SubmissionMethod": "web",
        "DelinquentFederalDebt": None,
        "ActiveExclusions": None,
    }
    if organization := application.organization:
        sam_gov_entity = organization.sam_gov_entity
        application_list_obj.update(
            {
                "DelinquentFederalDebt": (
                    "Yes" if sam_gov_entity and sam_gov_entity.has_debt_subject_to_offset else "No"
                ),
                "ActiveExclusions": (
                    "Yes" if sam_gov_entity and sam_gov_entity.has_exclusion_status else "No"
                ),
            }
        )
    return application_list_obj


def get_application_list_expanded_response(
    db_session: db.Session,
    get_application_list_expanded_request: schemas.GetApplicationListExpandedRequest,
) -> schemas.GetApplicationListExpandedResponse:
    tracking_numbers = None
    if application_filter := get_application_list_expanded_request.expanded_application_filter:
        tracking_numbers = application_filter.grants_gov_tracking_numbers

    stmt = select(ApplicationSubmission).options(
        joinedload(ApplicationSubmission.application).options(
            joinedload(Application.organization),
            joinedload(Application.competition).options(
                joinedload(Competition.opportunity),
                joinedload(Competition.opportunity_assistance_listing),
            ),
        )
    )
    if tracking_numbers:
        stmt = stmt.where(ApplicationSubmission.legacy_tracking_number.in_(tracking_numbers))

    info = []
    for submission in db_session.execute(stmt).scalars().all():
        application_list_obj = transform_submission(submission)
        info.append(schemas.ExpandedApplicationInfo(**application_list_obj))
    return schemas.GetApplicationListExpandedResponse(
        **dict(Success=True, AvailableApplicationNumber=len(info), ExpandedApplicationInfo=info)
    )
