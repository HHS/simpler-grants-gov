import logging
import uuid

from sqlalchemy import select

from src.adapters import db
from src.constants.lookup_constants import NotificationType
from src.db.models.user_models import UserNotificationPreference
from src.task.notifications.constants import NOTIFICATION_TYPE_DEFAULTS

logger = logging.getLogger(__name__)


def get_all_opportunities_notification_preference(
    db_session: db.Session, user_id: uuid.UUID
) -> dict:
    """Returns the user's all_new_opportunities preference, falling back to the type's default."""
    notification_type = NotificationType.ALL_NEW_OPPORTUNITIES

    is_enabled = db_session.execute(
        select(UserNotificationPreference.is_enabled).where(
            UserNotificationPreference.user_id == user_id,
            UserNotificationPreference.notification_type == notification_type,
        )
    ).scalar_one_or_none()

    if is_enabled is None:
        is_enabled = NOTIFICATION_TYPE_DEFAULTS[notification_type]

    logger.info(
        "Fetched all opportunities notification preference",
        extra={"user_id": user_id, "is_enabled": is_enabled},
    )

    return {"is_enabled": is_enabled}
