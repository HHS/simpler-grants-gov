import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity

logger = logging.getLogger(__name__)


def _validate_opportunity(db_session: db.Session, opportunity_id: UUID) -> None:
    """Validate that an opportunity exists and is not in draft status."""
    opportunity = db_session.execute(
        select(Opportunity).where(
            Opportunity.opportunity_id == opportunity_id, Opportunity.is_draft.is_(False)
        )
    ).scalar_one_or_none()
    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")


def create_saved_opportunity(db_session: db.Session, user_id: UUID, json_data: dict) -> None:
    """
    Create or reactivate a saved opportunity for a user.

    """
    # Validate opportunity exists
    opportunity_id = json_data["opportunity_id"]
    _validate_opportunity(db_session, opportunity_id)
    # Check if a previously deleted saved opportunity exists for this user
    record = db_session.execute(
        select(UserSavedOpportunity).filter(
            UserSavedOpportunity.user_id == user_id,
            UserSavedOpportunity.opportunity_id == json_data["opportunity_id"],
        )
    ).scalar_one_or_none()

    if record:
        # Reactivate previously deleted saved opportunity
        logger.info(
            "Reactivating previously deleted saved opportunity.",
            extra={"user_id": record.user_id, "opportunity_id": record.opportunity_id},
        )
        record.is_deleted = False
    else:
        # Create a new saved opportunity
        logger.info(
            "Saving new opportunity.",
            extra={"user_id": user_id, "opportunity_id": json_data["opportunity_id"]},
        )

        saved_opportunity = UserSavedOpportunity(
            user_id=user_id, opportunity_id=json_data["opportunity_id"]
        )
        db_session.add(saved_opportunity)
