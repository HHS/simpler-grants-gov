import logging
import uuid
from abc import abstractmethod

from src.adapters import db
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import UserNotificationLog
from src.task.notifications import constants
from src.task.notifications.config import EmailNotificationConfig, get_email_config
from src.task.notifications.constants import Metrics, UserEmailNotification
from src.task.task import Task

logger = logging.getLogger(__name__)


class BaseNotificationTask(Task):
    Metrics = constants.Metrics  # type: ignore[assignment]

    def __init__(
        self,
        db_session: db.Session,
        notification_config: EmailNotificationConfig | None = None,
    ):
        super().__init__(
            db_session,
        )

        if notification_config is None:
            notification_config = get_email_config()
        self.notification_config = notification_config

    @abstractmethod
    def collect_email_notifications(
        self,
    ) -> list[UserEmailNotification]:
        """Collect email notifications for users"""
        pass

    @abstractmethod
    def post_notifications_process(self, notifications: list[UserEmailNotification]) -> None:
        """Fetch collected notifications and prepare email data."""
        pass

    def send_notifications(self, notifications: list[UserEmailNotification]) -> None:
        """Send collected notifications to users"""
        for user_notification in notifications:
            trace_id = str(uuid.uuid4())
            logger.info(
                "Sending notification to user",
                extra={"user_id": user_notification.user_id, "pinpoint_trace_id": trace_id},
            )
            notification_log = UserNotificationLog(
                user_notification_log_id=uuid.uuid4(),
                user_id=user_notification.user_id,
                notification_reason=user_notification.notification_reason,
                notification_sent=False,  # Default to False, update on success
            )
            self.db_session.add(notification_log)

            try:
                if self.notification_config.reset_emails_without_sending:
                    self.increment(Metrics.NOTIFICATIONS_RESET)
                    logger.info(
                        "Skipping notification to user due to reset flag",
                        extra={
                            "user_id": user_notification.user_id,
                            "notification_reason": user_notification.notification_reason,
                            "notification_log_id": notification_log.user_notification_log_id,
                        },
                    )

                    # still set notified/sent, so that we update the user_saved_opportunity.last_notified_at
                    # that opportunity version change notifications check
                    notification_log.notification_sent = True
                    user_notification.is_notified = True

                    return

                response = send_pinpoint_email_raw(
                    to_address=user_notification.user_email,
                    subject=user_notification.subject,
                    message=user_notification.content,
                    app_id=self.notification_config.app_id,
                    trace_id=trace_id,
                )

                email_response = response.results.get(user_notification.user_email, None)

                logger.info(
                    "Successfully delivered notification to user",
                    extra={
                        "user_id": user_notification.user_id,
                        "notification_reason": user_notification.notification_reason,
                        "notification_log_id": notification_log.user_notification_log_id,
                        "pinpoint_delivery_status": (
                            email_response.delivery_status if email_response else None
                        ),
                        "pinpoint_message_id": (
                            email_response.message_id if email_response else None
                        ),
                        "pinpoint_status_code": (
                            email_response.status_code if email_response else None
                        ),
                        "pinpoint_status_message": (
                            email_response.status_message if email_response else None
                        ),
                        "pinpoint_trace_id": trace_id,
                    },
                )
                notification_log.notification_sent = True
                user_notification.is_notified = True

                self.increment(Metrics.USERS_NOTIFIED)

            except Exception:
                # Notification log will be updated in the post notification process
                logger.exception(
                    "Failed to send notification email",
                    extra={
                        "user_id": user_notification.user_id,
                        "notification_reason": user_notification.notification_reason,
                        "pinpoint_trace_id": trace_id,
                    },
                )
                self.increment(Metrics.FAILED_TO_SEND)

    def run_task(self) -> None:
        """Override to define the task logic"""
        with self.db_session.begin():
            notifications = self.collect_email_notifications()
            self.send_notifications(notifications)
            self.post_notifications_process(notifications)
