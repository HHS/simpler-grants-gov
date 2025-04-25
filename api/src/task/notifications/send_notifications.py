
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
from tests.conftest import db_session


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
                 search_client: search.SearchClient | None = None
                 ) -> None:
        super().__init__(db_session)
        self.search_client = search_client



    def run_task(self) -> None:
        # # run opportunity notification
        # OpportunityNotification(db_session=self.db_session).run()
        # # run search notification
        # SearchNotification(db_session=self.db_session, search_client=self.search_client).run()
        # run closing notification
        ClosingDateNotification(db_session=self.db_session).run()





