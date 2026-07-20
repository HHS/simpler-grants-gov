import logging
from collections.abc import Sequence
from uuid import UUID

from grants_shared.adapters import db

from src.auth.api_key_handler import SimplerApiKeyHandler
from src.db.models.user_models import UserApiKey

logger = logging.getLogger(__name__)


def get_user_api_keys(db_session: db.Session, user_id: UUID) -> Sequence[UserApiKey]:
    return SimplerApiKeyHandler(db_session).get_user_api_keys(user_id)


def get_user_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> UserApiKey:
    """Get a specific API key for a user"""
    return SimplerApiKeyHandler(db_session).get_user_api_key(user_id, api_key_id)
