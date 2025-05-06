from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserSavedOpportunity


def create_saved_opportunity(db_session: db.Session, user_id: UUID, json_data: dict) -> None:
    # Check if the record exists
    record = db_session.execute(
        select(UserSavedOpportunity).filter(
            UserSavedOpportunity.user_id == user_id,
            UserSavedOpportunity.opportunity_id == json_data["opportunity_id"],
        )
    ).scalar_one_or_none()

    if record:
        record.is_deleted = False
    else:
        # Create the saved opportunity record
        saved_opportunity = UserSavedOpportunity(
            user_id=user_id, opportunity_id=json_data["opportunity_id"]
        )
        db_session.add(saved_opportunity)
