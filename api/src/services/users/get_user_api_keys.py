import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserApiKey

logger = logging.getLogger(__name__)


def get_user_api_keys(db_session: db.Session, user_id: UUID) -> list[UserApiKey]:
    logger.info("Getting API keys for user", extra={"user_id": user_id})

    result = db_session.execute(
        select(UserApiKey)
        .where(UserApiKey.user_id == user_id)
        .order_by(UserApiKey.created_at.desc())
    )

    api_keys = list(result.scalars().all())

    logger.info(
        "Retrieved API keys for user",
        extra={
            "user_id": user_id,
            "api_key_count": len(api_keys),
        },
    )

    return api_keys


def get_user_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> UserApiKey:
    """Get a specific API key for a user"""
    logger.info(
        "Getting specific API key for user",
        extra={
            "user_id": user_id,
            "api_key_id": api_key_id,
        },
    )

    api_key = db_session.execute(
        select(UserApiKey).filter(
            UserApiKey.api_key_id == api_key_id,
            UserApiKey.user_id == user_id,
        )
    ).scalar_one_or_none()

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
