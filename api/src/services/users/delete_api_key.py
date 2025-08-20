import logging
from uuid import UUID

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.services.users.get_user_api_keys import get_user_api_keys

logger = logging.getLogger(__name__)


def delete_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> None:
    """Delete an API key for a user"""
    # Reuse the get_user_api_keys service to fetch all user's API keys
    api_keys = get_user_api_keys(db_session, user_id)

    # Find the specific API key to delete
    api_key = next((key for key in api_keys if key.api_key_id == api_key_id), None)

    if not api_key:
        raise_flask_error(404, "API key not found")

    db_session.delete(api_key)

    logger.info(
        "Deleted API key",
        extra={
            "api_key_id": api_key_id,
            "user_id": user_id,
        },
    )
