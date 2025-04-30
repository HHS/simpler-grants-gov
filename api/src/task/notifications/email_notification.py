import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters import db
from src.task.ecs_background_task import ecs_background_task
from src.task.notifications import constants
from src.task.notifications.closing_date_notification import ClosingDateNotification
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.opportunity_notifcation import OpportunityNotification
from src.task.notifications.search_notification import SearchNotification
from src.task.task import Task
from src.task.task_blueprint import task_blueprint


@task_blueprint.cli.command(
    "email-notifications", help="Send email notifications for opportunity and search changes"
)
@ecs_background_task("email-notifications")
@flask_opensearch.with_search_client()
@flask_db.with_db_session()
def run_email_notification_task(db_session: db.Session, search_client: search.SearchClient) -> None:
    """Run the daily notification task"""
    task = EmailNotificationTask(db_session, search_client)
    task.run()


class EmailNotificationTask(Task):
    Metrics = constants.Metrics

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        notification_config: EmailNotificationConfig | None = None,
    ) -> None:
        super().__init__(db_session)
        self.search_client = search_client
        if notification_config is None:
            notification_config = EmailNotificationConfig()
        self.notification_config = notification_config

    def run_task(self) -> None:
        # run opportunity notification
        OpportunityNotification(db_session=self.db_session).run()
        # run search notification
        SearchNotification(db_session=self.db_session, search_client=self.search_client).run()
        # run closing notification
        ClosingDateNotification(db_session=self.db_session).run()
