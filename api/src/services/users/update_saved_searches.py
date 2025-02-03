from uuid import UUID

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserSavedSearch


def update_saved_search(
    db_session: db.Session, user_id: UUID, saved_search_id: UUID, json_data: dict
) -> UserSavedSearch:
    """Update saved search for a user"""
    saved_search = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.saved_search_id == saved_search_id, UserSavedSearch.user_id == user_id
        )
        .first()
    )

    if not saved_search:
        raise_flask_error(404, "Saved search not found")

    # Update
    saved_search.name = json_data["name"]

    return saved_search
