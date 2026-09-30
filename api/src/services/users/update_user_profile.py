import logging
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserProfile

logger = logging.getLogger(__name__)


class UpdateUserProfileInput(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None


def update_user_profile(db_session: db.Session, user_id: UUID, json_data: dict) -> UserProfile:
    """Update user profile for a user"""
    user_input = UpdateUserProfileInput.model_validate(json_data)

    user_profile = db_session.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalar_one_or_none()
    if not user_profile:
        logger.info("Creating new user profile for user")
        user_profile = UserProfile(user_id=user_id, user_profile_id=uuid4())

    user_profile.first_name = user_input.first_name
    user_profile.last_name = user_input.last_name
    user_profile.middle_name = user_input.middle_name

    db_session.add(user_profile)

    return user_profile
