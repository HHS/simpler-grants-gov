"""Test utilities for opportunity-related tests."""

import uuid

from src.constants.lookup_constants import OpportunityCategory


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
