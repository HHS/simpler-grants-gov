import logging
from uuid import UUID

from src.adapters import db
from src.auth.api_key_handler import SimplerApiKeyHandler
from src.db.models.user_models import UserApiKey
from src.services.users.create_api_key import _check_duplicate_key_name

logger = logging.getLogger(__name__)


class RenameApiKeyParams:
    """Simple parameter extraction for API key renaming"""

    def __init__(self, json_data: dict):
        self.key_name = json_data["key_name"]


def rename_api_key(
    db_session: db.Session, user_id: UUID, api_key_id: UUID, json_data: dict
) -> UserApiKey:
    """Rename an existing API key for a user"""
    params = RenameApiKeyParams(json_data)
    key_name = params.key_name

    _check_duplicate_key_name(db_session, user_id, key_name, exclude_api_key_id=api_key_id)

    return SimplerApiKeyHandler(db_session).rename_api_key(user_id, api_key_id, key_name)
