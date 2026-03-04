import logging
from datetime import date
from uuid import UUID

from pydantic import BaseModel, validator

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    Privilege,
)
from src.db.models.opportunity_models import OpportunitySummary
from src.db.models.user_models import User
from src.services.opportunities_v1.get_opportunity import get_opportunity

logger = logging.getLogger(__name__)


class OpportunitySummaryCreateRequest(BaseModel):
    legacy_opportunity_id: int
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

    @validator("award_ceiling")
    def validate_award_ceiling(cls, v: int | None, values: dict) -> int | None:
        if "award_floor" in values and values["award_floor"] is not None and v is not None:
            if values["award_floor"] > v:
                raise ValueError("Award floor must be less than or equal to award ceiling")
        return v

    @validator("close_date")
    def validate_close_date(cls, v: date | None, values: dict) -> date | None:
        if "post_date" in values and values["post_date"] is not None and v is not None:
            if values["post_date"] > v:
                raise ValueError("Post date must be less than or equal to close date")
        return v


def create_opportunity_summary(
    db_session: db.Session, opportunity_id: UUID, summary_data: dict, user: User
) -> OpportunitySummary:
    request = OpportunitySummaryCreateRequest(**summary_data)

    # Fetch the opportunity
    opportunity = get_opportunity(db_session, opportunity_id)

    # Verify the user has permission to edit this opportunity
    agency = opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, agency)

    # Check if a summary of the same type already exists
    is_forecast = request.is_forecast
    if is_forecast:
        existing_summary = opportunity.forecast_summary
    else:
        existing_summary = opportunity.non_forecast_summary

    if existing_summary:
        raise_flask_error(
            422,
            f"An opportunity summary of type {'forecast' if is_forecast else 'non-forecast'} already exists",
        )

    # Create the new opportunity summary
    opportunity_summary = OpportunitySummary(
        opportunity=opportunity,
        legacy_opportunity_id=request.legacy_opportunity_id,
        is_forecast=request.is_forecast,
        summary_description=request.summary_description,
        is_cost_sharing=request.is_cost_sharing,
        post_date=request.post_date,
        close_date=request.close_date,
        close_date_description=request.close_date_description,
        archive_date=request.archive_date,
        expected_number_of_awards=request.expected_number_of_awards,
        estimated_total_program_funding=request.estimated_total_program_funding,
        award_floor=request.award_floor,
        award_ceiling=request.award_ceiling,
        additional_info_url=request.additional_info_url,
        additional_info_url_description=request.additional_info_url_description,
        funding_category_description=request.funding_category_description,
        applicant_eligibility_description=request.applicant_eligibility_description,
        agency_contact_description=request.agency_contact_description,
        agency_email_address=request.agency_email_address,
        agency_email_address_description=request.agency_email_address_description,
        forecasted_post_date=request.forecasted_post_date,
        forecasted_close_date=request.forecasted_close_date,
        forecasted_close_date_description=request.forecasted_close_date_description,
        forecasted_award_date=request.forecasted_award_date,
        forecasted_project_start_date=request.forecasted_project_start_date,
        fiscal_year=request.fiscal_year,
    )

    db_session.add(opportunity_summary)

    logger.info(
        f"Created {'forecast' if is_forecast else 'non-forecast'} opportunity summary",
        extra={
            "opportunity_id": str(opportunity_id),
            "opportunity_summary_id": str(opportunity_summary.opportunity_summary_id),
        },
    )

    return opportunity_summary
