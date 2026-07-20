from uuid import UUID

from grants_shared.adapters import db

from src.auth.api_key_handler import SimplerApiKeyHandler
from src.db.models.user_models import UserApiKey


class CreateApiKeyParams:
    """Simple parameter extraction for API key creation"""

    def __init__(self, json_data: dict):
        self.key_name = json_data["key_name"]


def create_api_key(db_session: db.Session, user_id: UUID, json_data: dict) -> UserApiKey:
    params = CreateApiKeyParams(json_data)
    key_name = params.key_name

    return SimplerApiKeyHandler(db_session).create_api_key(user_id, key_name)
