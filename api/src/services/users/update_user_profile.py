import logging
from uuid import UUID

from pydantic import BaseModel

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

    user_profile = db_session.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user_profile:
        logger.info(f"Creating new user profile for user_id: {user_id}")
        user_profile = UserProfile(user_id=user_id)

    user_profile.first_name = user_input.first_name
    user_profile.last_name = user_input.last_name
    user_profile.middle_name = user_input.middle_name

    db_session.add(user_profile)

    return user_profile
