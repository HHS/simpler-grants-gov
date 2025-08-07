import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserApiKey
from src.util.api_key_gen import generate_api_key_id

logger = logging.getLogger(__name__)


class DuplicateKeyError(Exception):
    """Raised when attempting to create an API key with a duplicate (user_id, key_name) combination."""

    pass


def create_api_key(
    db_session: db.Session,
    user_id: UUID,
    key_name: str,
    is_active: bool = True,
) -> UserApiKey:
    # Check if a key with this user_id and key_name already exists
    existing_key = db_session.execute(
        select(UserApiKey).filter(
            UserApiKey.user_id == user_id,
            UserApiKey.key_name == key_name,
        )
    ).scalar_one_or_none()

    if existing_key:
        logger.warning(
            "Attempted to create duplicate API key",
            extra={"user_id": user_id, "key_name": key_name},
        )
        raise DuplicateKeyError(f"API key with name '{key_name}' already exists for user {user_id}")
    else:
        # Generate a new API key ID
        key_id = generate_api_key_id()

        # Create the new API key
        api_key = UserApiKey(
            user_id=user_id,
            key_name=key_name,
            key_id=key_id,
            is_active=is_active,
        )

        db_session.add(api_key)

        logger.info(
            "Created new API key",
            extra={
                "api_key_id": api_key.api_key_id,
                "user_id": user_id,
                "key_name": key_name,
                "is_active": is_active,
            },
        )

        return api_key
