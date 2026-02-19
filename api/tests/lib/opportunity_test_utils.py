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
