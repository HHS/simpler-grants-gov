import logging
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.adapters import db
from src.db.models.user_models import UserApiKey
from src.util.api_key_gen import generate_api_key_id

logger = logging.getLogger(__name__)

# Maximum number of retries for key generation
MAX_KEY_GENERATION_RETRIES = 5


class KeyGenerationError(Exception):
    """Raised when unable to generate a unique API key after multiple retries."""

    pass


def create_api_key(
    db_session: db.Session,
    user_id: UUID,
    key_name: str,
    is_active: bool = True,
) -> UserApiKey:

    # Generate a unique key_id with collision detection
    key_id = _generate_unique_key_id(db_session)

    # Create the new API key
    api_key = UserApiKey(
        api_key_id=uuid.uuid4(),
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


def _generate_unique_key_id(db_session: db.Session) -> str:
    for attempt in range(MAX_KEY_GENERATION_RETRIES):
        key_id = generate_api_key_id()

        # Check if this key_id already exists
        existing_key = db_session.execute(
            select(UserApiKey).filter(UserApiKey.key_id == key_id)
        ).scalar_one_or_none()

        if existing_key is None:
            return key_id

    # If we get here, we failed to generate a unique key after all retries
    logger.error(
        "Failed to generate unique key_id after maximum retries",
        extra={"max_retries": MAX_KEY_GENERATION_RETRIES},
    )
    raise KeyGenerationError(
        f"Unable to generate unique API key after {MAX_KEY_GENERATION_RETRIES} attempts"
    )
