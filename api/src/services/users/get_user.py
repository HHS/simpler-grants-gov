import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import LinkExternalUser, User

logger = logging.getLogger(__name__)


def _fetch_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser | None:
    stmt = (
        select(LinkExternalUser)
        .options(selectinload(LinkExternalUser.user).selectinload(User.profile))
        .where(LinkExternalUser.user_id == user_id)
    )

    user = db_session.execute(stmt).scalar_one_or_none()

    return user


def get_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser | None:
    external_user = _fetch_user(db_session, user_id)

    if not external_user:
        raise_flask_error(404, f"User ID: {user_id}  not found")

    return external_user
