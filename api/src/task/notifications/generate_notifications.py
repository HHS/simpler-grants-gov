import logging
import uuid
from dataclasses import dataclass, field
from enum import StrEnum

import botocore.client
from pydantic import Field
from sqlalchemy import select, update

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.user_models import (
    User,
    UserNotificationLog,
    UserSavedOpportunity,
    UserSavedSearch,
)
from src.services.opportunities_v1.search_opportunities import search_opportunities_id
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class GenerateNotificationsConfig(PydanticBaseEnvConfig):
    app_id: str = Field(alias="PINPOINT_APP_ID")


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


class NotificationConstants:
    OPPORTUNITY_UPDATES = "opportunity_updates"
    SEARCH_UPDATES = "search_updates"


@dataclass
class NotificationContainer:
    """Container for collecting notifications for a single user"""

    saved_opportunities: list[UserSavedOpportunity] = field(default_factory=list)
    saved_searches: list[UserSavedSearch] = field(default_factory=list)


class NotificationTask(Task):
    """Task that runs daily to collect and send notifications to users about changes"""

    # TODO: Confirm with team if we want to use these metrics
    class Metrics(StrEnum):
        USERS_NOTIFIED = "users_notified"
        OPPORTUNITIES_TRACKED = "opportunities_tracked"
        SEARCHES_TRACKED = "searches_tracked"
        NOTIFICATIONS_SENT = "notifications_sent"

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        pinpoint_client: botocore.client.BaseClient | None = None,
        pinpoint_app_id: str | None = None,
    ) -> None:
        super().__init__(db_session)
        self.config = GenerateNotificationsConfig()

        self.user_notification_map: dict[uuid.UUID, NotificationContainer] = {}
        self.search_client = search_client
        self.pinpoint_client = pinpoint_client
        self.app_id = pinpoint_app_id

    def run_task(self) -> None:
        """Main task logic to collect and send notifications"""
        self._collect_opportunity_notifications()
        self._collect_search_notifications()
        self._send_notifications()

    def _collect_opportunity_notifications(self) -> None:
        """Collect notifications for changed opportunities that users are tracking"""
        stmt = (
            select(UserSavedOpportunity)
            .join(
                OpportunityChangeAudit,
                OpportunityChangeAudit.opportunity_id == UserSavedOpportunity.opportunity_id,
            )
            .where(OpportunityChangeAudit.updated_at > UserSavedOpportunity.last_notified_at)
            .distinct()
        )

        results = self.db_session.execute(stmt)

        for row in results.scalars():
            user_id = row.user_id
            if user_id not in self.user_notification_map:
                self.user_notification_map[user_id] = NotificationContainer()
            self.user_notification_map[user_id].saved_opportunities.append(row)

        logger.info(
            "Collected opportunity notifications",
            extra={
                "user_count": len(self.user_notification_map),
                "total_notifications": sum(
                    len(container.saved_opportunities)
                    for container in self.user_notification_map.values()
                ),
            },
        )

    def _collect_search_notifications(self) -> None:
        """Collect notifications for changed saved searches"""
        # Get all saved searches that haven't been checked since last notification
        stmt = select(UserSavedSearch).where(
            UserSavedSearch.last_notified_at < datetime_util.utcnow()
        )
        saved_searches = self.db_session.execute(stmt).scalars()

        # Group searches by query to minimize search index calls
        query_map: dict[str, list[UserSavedSearch]] = {}
        for saved_search in saved_searches:
            # Remove pagination parameters before using as key
            search_query = _strip_pagination_params(saved_search.search_query)
            query_key = str(search_query)

            if query_key not in query_map:
                query_map[query_key] = []
            query_map[query_key].append(saved_search)

        # For each unique query, check if results have changed
        for searches in query_map.values():
            current_results: list[int] = search_opportunities_id(
                self.search_client, searches[0].search_query
            )

            for saved_search in searches:
                previous_results = set(saved_search.searched_opportunity_ids)
                if set(current_results) != previous_results:
                    user_id = saved_search.user_id
                    if user_id not in self.user_notification_map:
                        self.user_notification_map[user_id] = NotificationContainer()
                    self.user_notification_map[user_id].saved_searches.append(saved_search)

                    # Update the saved search with new results
                    saved_search.searched_opportunity_ids = list(current_results)

        logger.info(
            "Collected search notifications",
            extra={
                "user_count": len(self.user_notification_map),
                "total_searches": sum(
                    len(container.saved_searches)
                    for container in self.user_notification_map.values()
                ),
            },
        )

    def _send_notifications(self) -> None:
        """Send collected notifications to users"""
        for user_id, container in self.user_notification_map.items():
            if not container.saved_opportunities and not container.saved_searches:
                continue

            user = self.db_session.execute(
                select(User).where(User.user_id == user_id)
            ).scalar_one_or_none()

            if not user or not user.email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            # Send email via Pinpoint
            subject = "Updates to Your Saved Opportunities"
            message = (
                f"You have updates to {len(container.saved_opportunities)} saved opportunities"
            )

            logger.info(
                "Sending notification to user",
                extra={
                    "user_id": user_id,
                    "opportunity_count": len(container.saved_opportunities),
                    "search_count": len(container.saved_searches),
                },
            )

            notification_log = UserNotificationLog(
                user_id=user_id,
                notification_reason=NotificationConstants.OPPORTUNITY_UPDATES,
                notification_sent=False,  # Default to False, update on success
            )
            self.db_session.add(notification_log)

            try:
                send_pinpoint_email_raw(
                    to_address=user.email,
                    subject=subject,
                    message=message,
                    pinpoint_client=self.pinpoint_client,
                    app_id=self.config.app_id,
                )
                notification_log.notification_sent = True
                logger.info(
                    "Successfully sent notification to user",
                    extra={
                        "user_id": user_id,
                        "opportunity_count": len(container.saved_opportunities),
                        "search_count": len(container.saved_searches),
                    },
                )
            except Exception:
                # Notification log will be updated in the finally block
                logger.exception(
                    "Failed to send notification email",
                    extra={"user_id": user_id, "email": user.email},
                )

            self.db_session.add(notification_log)

            if container.saved_searches:
                search_notification_log = UserNotificationLog(
                    user_id=user_id,
                    notification_reason=NotificationConstants.SEARCH_UPDATES,
                    notification_sent=False,  # Default to False, update if email was successful
                )
                self.db_session.add(search_notification_log)
                if notification_log.notification_sent:
                    search_notification_log.notification_sent = True

            # Update last_notified_at for all opportunities we just notified about
            opportunity_ids = [
                saved_opp.opportunity_id for saved_opp in container.saved_opportunities
            ]
            self.db_session.execute(
                update(UserSavedOpportunity)
                .where(
                    UserSavedOpportunity.user_id == user_id,
                    UserSavedOpportunity.opportunity_id.in_(opportunity_ids),
                )
                .values(last_notified_at=datetime_util.utcnow())
            )

            # Update last_notified_at for all searches we just notified about
            if container.saved_searches:
                search_ids = [
                    saved_search.saved_search_id for saved_search in container.saved_searches
                ]
                self.db_session.execute(
                    update(UserSavedSearch)
                    .where(UserSavedSearch.saved_search_id.in_(search_ids))
                    .values(last_notified_at=datetime_util.utcnow())
                )

            self.increment(self.Metrics.OPPORTUNITIES_TRACKED, len(container.saved_opportunities))
            self.increment(self.Metrics.SEARCHES_TRACKED, len(container.saved_searches))
            self.increment(self.Metrics.NOTIFICATIONS_SENT)
            self.increment(self.Metrics.USERS_NOTIFIED)


def _strip_pagination_params(search_query: dict) -> dict:
    """Remove pagination parameters from a search query"""
    search_query = search_query.copy()
    search_query.pop("pagination", None)
    return search_query
