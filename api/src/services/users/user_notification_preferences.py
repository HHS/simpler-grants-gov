import logging

from sqlalchemy import select

import src.adapters.db as db
from src.constants.lookup_constants import NotificationType
from src.db.models.user_models import User, UserNotificationPreference

logger = logging.getLogger(__name__)


def update_or_create_user_notification_preference(
    db_session: db.Session,
    user: User,
    notification_type: NotificationType,
    is_enabled: bool,
) -> UserNotificationPreference:
    """
    Create or update a user's notification preference for a given notification type.
    """
    preference = db_session.execute(
        select(UserNotificationPreference)
        .where(UserNotificationPreference.user_id == user.user_id)
        .where(UserNotificationPreference.notification_type == notification_type)
    ).scalar_one_or_none()

    if preference is None:
        preference = UserNotificationPreference(
            user_id=user.user_id,
            notification_type=notification_type,
        )

    preference.is_enabled = is_enabled

    db_session.add(preference)

    logger.info(
        "Modified user notification preference",
        extra={
            "notification_type": notification_type,
            "is_enabled": is_enabled,
        },
    )

    return preference
