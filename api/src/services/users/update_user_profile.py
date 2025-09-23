import logging
from uuid import UUID

from pydantic import BaseModel

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserProfile

logger = logging.getLogger(__name__)


class UpdateUserProfileInput(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None


def update_user_profile(db_session: db.Session, user_id: UUID, json_data: dict) -> UserProfile | None:
    input = UpdateUserProfileInput.model_validate(json_data)

    user_profile = db_session.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user_profile:
        raise_flask_error(404, f"User profile not found for user_id: {user_id}")

    if input.first_name:
        user_profile.first_name = input.first_name
    if input.middle_name:
        user_profile.middle_name = input.middle_name
    if input.last_name:
        user_profile.last_name = input.last_name

    return user_profile
