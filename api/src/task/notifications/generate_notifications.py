import logging
import uuid

import botocore.client
from pydantic import Field

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import UserNotificationLog
from src.task.ecs_background_task import ecs_background_task
from src.task.notifications.closing_date_notification import ClosingDateNotification
from src.task.notifications.constants import EmailData, NotificationContainer
from src.task.notifications.opportunity_notifcation import OpportunityNotification
from src.task.notifications.search_notification import SearchNotification
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class GenerateNotificationsConfig(PydanticBaseEnvConfig):
    app_id: str = Field(alias="PINPOINT_APP_ID")
    frontend_base_url: str = Field(alias="FRONTEND_BASE_URL")


@task_blueprint.cli.command(
    "generate-notifications", help="Send notifications for opportunity and search changes"
)
@ecs_background_task("generate-notifications")
@flask_opensearch.with_search_client()
@flask_db.with_db_session()
def run_notification_task(db_session: db.Session, search_client: search.SearchClient) -> None:
    """Run the daily notification task"""
    task = NotificationTask(db_session, search_client)
    task.run()


class NotificationTask(Task):
    """Task that runs daily to collect and send notifications to users about changes"""

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        pinpoint_client: botocore.client.BaseClient | None = None,
        pinpoint_app_id: str | None = None,
        frontend_base_url: str | None = None,
    ) -> None:
        super().__init__(db_session)
        self.config = GenerateNotificationsConfig()

        self.user_notification_map: dict[uuid.UUID, NotificationContainer] = {}
        self.search_client = search_client
        self.pinpoint_client = pinpoint_client
        self.app_id = pinpoint_app_id
        self.frontend_base_url = frontend_base_url

    def run_task(self) -> None:
        """Main task logic to collect and send notifications"""

        data = OpportunityNotification(self.db_session).notification_data()
        data and self.send_notifications(data)

        data = SearchNotification(self.db_session, self.search_client).notification_data()
        data and self.send_notifications(data)

        closing_notification = ClosingDateNotification(self.db_session)
        data = closing_notification.notification_data()
        data and self.send_notifications(data)
        data and closing_notification.create_user_opportunity_notification_log()

    def send_notifications(self, data: EmailData) -> None:
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
                        pinpoint_client=self.pinpoint_client,
                        app_id=self.config.app_id,
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
