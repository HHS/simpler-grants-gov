import logging
from uuid import UUID

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
    validate_opportunity_is_draft,
)

logger = logging.getLogger(__name__)


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


def _get_opportunity_summary(
    opportunity: Opportunity, opportunity_summary_id: UUID, summary_data: dict
) -> OpportunitySummary:
    """Check for existing opportunity summary and validate update request"""
    summary = None
    for summary_obj in opportunity.all_opportunity_summaries:
        if summary_obj.opportunity_summary_id == opportunity_summary_id:
            summary = summary_obj
            break

    if summary is None:
        raise_flask_error(
            404, f"Could not find Opportunity Summary with ID {opportunity_summary_id}"
        )

    return summary


def create_opportunity_summary(
    db_session: db.Session, opportunity_id: UUID, summary_data: dict, user: User
) -> OpportunitySummary:
    """Create a new opportunity summary"""
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to view/edit opportunities for this agency
    agency = opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, agency)

    _check_existing_summary(opportunity, summary_data["is_forecast"])
    validate_opportunity_is_draft(opportunity)
    validate_opportunity_created_in_simpler_grants(opportunity)

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


def update_opportunity_summary(
    db_session: db.Session,
    opportunity_id: UUID,
    opportunity_summary_id: UUID,
    summary_data: dict,
    user: User,
) -> OpportunitySummary:
    """Update an opportunity summary"""
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to view/edit opportunities for this agency
    agency = opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, agency)

    validate_opportunity_is_draft(opportunity)
    validate_opportunity_created_in_simpler_grants(opportunity)

    # Get and validate the opportunity summary
    summary = _get_opportunity_summary(opportunity, opportunity_summary_id, summary_data)

    # Update all fields from the request body
    for field, value in summary_data.items():
        setattr(summary, field, value)

    logger.info(
        "Updated opportunity summary",
        extra={
            "opportunity_id": opportunity_id,
            "opportunity_summary_id": opportunity_summary_id,
        },
    )

    return summary
