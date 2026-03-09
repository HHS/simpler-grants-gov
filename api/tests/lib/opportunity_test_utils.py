"""Test utilities for opportunity-related tests."""

import uuid
from datetime import date

from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
)


def create_opportunity_request(
    agency_id=None,
    opportunity_number=None,
    opportunity_title="Research Grant for Climate Innovation",
    category=OpportunityCategory.DISCRETIONARY,
    category_explanation="Competitive research grant",
):
    """Create a valid opportunity creation request.

    Args:
        agency_id: UUID of the agency (as string)
        **kwargs: Additional fields to include in the request

    Returns:
        dict: A valid opportunity creation request
    """

    if not agency_id:
        agency_id = uuid.uuid4()

    if not opportunity_number:
        opportunity_number = f"TEST-{uuid.uuid4().hex[:3]}"

    request = {
        "opportunity_number": opportunity_number,
        "opportunity_title": opportunity_title,
        "agency_id": str(agency_id),
        "category": category,
        "category_explanation": category_explanation,
    }

    return request


def build_opportunity_list_request_body(
    page_offset=1,
    page_size=25,
    sort_order=None,
    filters=None,
):
    """Create a valid list opportunities request.

    Args:
        page_offset: Page offset (default: 1)
        page_size: Page size (default: 25)
        sort_order: Optional list of sort orders
        filters: Optional filters

    Returns:
        Dictionary with the request JSON
    """
    request = {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
        }
    }

    if sort_order:
        request["pagination"]["sort_order"] = sort_order

    if filters:
        request["filters"] = filters

    return request


def create_opportunity_summary_request(
    legacy_opportunity_id=None,
    is_forecast=False,
    summary_description="Test summary description",
    is_cost_sharing=True,
    post_date=None,
    close_date=None,
    close_date_description="Applications due by end of year",
    expected_number_of_awards=5,
    estimated_total_program_funding=1000000,
    award_floor=50000,
    award_ceiling=200000,
    funding_instruments=None,
    funding_categories=None,
    applicant_types=None,
    agency_contact_description="Contact Jane Doe at agency X.",
    agency_email_address="contact@agency.gov",
    agency_email_address_description="Email the agency",
):
    """Create a valid opportunity summary creation request.

    Args:
        legacy_opportunity_id: Optional legacy opportunity ID
        is_forecast: Whether the summary is a forecast (default: False)
        summary_description: Description of the opportunity
        is_cost_sharing: Whether cost sharing is required
        post_date: Post date (default: None)
        close_date: Close date (default: None)
        close_date_description: Description of the close date
        expected_number_of_awards: Expected number of awards
        estimated_total_program_funding: Estimated total program funding
        award_floor: Minimum award amount
        award_ceiling: Maximum award amount

    Returns:
        dict: A valid opportunity summary creation request
    """

    # Set default dates if not provided
    if post_date is None:
        post_date = date.today().isoformat()
    elif isinstance(post_date, date):
        post_date = post_date.isoformat()

    if close_date is None:
        close_date = date.today().isoformat()
    elif isinstance(close_date, date):
        close_date = close_date.isoformat()

    # Set default values for the collections if not provided
    if funding_instruments is None:
        funding_instruments = [FundingInstrument.GRANT, FundingInstrument.COOPERATIVE_AGREEMENT]

    if funding_categories is None:
        funding_categories = [FundingCategory.AGRICULTURE]

    if applicant_types is None:
        applicant_types = [ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS]

    request = {
        "legacy_opportunity_id": legacy_opportunity_id,
        "is_forecast": is_forecast,
        "summary_description": summary_description,
        "is_cost_sharing": is_cost_sharing,
        "post_date": post_date,
        "close_date": close_date,
        "close_date_description": close_date_description,
        "expected_number_of_awards": expected_number_of_awards,
        "estimated_total_program_funding": estimated_total_program_funding,
        "award_floor": award_floor,
        "award_ceiling": award_ceiling,
        "funding_instruments": funding_instruments,
        "funding_categories": funding_categories,
        "applicant_types": applicant_types,
        "agency_contact_description": agency_contact_description,
        "agency_email_address": agency_email_address,
        "agency_email_address_description": agency_email_address_description,
    }

    return request
