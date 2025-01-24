import logging
import uuid
from dataclasses import dataclass, field
from enum import StrEnum

from sqlalchemy import select, update

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User, UserSavedOpportunity
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util

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
    updated_opportunity_ids: list[int] = field(default_factory=list)
    # TODO: Change from str to something else
    updated_searches: list[str] = field(default_factory=list)


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
        self.user_notification_map: dict[uuid.UUID, NotificationContainer] = {}

    def run_task(self) -> None:
        """Main task logic to collect and send notifications"""
        self._collect_opportunity_notifications()
        self._collect_search_notifications()
        self._send_notifications()

    def _collect_opportunity_notifications(self) -> None:
        """Collect notifications for changed opportunities that users are tracking"""
        stmt = (
            select(User.user_id, UserSavedOpportunity.opportunity_id)
            .join(
                UserSavedOpportunity,
                User.user_id == UserSavedOpportunity.user_id,
            )
            .join(
                Opportunity,
                UserSavedOpportunity.opportunity_id == Opportunity.opportunity_id,
            )
            .where(Opportunity.updated_at > UserSavedOpportunity.last_notified_at)
        )

        results = self.db_session.execute(stmt)

        for row in results.mappings():
            user_id = row["user_id"]
            opportunity_id = row["opportunity_id"]
            if user_id not in self.user_notification_map:
                self.user_notification_map[user_id] = NotificationContainer(user=user_id)
            self.user_notification_map[user_id].updated_opportunity_ids.append(opportunity_id)

        logger.info(
            "Collected opportunity notifications",
            extra={
                "user_count": len(self.user_notification_map),
                "total_notifications": sum(
                    len(container.updated_opportunity_ids)
                    for container in self.user_notification_map.values()
                ),
            },
        )

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

            # Update last_notified_at for all opportunities we just notified about
            self.db_session.execute(
                update(UserSavedOpportunity)
                .where(
                    UserSavedOpportunity.user_id == user_id,
                    UserSavedOpportunity.opportunity_id.in_(container.updated_opportunity_ids),
                )
                .values(last_notified_at=datetime_util.utcnow())
            )

            self.increment(
                self.Metrics.OPPORTUNITIES_TRACKED, len(container.updated_opportunity_ids)
            )
            self.increment(self.Metrics.SEARCHES_TRACKED, len(container.updated_searches))
            self.increment(self.Metrics.NOTIFICATIONS_SENT)
            self.increment(self.Metrics.USERS_NOTIFIED)
