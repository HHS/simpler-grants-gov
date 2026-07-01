import logging
from collections.abc import Sequence
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.db.models.auth_base_models import BaseUserApiKey

from src.auth.auth_handler import get_auth_handler

logger = logging.getLogger(__name__)


def get_user_api_keys(db_session: db.Session, user_id: UUID) -> Sequence[BaseUserApiKey]:
    logger.info("Getting API keys for user", extra={"user_id": user_id})

    api_keys = get_auth_handler(db_session).list_api_keys_for_user(user_id)

    logger.info(
        "Retrieved API keys for user",
        extra={
            "user_id": user_id,
            "api_key_count": len(api_keys),
        },
    )

    return api_keys


def get_user_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> BaseUserApiKey:
    """Get a specific API key for a user"""
    logger.info(
        "Getting specific API key for user",
        extra={
            "user_id": user_id,
            "api_key_id": api_key_id,
        },
    )

    api_key = get_auth_handler(db_session).get_api_key_for_user(user_id, api_key_id)

    if api_key is None:
        raise_flask_error(404, "API key not found")

    logger.info(
        "Retrieved specific API key for user",
        extra={
            "user_id": user_id,
            "api_key_id": api_key_id,
        },
    )

    return api_key
