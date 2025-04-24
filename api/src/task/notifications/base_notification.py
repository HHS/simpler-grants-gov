import logging
import uuid
from abc import abstractmethod

from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import UserNotificationLog
from src.task.notifications.constants import UserEmailNotification
from src.task.notifications.generate_notifications import NotificationTask

logger = logging.getLogger(__name__)


class BaseNotification(NotificationTask):

    @abstractmethod
    def collect_notifications(
        self,
    ) -> None:
        """Collect notifications for users"""
        pass

    @abstractmethod
    def prepare_notification(self) -> list[UserEmailNotification]:
        """Prepare notification content (email data)"""
        pass

    @abstractmethod
    def update_last_notified_timestamp(self, user_id: uuid.UUID) -> None:
        """Record the time a notification was last sent to the user in the database"""

    def notification_data(self) -> list[UserEmailNotification]:
        """Fetch collected notifications and prepare email data."""
        self.collect_notifications()
        return self.prepare_notification()

    def send_notifications(self, data: list[UserEmailNotification]) -> None:
        """Send collected notifications to users"""

        for user_notification in data:
            logger.info(
                "Sending notification to user",
                extra={
                    "user_id": user_notification.user_id,
                },
            )
            notification_log = UserNotificationLog(
                user_notification_log_id=uuid.uuid4(),
                user_id=user_notification.user_id,
                notification_reason=user_notification.notification_reason,
                notification_sent=False,  # Default to False, update on success
            )
            self.db_session.add(notification_log)
            try:
                send_pinpoint_email_raw(
                    to_address=user_notification.user_email,
                    subject=user_notification.subject,
                    message=user_notification.content,
                    pinpoint_client=self.pinpoint_client,
                    app_id=self.generate_notification_config.app_id,
                )
                logger.info(
                    "Successfully sent notification to user",
                    extra={
                        "user_id": user_notification.user_id,
                        "notification_reason": user_notification.notification_reason,
                        "notification_log_id": notification_log.user_notification_log_id,
                    },
                )
                notification_log.notification_sent = True

                self.update_last_notified_timestamp(user_notification.user_id)

            except Exception:
                # Notification log will be updated in the finally block
                logger.exception(
                    "Failed to send notification email",
                    extra={
                        "user_id": user_notification.user_id,
                        "email": user_notification.user_email,
                        "notification_reason": user_notification.notification_reason,
                    },
                )
