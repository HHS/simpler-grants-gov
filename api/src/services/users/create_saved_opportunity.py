import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserSavedOpportunity

logger = logging.getLogger(__name__)


def create_saved_opportunity(db_session: db.Session, user_id: UUID, json_data: dict) -> None:
    # Check if the record exists
    record = db_session.execute(
        select(UserSavedOpportunity).filter(
            UserSavedOpportunity.user_id == user_id,
            UserSavedOpportunity.opportunity_id == json_data["opportunity_id"],
        )
    ).scalar_one_or_none()

    if record:
        logger.info(
            "Reactivating previously deleted opportunity. ",
            extra={"user_id": record.user_id, "opportunity_id": record.opportunity_id},
        )
        record.is_deleted = False
    else:
        # Create the saved opportunity record
        logger.info(
            "Saving new opportunity.",
            extra={"user_id": user_id, "opportunity_id": json_data["opportunity_id"]},
        )

        saved_opportunity = UserSavedOpportunity(
            user_id=user_id, opportunity_id=json_data["opportunity_id"]
        )
        db_session.add(saved_opportunity)
