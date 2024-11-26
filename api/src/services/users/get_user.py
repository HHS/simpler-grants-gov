from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import LinkExternalUser


def _fetch_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser | None:
    stmt = select(LinkExternalUser).where(LinkExternalUser.user_id == user_id)

    user = db_session.execute(stmt).scalar_one_or_none()

    return user


def get_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser | None:
    return _fetch_user(db_session, user_id)
