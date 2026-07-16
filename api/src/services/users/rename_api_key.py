import logging
from uuid import UUID

from grants_shared.adapters import db

from src.auth.api_key_handler import SimplerApiKeyHandler
from src.db.models.user_models import UserApiKey

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
    return SimplerApiKeyHandler(db_session).rename_api_key(user_id, api_key_id, params.key_name)
