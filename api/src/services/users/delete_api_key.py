import logging
from uuid import UUID

from grants_shared.adapters import db

from src.auth.api_key_handler import SimplerApiKeyHandler

logger = logging.getLogger(__name__)


def delete_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> None:
    """Delete an API key for a user"""
    SimplerApiKeyHandler(db_session).delete_api_key(user_id, api_key_id)
