import logging
from uuid import UUID

from src.adapters import db
from src.services.users.get_user_api_keys import get_user_api_key

logger = logging.getLogger(__name__)


def delete_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> None:
    """Delete an API key for a user"""
    api_key = get_user_api_key(db_session, user_id, api_key_id)

    db_session.delete(api_key)

    logger.info(
        "Deleted API key",
        extra={
            "api_key_id": api_key_id,
            "user_id": user_id,
        },
    )
