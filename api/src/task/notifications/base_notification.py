import logging
import uuid
from pydantic import Field

import botocore.client
from abc import abstractmethod
from src.adapters import db
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import UserNotificationLog
from src.task.notifications.constants import UserEmailNotification, Metrics
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

class SendNotificationsConfig(PydanticBaseEnvConfig):
    app_id: str = Field(alias="PINPOINT_APP_ID")
    frontend_base_url: str = Field(alias="FRONTEND_BASE_URL")

class BaseNotification(Task):
    def __init__(self,  db_session: db.Session, pinpoint_client: botocore.client.BaseClient | None = None, notification_config: SendNotificationsConfig | None = None):
        super().__init__(db_session, )

        self.pinpoint_client = pinpoint_client
        if notification_config is None:
            notification_config = SendNotificationsConfig()
        self.notification_config = notification_config


    @abstractmethod
    def collect_email_notifications(
        self,
    ) -> list[UserEmailNotification]:
        """Collect email notifications for users"""
        pass

    @abstractmethod
    def post_notifications_process(self, notifications : list[UserEmailNotification]) -> None:
        """Fetch collected notifications and prepare email data."""
        pass

    def send_notifications(self, notifications: list[UserEmailNotification]) -> None:
        """Send collected notifications to users"""

        for user_notification in notifications:
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
                    app_id=self.notification_config.app_id,
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
                user_notification.is_notified = True

                self.increment(Metrics.USERS_NOTIFIED)

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

    def run_task(self) -> None:
        """Override to define the task logic"""
        notifications = self.collect_email_notifications()
        self.send_notifications(notifications)
        self.post_notifications_process(notifications)
