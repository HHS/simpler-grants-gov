import logging

import botocore.client
from pydantic import Field

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.task.ecs_background_task import ecs_background_task
from src.task.notifications.closing_date_notification import ClosingDateNotification
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
        frontend_base_url: str | None = None,
        generate_notification_config: GenerateNotificationsConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        self.pinpoint_client = pinpoint_client
        self.frontend_base_url = frontend_base_url

        if generate_notification_config is None:
            generate_notification_config = GenerateNotificationsConfig()
        self.generate_notification_config = generate_notification_config

    def run_task(self) -> None:
        """Main task logic to collect and send notifications"""

        # run opportunity notification
        OpportunityNotification(
            db_session=self.db_session, search_client=self.search_client
        ).run_task()

        # run search notification
        SearchNotification(db_session=self.db_session, search_client=self.search_client).run_task()

        # run closing notification
        ClosingDateNotification(
            db_session=self.db_session,
            search_client=self.search_client,
            frontend_base_url=self.frontend_base_url,
        ).run_task()
