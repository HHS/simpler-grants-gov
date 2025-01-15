from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserSavedSearch


def get_saved_searches(db_session: db.Session, user_id: UUID) -> list[UserSavedSearch]:
    """Get all saved searches for a user"""
    saved_searches = (
        db_session.execute(
            select(UserSavedSearch)
            .where(UserSavedSearch.user_id == user_id)
            .order_by(UserSavedSearch.created_at.desc())
        )
        .scalars()
        .all()
    )

    return list(saved_searches)
