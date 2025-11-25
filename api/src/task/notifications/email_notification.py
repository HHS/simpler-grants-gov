import click

import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters import db
from src.adapters.aws.sesv2_adapter import BaseSESV2Client
from src.task.ecs_background_task import ecs_background_task
from src.task.notifications.closing_date_notification import ClosingDateNotificationTask
from src.task.notifications.config import EmailNotificationConfig, get_email_config
from src.task.notifications.opportunity_notifcation import OpportunityNotificationTask
from src.task.notifications.search_notification import SearchNotificationTask
from src.task.notifications.sync_suppressed_emails import SyncSuppressedEmailsTask
from src.task.task import Task
from src.task.task_blueprint import task_blueprint


@task_blueprint.cli.command(
    "email-notifications", help="Send email notifications for opportunity and search changes"
)
@click.option("--scheduled-job-name", default=None, help="Name of the scheduled job")
@ecs_background_task("email-notifications")
@flask_opensearch.with_search_client()
@flask_db.with_db_session()
def run_email_notification_task(
    db_session: db.Session, search_client: search.SearchClient, scheduled_job_name: str | None
) -> None:
    """Run the daily notification task"""
    task = EmailNotificationTask(db_session, search_client)
    task.run()


class EmailNotificationTask(Task):
    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        notification_config: EmailNotificationConfig | None = None,
        sesv2_client: BaseSESV2Client | None = None,
    ) -> None:
        super().__init__(db_session)
        self.search_client = search_client
        if notification_config is None:
            notification_config = get_email_config()
        self.notification_config = notification_config
        self.sesv2_client = sesv2_client

    def run_task(self) -> None:
        # Run the suppressed email job first
        if self.notification_config.sync_suppressed_emails:
            SyncSuppressedEmailsTask(
                db_session=self.db_session, sesv2_client=self.sesv2_client
            ).run()
        if self.notification_config.enable_opportunity_notifications:
            OpportunityNotificationTask(
                db_session=self.db_session, notification_config=self.notification_config
            ).run()
        if self.notification_config.enable_search_notifications:
            SearchNotificationTask(
                db_session=self.db_session,
                search_client=self.search_client,
                notification_config=self.notification_config,
            ).run()
        if self.notification_config.enable_closing_date_notifications:
            ClosingDateNotificationTask(
                db_session=self.db_session, notification_config=self.notification_config
            ).run()
