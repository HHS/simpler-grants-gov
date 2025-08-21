"""Transformation utilities for converting native models to CommonGrants Protocol format."""

import logging

from common_grants_sdk.schemas.fields import SingleDateEvent
from common_grants_sdk.schemas.models.opp_base import OpportunityBase
from common_grants_sdk.schemas.models.opp_funding import OppFunding
from common_grants_sdk.schemas.models.opp_status import OppStatus, OppStatusOptions
from common_grants_sdk.schemas.models.opp_timeline import OppTimeline

from src.db.models.opportunity_models import Opportunity

logger = logging.getLogger(__name__)


def _validate_and_fix_url(url: str | None) -> str | None:
    """
    Validate and fix a URL string.

    Args:
        url: The URL string to validate and fix

    Returns:
        A valid URL string or None if the URL cannot be fixed
    """
    if not url:
        return None

    # If the URL already has a protocol, return it as is
    if url.startswith(("http://", "https://")):
        return url

    # If it's a domain without protocol, add https://
    if "." in url and not url.startswith(("http://", "https://", "ftp://", "file://")):
        return f"https://{url}"

    # If it's not a valid URL format, return None
    return None


def transform_opportunity_to_common_grants(opportunity: Opportunity) -> OpportunityBase:
    """
    Transform a native Opportunity model to CommonGrants Protocol format.

    Args:
        opportunity: The native Opportunity model from the database

    Returns:
        OpportunityBase: The opportunity in CommonGrants Protocol format
    """
    # Map opportunity status to CommonGrants status
    status_mapping = {
        "posted": OppStatusOptions.OPEN,
        "archived": OppStatusOptions.CUSTOM,
        "forecasted": OppStatusOptions.FORECASTED,
        "closed": OppStatusOptions.CLOSED,
    }

    opp_status = status_mapping.get(
        opportunity.opportunity_status.value if opportunity.opportunity_status else "posted",
        OppStatusOptions.CUSTOM,
    )

    # Create timeline
    timeline = OppTimeline(
        postDate=(
            SingleDateEvent(
                name="Opportunity Posted",
                date=opportunity.created_at.date() if opportunity.created_at else None,
                description="Date when the opportunity was first posted",
            )
            if opportunity.created_at
            else None
        ),
        closeDate=(
            SingleDateEvent(
                name="Application Deadline",
                date=opportunity.current_opportunity_summary.opportunity_summary.close_date,
                description="Deadline for submitting applications",
            )
            if (
                opportunity.current_opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary.close_date
            )
            else None
        ),
    )

    # Create funding info
    from common_grants_sdk.schemas.fields import Money

    # Create Money objects step by step
    total_amount_money = None
    if (
        opportunity.current_opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary.estimated_total_program_funding
        is not None
    ):
        total_amount_money = Money(
            amount=str(
                opportunity.current_opportunity_summary.opportunity_summary.estimated_total_program_funding
            ),
            currency="USD",
        )

    max_award_money = None
    if (
        opportunity.current_opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary.award_ceiling is not None
    ):
        max_award_money = Money(
            amount=str(opportunity.current_opportunity_summary.opportunity_summary.award_ceiling),
            currency="USD",
        )

    min_award_money = None
    if (
        opportunity.current_opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary.award_floor is not None
    ):
        min_award_money = Money(
            amount=str(opportunity.current_opportunity_summary.opportunity_summary.award_floor),
            currency="USD",
        )

    funding = OppFunding(
        totalAmountAvailable=total_amount_money,
        maxAwardAmount=max_award_money,
        minAwardAmount=min_award_money,
    )

    return OpportunityBase(
        id=opportunity.opportunity_id,
        title=opportunity.opportunity_title or "Untitled Opportunity",
        description=(
            opportunity.current_opportunity_summary.opportunity_summary.summary_description
            if (
                opportunity.current_opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary.summary_description
            )
            else "No description available"
        ),
        status=OppStatus(value=opp_status),
        keyDates=timeline,
        funding=funding,
        source=_validate_and_fix_url(
            opportunity.current_opportunity_summary.opportunity_summary.additional_info_url
            if (
                opportunity.current_opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary
                and opportunity.current_opportunity_summary.opportunity_summary.additional_info_url
            )
            else None
        ),
        custom_fields=None,
        createdAt=opportunity.created_at,
        lastModifiedAt=opportunity.updated_at,
    )
