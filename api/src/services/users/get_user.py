import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import LinkExternalUser

logger = logging.getLogger(__name__)


def _fetch_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser:
    stmt = select(LinkExternalUser).where(LinkExternalUser.user_id == user_id)

    user = db_session.execute(stmt).scalar_one_or_none()

    if user is None:
        raise_flask_error(404, message="User does not exist")

    return user


def get_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser:
    return _fetch_user(db_session, user_id)
