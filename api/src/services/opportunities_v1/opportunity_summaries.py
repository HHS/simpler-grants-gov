import logging
from datetime import date
from uuid import UUID

from pydantic import BaseModel

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors

logger = logging.getLogger(__name__)


class OpportunitySummaryCreateRequest(BaseModel):
    legacy_opportunity_id: int | None = None
    is_forecast: bool
    summary_description: str | None = None
    is_cost_sharing: bool | None = None
    post_date: date | None = None
    close_date: date | None = None
    close_date_description: str | None = None
    archive_date: date | None = None
    expected_number_of_awards: int | None = None
    estimated_total_program_funding: int | None = None
    award_floor: int | None = None
    award_ceiling: int | None = None
    additional_info_url: str | None = None
    additional_info_url_description: str | None = None
    funding_categories: list[FundingCategory] | None = None
    funding_category_description: str | None = None
    funding_instruments: list[FundingInstrument] | None = None
    applicant_types: list[ApplicantType] | None = None
    applicant_eligibility_description: str | None = None
    agency_contact_description: str | None = None
    agency_email_address: str | None = None
    agency_email_address_description: str | None = None
    forecasted_post_date: date | None = None
    forecasted_close_date: date | None = None
    forecasted_close_date_description: str | None = None
    forecasted_award_date: date | None = None
    forecasted_project_start_date: date | None = None
    fiscal_year: int | None = None


def _check_existing_summary(opportunity: Opportunity, is_forecast: bool) -> None:
    """Check if a summary of the same type already exists for the opportunity"""
    existing_summary = (
        opportunity.forecast_summary if is_forecast else opportunity.non_forecast_summary
    )

    if existing_summary:
        raise_flask_error(
            422,
            f"An opportunity summary of type {'forecast' if is_forecast else 'non-forecast'} already exists",
        )


def create_opportunity_summary(
    db_session: db.Session, opportunity_id: UUID, summary_data: dict, user: User
) -> OpportunitySummary:
    """Create a new opportunity summary"""
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to view/edit opportunities for this agency
    agency = opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, agency)

    _check_existing_summary(opportunity, summary_data["is_forecast"])

    opportunity_summary = OpportunitySummary(opportunity=opportunity, **summary_data)

    db_session.add(opportunity_summary)

    logger.info(
        "Created opportunity summary",
        extra={
            "opportunity_id": opportunity_id,
            "opportunity_summary_id": opportunity_summary.opportunity_summary_id,
            "is_forecast": summary_data["is_forecast"],
        },
    )

    return opportunity_summary
