from uuid import UUID

from src.adapters import db
from src.db.models.user_models import UserSavedOpportunity


def delete_saved_opportunity(db_session: db.Session, user_id: UUID, opportunity_id: int) -> int:
    return (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == user_id,
            UserSavedOpportunity.opportunity_id == opportunity_id,
        )
        .delete()
    )
