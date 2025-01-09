import logging
from uuid import UUID

from sqlalchemy import db

from src.db.models.user_models import UserSavedSearch

logger = logging.getLogger(__name__)


def create_saved_search(db_session: db.Session, user_id: UUID, json_data: dict) -> UserSavedSearch:
    saved_search = UserSavedSearch(
        user_id=user_id, name=json_data["name"], search_query=json_data["search_query"]
    )

    with db_session.begin():
        db_session.add(saved_search)

    return saved_search
