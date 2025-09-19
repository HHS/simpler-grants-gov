from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import LinkExternalUser, User


class UserWithProfile(BaseModel):
    user_id: UUID
    email: str
    external_user_type: ExternalUserType
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None


def _fetch_user(db_session: db.Session, user_id: UUID) -> LinkExternalUser | None:
    stmt = (
        select(LinkExternalUser)
        .options(selectinload(LinkExternalUser.user).selectinload(User.profile))
        .where(LinkExternalUser.user_id == user_id)
    )

    user = db_session.execute(stmt).scalar_one_or_none()

    return user


def get_user(db_session: db.Session, user_id: UUID) -> UserWithProfile | None:
    external_user = _fetch_user(db_session, user_id)

    if external_user:
        profile = external_user.user.profile
        return UserWithProfile(
            user_id=external_user.user_id,
            email=external_user.email,
            external_user_type=external_user.external_user_type,
            first_name=profile.first_name if profile else None,
            middle_name=profile.middle_name if profile else None,
            last_name=profile.last_name if profile else None,
        )

    return None
