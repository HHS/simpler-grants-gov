import logging
from datetime import date, timedelta
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
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunitySummary,
)
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


def _create_opportunity_summary_object(
    opportunity: Opportunity, request: OpportunitySummaryCreateRequest
) -> OpportunitySummary:
    """Create a new OpportunitySummary object from the request data"""
    # Calculate archive_date as close_date + 30 days
    archive_date = request.archive_date
    if archive_date is None and request.close_date is not None:
        archive_date = request.close_date + timedelta(days=30)

    return OpportunitySummary(
        opportunity=opportunity,
        legacy_opportunity_id=request.legacy_opportunity_id,
        is_forecast=request.is_forecast,
        summary_description=request.summary_description,
        is_cost_sharing=request.is_cost_sharing,
        post_date=request.post_date,
        close_date=request.close_date,
        close_date_description=request.close_date_description,
        archive_date=archive_date,
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


def create_opportunity_summary(
    db_session: db.Session, opportunity_id: UUID, summary_data: dict, user: User
) -> OpportunitySummary:
    """Create a new opportunity summary"""
    # Parse and validate the request data
    request = OpportunitySummaryCreateRequest(**summary_data)

    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to view/edit opportunities for this agency
    agency = opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, agency)

    _check_existing_summary(opportunity, request.is_forecast)

    opportunity_summary = _create_opportunity_summary_object(opportunity, request)

    db_session.add(opportunity_summary)

    # Handle relationships for loading
    if request.funding_instruments:
        for instrument in request.funding_instruments:
            link_funding_instrument = LinkOpportunitySummaryFundingInstrument(
                funding_instrument=instrument
            )
            opportunity_summary.link_funding_instruments.append(link_funding_instrument)

    if request.funding_categories:
        for category in request.funding_categories:
            link_funding_category = LinkOpportunitySummaryFundingCategory(funding_category=category)
            opportunity_summary.link_funding_categories.append(link_funding_category)

    if request.applicant_types:
        for applicant_type in request.applicant_types:
            link_applicant_type = LinkOpportunitySummaryApplicantType(applicant_type=applicant_type)
            opportunity_summary.link_applicant_types.append(link_applicant_type)

    logger.info(
        "Created opportunity summary",
        extra={
            "opportunity_id": opportunity_id,
            "opportunity_summary_id": opportunity_summary.opportunity_summary_id,
            "is_forecast": request.is_forecast
        },
    )

    return opportunity_summary
