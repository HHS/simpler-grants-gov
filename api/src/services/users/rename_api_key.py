import logging
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.db.models.auth_base_models import BaseUserApiKey

from src.services.users.get_user_api_keys import get_user_api_key

logger = logging.getLogger(__name__)


class RenameApiKeyParams:
    """Simple parameter extraction for API key renaming"""

    def __init__(self, json_data: dict):
        self.key_name = json_data["key_name"]


def rename_api_key(
    db_session: db.Session, user_id: UUID, api_key_id: UUID, json_data: dict
) -> BaseUserApiKey:
    """Rename an existing API key for a user"""
    params = RenameApiKeyParams(json_data)

    api_key = get_user_api_key(db_session, user_id, api_key_id)

    api_key.key_name = params.key_name

    logger.info(
        "Renamed API key",
        extra=api_key.get_log_extra(),
    )

    return api_key
