import logging
from uuid import UUID

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.services.opportunities_v1.get_opportunity import get_opportunity

from src.constants.lookup_constants import ApplicantType, FundingCategory, FundingInstrument
from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import date

logger = logging.getLogger(__name__)

class OpportunitySummaryCreateRequest(BaseModel):
    legacy_opportunity_id: int
    is_forecast: bool
    summary_description: Optional[str] = None
    is_cost_sharing: Optional[bool] = None
    post_date: Optional[date] = None
    close_date: Optional[date] = None
    close_date_description: Optional[str] = None
    archive_date: Optional[date] = None
    expected_number_of_awards: Optional[int] = None
    estimated_total_program_funding: Optional[int] = None
    award_floor: Optional[int] = None
    award_ceiling: Optional[int] = None
    additional_info_url: Optional[str] = None
    additional_info_url_description: Optional[str] = None
    funding_categories: Optional[List[FundingCategory]] = None
    funding_category_description: Optional[str] = None
    funding_instruments: Optional[List[FundingInstrument]] = None
    applicant_types: Optional[List[ApplicantType]] = None
    applicant_eligibility_description: Optional[str] = None
    agency_contact_description: Optional[str] = None
    agency_email_address: Optional[str] = None
    agency_email_address_description: Optional[str] = None
    forecasted_post_date: Optional[date] = None
    forecasted_close_date: Optional[date] = None
    forecasted_close_date_description: Optional[str] = None
    forecasted_award_date: Optional[date] = None
    forecasted_project_start_date: Optional[date] = None
    fiscal_year: Optional[int] = None
    
    @validator('award_ceiling')
    def validate_award_ceiling(cls, v, values):
        if 'award_floor' in values and values['award_floor'] is not None and v is not None:
            if values['award_floor'] > v:
                raise ValueError('Award floor must be less than or equal to award ceiling')
        return v
    
    @validator('close_date')
    def validate_close_date(cls, v, values):
        if 'post_date' in values and values['post_date'] is not None and v is not None:
            if values['post_date'] > v:
                raise ValueError('Post date must be less than or equal to close date')
        return v

def create_opportunity_summary(db_session: db.Session, opportunity_id: UUID, summary_data: dic, user) -> OpportunitySummary:
    request = OpportunitySummaryCreateRequest(**summary_data)
    
    # Fetch the opportunity
    opportunity = get_opportunity(db_session, opportunity_id)
    
    # Verify the user has permission to edit this opportunity
    agency = opportunity.agency_record
    verify_access(current_user, {Privilege.UPDATE_OPPORTUNITY}, agency)
    
    # Check if a summary of the same type already exists
    is_forecast = request.is_forecast
    if is_forecast:
        existing_summary = opportunity.forecast_summary
    else:
        existing_summary = opportunity.non_forecast_summary
    
    if existing_summary:
        raise_flask_error(422, f"An opportunity summary of type {'forecast' if is_forecast else 'non-forecast'} already exists")
    
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
            "opportunity_summary_id": str(opportunity_summary.opportunity_summary_id)
        }
    )
    
    return opportunity_summary