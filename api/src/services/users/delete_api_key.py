import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserApiKey

logger = logging.getLogger(__name__)


def delete_api_key(db_session: db.Session, user_id: UUID, api_key_id: UUID) -> None:
    api_key = db_session.execute(
        select(UserApiKey).where(
            UserApiKey.api_key_id == api_key_id,
            UserApiKey.user_id == user_id,
        )
    ).scalar_one_or_none()

    if not api_key:
        raise_flask_error(404, "API key not found")

    key_name = api_key.key_name

    db_session.delete(api_key)

    logger.info(
        "Deleted API key",
        extra={
            "api_key_id": api_key_id,
            "user_id": user_id,
            "key_name": key_name,
        },
    )
