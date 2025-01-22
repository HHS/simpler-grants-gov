import logging
import uuid
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Dict, List

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.db.models.user_models import User
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "generate-notifications", help="Send notifications for opportunity and search changes"
)
@ecs_background_task("generate-notifications")
@flask_db.with_db_session()
def run_notification_task(db_session: db.Session) -> None:
    """Run the daily notification task"""
    task = NotificationTask(db_session)
    task.run()


@dataclass
class NotificationContainer:
    """Container for collecting notifications for a single user"""

    user: User
    updated_opportunity_ids: List[int] = field(default_factory=list)
    # TODO: Change from str to something else
    updated_searches: List[str] = field(default_factory=list)


class NotificationTask(Task):
    """Task that runs daily to collect and send notifications to users about changes"""

    # TODO: Confirm with team if we want to use these metrics
    class Metrics(StrEnum):
        USERS_NOTIFIED = "users_notified"
        OPPORTUNITIES_TRACKED = "opportunities_tracked"
        SEARCHES_TRACKED = "searches_tracked"
        NOTIFICATIONS_SENT = "notifications_sent"

    def __init__(self, db_session: db.Session) -> None:
        super().__init__(db_session)
        self.user_notification_map: Dict[uuid.UUID, NotificationContainer] = {}

    def run_task(self) -> None:
        """Main task logic to collect and send notifications"""
        self._collect_opportunity_notifications()
        self._collect_search_notifications()
        self._send_notifications()

    def _collect_opportunity_notifications(self) -> None:
        """Collect notifications for changed opportunities
        To be implemented in future ticket
        """
        logger.info("Opportunity notification collection not yet implemented")
        pass

    def _collect_search_notifications(self) -> None:
        """Collect notifications for changed saved searches
        To be implemented in future ticket
        """
        logger.info("Search notification collection not yet implemented")
        pass

    def _send_notifications(self) -> None:
        """Send collected notifications to users"""
        for user_id, container in self.user_notification_map.items():
            if not container.updated_opportunity_ids and not container.updated_searches:
                continue

            # TODO: Implement actual notification sending in future ticket
            logger.info(
                "Would send notification to user",
                extra={
                    "user_id": user_id,
                    "opportunity_count": len(container.updated_opportunity_ids),
                    "search_count": len(container.updated_searches),
                },
            )

            self.increment(
                self.Metrics.OPPORTUNITIES_TRACKED, len(container.updated_opportunity_ids)
            )
            self.increment(self.Metrics.SEARCHES_TRACKED, len(container.updated_searches))
            self.increment(self.Metrics.NOTIFICATIONS_SENT)
            self.increment(self.Metrics.USERS_NOTIFIED)
