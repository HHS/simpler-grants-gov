import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import aliased, selectinload

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.legacy_soap_api.grantors import schemas
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
        "n2:ReceivedDateTime": (
            adjust_timezone(application.submitted_at, "America/New_York")
            if application.submitted_at
            else None
        ),
        "SubmissionMethod": "web",
        "DelinquentFederalDebt": None,
        "ActiveExclusions": None,
        "UEI": None,
    }
    if organization := application.organization:
        sam_gov_entity = organization.sam_gov_entity
        application_list_obj.update(
            {
                "DelinquentFederalDebt": (
                    convert_bool_to_yes_no(
                        sam_gov_entity is not None and sam_gov_entity.has_debt_subject_to_offset
                    )
                ),
                "ActiveExclusions": (
                    convert_bool_to_yes_no(sam_gov_entity is not None and sam_gov_entity.has_exclusion_status)
                ),
                "UEI": sam_gov_entity.uei if sam_gov_entity else None,
            }
        )
    return application_list_obj


def get_submission_list_expanded_response(
    db_session: db.Session,
    get_submission_list_expanded_request: schemas.GetSubmissionListExpandedRequest,
) -> schemas.GetSubmissionListExpandedResponse:
    stmt = select(ApplicationSubmission).options(
        selectinload(ApplicationSubmission.application).options(
            selectinload(Application.organization),
            selectinload(Application.competition).options(
                selectinload(Competition.opportunity),
                selectinload(Competition.opportunity_assistance_listing),
            ),
        )
    )
    grants_gov_tracking_numbers = None
    cfda_numbers = None
    funding_opportunity_numbers = None
    if get_submission_list_expanded_request.expanded_application_filter:
        if (
            submission_filters := get_submission_list_expanded_request.expanded_application_filter.filters
        ):
            grants_gov_tracking_numbers = submission_filters.get("GrantsGovTrackingNumber")
            cfda_numbers = submission_filters.get("CFDANumber")
            funding_opportunity_numbers = submission_filters.get("FundingOpportunityNumber")

    # TODO: the agency from the certificate needs to be added to the query here
    if grants_gov_tracking_numbers:
        stmt = stmt.where(
            ApplicationSubmission.legacy_tracking_number.in_(grants_gov_tracking_numbers)
        )
    if cfda_numbers:
        ListingAlias = aliased(OpportunityAssistanceListing)
        stmt = (
            stmt.join(ApplicationSubmission.application)
            .join(Application.competition)
            .join(ListingAlias, Competition.opportunity_assistance_listing)
            .where(ListingAlias.assistance_listing_number.in_(cfda_numbers))
        )
    if funding_opportunity_numbers:
        OpportunityAlias = aliased(Opportunity)
        stmt = (
            stmt.join(ApplicationSubmission.application)
            .join(Application.competition)
            .join(OpportunityAlias, Competition.opportunity)
            .where(OpportunityAlias.opportunity_number.in_(funding_opportunity_numbers))
        )

    info = []
    for submission in db_session.execute(stmt).scalars().all():
        submission_list_obj = transform_submission(submission)
        info.append(schemas.SubmissionInfo(**submission_list_obj))
    return schemas.GetSubmissionListExpandedResponse(
        **dict(Success=True, AvailableApplicationNumber=len(info), SubmissionInfo=info)
    )
