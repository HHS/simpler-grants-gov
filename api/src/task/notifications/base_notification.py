import logging
from abc import abstractmethod
from typing import Any
from uuid import UUID

import botocore.client
from sqlalchemy import select

from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import User, UserNotificationLog
from src.task.notifications.constants import EmailData
from src.task.task import Task

logger = logging.getLogger(__name__)


class BaseNotification(Task):

    @abstractmethod
    def collect_notifications(
        self,
    ) -> dict[UUID, list[Any]] | None:
        """Collect notifications for users"""
        pass

    @abstractmethod
    def prepare_notification(self, saved_data: dict[UUID, list[Any]]) -> EmailData:
        """Prepare notification content (email data)"""
        pass

    def notification_data(self) -> EmailData | None:
        """Fetch collected notifications and prepare email data."""
        collected_data: dict[UUID, list[Any]] | None = self.collect_notifications()
        if collected_data:
            return self.prepare_notification(collected_data)
        return None

    def _get_user_email(self, user_id: UUID) -> str | None:

        # Fetch user details
        user = self.db_session.execute(
            select(User).where(User.user_id == user_id)
        ).scalar_one_or_none()

        if not user or not user.email:
            logger.warning(
                "No email found for user", extra={"user_id": user.user_id if user else None}
            )
            return None
        return user.email

    def send_notifications(
        self,
        data: EmailData,
        pinpoint_client: botocore.client.BaseClient | None,
        app_id: str | None,
    ) -> None:
        """Send collected notifications to users"""

        for email in data.to_addresses:
            for user_id, message in data.content.items():
                notification_log = UserNotificationLog(
                    user_id=user_id,
                    notification_reason=data.notification_reason,
                    notification_sent=False,  # Default to False, update on success
                )
                self.db_session.add(notification_log)
                try:
                    send_pinpoint_email_raw(
                        to_address=email,
                        subject=data.subject,
                        message=message,
                        pinpoint_client=pinpoint_client,
                        app_id=app_id,
                    )
                    logger.info(
                        "Successfully sent notification to user",
                        extra={
                            "user_id": user_id,
                        },
                    )
                    notification_log.notification_sent = True

                except Exception:
                    # Notification log will be updated in the finally block
                    logger.exception(
                        "Failed to send notification email",
                        extra={"user_id": user_id, "email": email},
                    )
