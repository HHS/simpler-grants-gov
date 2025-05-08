from uuid import UUID

from sqlalchemy import update

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserSavedSearch


def delete_saved_search(db_session: db.Session, user_id: UUID, saved_search_id: UUID) -> None:
    result = db_session.execute(
        update(UserSavedSearch)
        .where(
            UserSavedSearch.saved_search_id == saved_search_id, UserSavedSearch.user_id == user_id
        )
        .values(is_deleted=True)
    )

    if result.rowcount == 0:
        raise_flask_error(404, "Saved search not found")
