import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserSavedOpportunity
from src.services.opportunities_v1.get_opportunity import get_opportunity

logger = logging.getLogger(__name__)


def create_saved_opportunity(db_session: db.Session, user_id: UUID, json_data: dict) -> None:
    """
    Create or reactivate a saved opportunity for a user.

    """
    # Validate opportunity exists
    opportunity_id = json_data["opportunity_id"]
    get_opportunity(db_session, opportunity_id)
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
