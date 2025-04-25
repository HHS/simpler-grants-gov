
from pydantic import Field

import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.task.ecs_background_task import ecs_background_task
from src.task.task_blueprint import task_blueprint
from src.adapters import db
from src.task.notifications import constants
from src.task.notifications.closing_date_notification import ClosingDateNotification
from src.task.notifications.opportunity_notifcation import OpportunityNotification
from src.task.notifications.search_notification import SearchNotification
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig


class SendNotificationsConfig(PydanticBaseEnvConfig):
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
    task = SendNotificationTask(db_session, search_client)
    task.run()

class SendNotificationTask(Task):
    Metrics = constants.Metrics

    def __init__(self, db_session: db.Session,
                 search_client: search.SearchClient | None = None,
                 notification_config: SendNotificationsConfig | None = None) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        if notification_config is None:
            notification_config = SendNotificationsConfig()
        self.notification_config = notification_config


    def run_task(self) -> None:
        # run opportunity notification
        OpportunityNotification(self).run()
        # run search notification
        SearchNotification(self).run()
        # run closing notification
        ClosingDateNotification(self).run()








