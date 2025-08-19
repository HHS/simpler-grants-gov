import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
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
