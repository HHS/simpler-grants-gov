from uuid import UUID

from src.adapters import db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.auth.api_key_handler import SimplerApiKeyHandler
from src.db.models.user_models import UserApiKey
from src.validation.validation_constants import ValidationErrorType


class CreateApiKeyParams:
    """Simple parameter extraction for API key creation"""

    def __init__(self, json_data: dict):
        self.key_name = json_data["key_name"]


def _check_duplicate_key_name(
    db_session: db.Session, user_id: UUID, key_name: str, exclude_api_key_id: UUID | None = None
) -> None:
    """Raise 422 if the user already has a key with this name (case-insensitive, trimmed)."""
    existing_keys = SimplerApiKeyHandler(db_session).get_user_api_keys(user_id)
    normalized = key_name.strip().lower()
    for key in existing_keys:
        if exclude_api_key_id and key.api_key_id == exclude_api_key_id:
            continue
        if key.key_name.strip().lower() == normalized:
            raise_flask_error(
                422,
                message="An API key with this name already exists",
                validation_issues=[
                    ValidationErrorDetail(
                        type=ValidationErrorType.DUPLICATE_API_KEY_NAME,
                        field="key_name",
                        message="An API key with this name already exists",
                    )
                ],
            )


def create_api_key(db_session: db.Session, user_id: UUID, json_data: dict) -> UserApiKey:
    params = CreateApiKeyParams(json_data)
    key_name = params.key_name

    _check_duplicate_key_name(db_session, user_id, key_name)

    return SimplerApiKeyHandler(db_session).create_api_key(user_id, key_name)
