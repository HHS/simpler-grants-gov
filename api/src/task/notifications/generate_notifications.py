import logging
import uuid
from dataclasses import dataclass, field
from datetime import timedelta
from enum import StrEnum

import botocore.client
from pydantic import Field
from sqlalchemy import and_, exists, select, update

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.opportunity_models import Opportunity, OpportunityChangeAudit, OpportunitySummary
from src.db.models.user_models import (
    User,
    UserNotificationLog,
    UserOpportunityNotificationLog,
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
    CLOSING_DATE_REMINDER = "closing_date_reminder"  #


@dataclass
class NotificationContainer:
    """Container for collecting notifications for a single user"""

    saved_opportunities: list[UserSavedOpportunity] = field(default_factory=list)
    saved_searches: list[UserSavedSearch] = field(default_factory=list)
    closing_opportunities: list[UserSavedOpportunity] = field(default_factory=list)


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
        self._collect_closing_date_notifications()
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
            if (
                not container.saved_opportunities
                and not container.saved_searches
                and not container.closing_opportunities
            ):
                continue

            user = self.db_session.execute(
                select(User).where(User.user_id == user_id)
            ).scalar_one_or_none()

            if not user or not user.email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            subject = ""
            message = ""

            if len(container.closing_opportunities) == 1:
                # Single opportunity closing
                opportunity = container.closing_opportunities[0]
                close_date_stmt = select(OpportunitySummary.close_date).where(
                    OpportunitySummary.opportunity_id == opportunity.opportunity_id
                )
                close_date = self.db_session.execute(close_date_stmt).scalar_one_or_none()
                if close_date is None:
                    logger.warning(
                        "No close date found for opportunity",
                        extra={"opportunity_id": opportunity.opportunity_id},
                    )
                    continue

                subject = "Applications for your bookmarked funding opportunity are due soon"
                message = (
                    "Applications for the following funding opportunity are due in two weeks:\n\n"
                    f"[{opportunity.opportunity.opportunity_title}]\n"
                    f"Application due date: {close_date.strftime('%B %d, %Y')}\n\n"
                    "Please carefully review the opportunity listing for all requirements and deadlines.\n\n"
                    "Sign in to Simpler.Grants.gov to manage or unsubscribe from this bookmarked opportunity.\n\n"
                    "To manage notifications about this opportunity, sign in to Simpler.Grants.gov.\n\n"
                    "If you have questions about the opportunity, please contact the grantor using the contact information on the listing page.\n\n"
                    "If you encounter technical issues while applying on Grants.gov, please reach out to the Contact Center:\n"
                    "support@grants.gov\n"
                    "1-800-518-4726\n"
                    "24 hours a day, 7 days a week\n"
                    "Closed on federal holidays"
                )
            elif len(container.closing_opportunities) > 1:
                # Multiple opportunities closing
                subject = "Applications for your bookmarked funding opportunities are due soon"
                message = (
                    "Applications for the following funding opportunities are due in two weeks:\n\n"
                )

                for opportunity in container.closing_opportunities:
                    close_date_stmt = select(OpportunitySummary.close_date).where(
                        OpportunitySummary.opportunity_id == opportunity.opportunity_id
                    )
                    close_date = self.db_session.execute(close_date_stmt).scalar_one_or_none()
                    if close_date:
                        message += (
                            f"[{opportunity.opportunity.opportunity_title}]\n"
                            f"Application due date: {close_date.strftime('%B %d, %Y')}\n\n"
                        )

                message += (
                    "Please carefully review the opportunity listings for all requirements and deadlines.\n\n"
                    "Sign in to Simpler.Grants.gov to manage your bookmarked opportunities.\n\n"
                    "If you have questions, please contact the Grants.gov Contact Center:\n"
                    "support@grants.gov\n"
                    "1-800-518-4726\n"
                    "24 hours a day, 7 days a week\n"
                    "Closed on federal holidays"
                )

            if len(container.closing_opportunities) > 0:
                notification_log = UserNotificationLog(
                    user_id=user_id,
                    notification_reason=NotificationConstants.CLOSING_DATE_REMINDER,
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

                    for closing_opportunity in container.closing_opportunities:
                        # Create notification log entry
                        opp_notification_log = UserOpportunityNotificationLog(
                            user_id=user_id,
                            opportunity_id=closing_opportunity.opportunity_id,
                        )
                        self.db_session.add(opp_notification_log)

                    logger.info(
                        "Successfully sent closing date reminder",
                        extra={
                            "user_id": user_id,
                            "opportunity_ids": [
                                opp.opportunity_id for opp in container.closing_opportunities
                            ],
                        },
                    )
                    self.increment(self.Metrics.NOTIFICATIONS_SENT)
                except Exception:
                    logger.exception(
                        "Failed to send closing date reminder email",
                        extra={
                            "user_id": user_id,
                            "email": user.email,
                            "opportunity_ids": [
                                opp.opportunity_id for opp in container.closing_opportunities
                            ],
                        },
                    )

            if not container.saved_opportunities and not container.saved_searches:
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

    def _collect_closing_date_notifications(self) -> None:
        """Collect notifications for opportunities closing in two weeks"""
        two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

        # Find saved opportunities closing in two weeks that haven't been notified
        stmt = (
            select(UserSavedOpportunity)
            .join(UserSavedOpportunity.opportunity)
            .join(
                OpportunitySummary, OpportunitySummary.opportunity_id == Opportunity.opportunity_id
            )
            .where(
                # Check if closing date is within 24 hours of two weeks from now
                and_(
                    OpportunitySummary.close_date >= two_weeks_from_now - timedelta(hours=24),
                    OpportunitySummary.close_date <= two_weeks_from_now + timedelta(hours=24),
                ),
                # Ensure we haven't already sent a closing reminder
                ~exists().where(
                    and_(
                        UserOpportunityNotificationLog.user_id == UserSavedOpportunity.user_id,
                        UserOpportunityNotificationLog.opportunity_id
                        == UserSavedOpportunity.opportunity_id,
                    )
                ),
            )
        )

        results = self.db_session.execute(stmt)

        for row in results.scalars():
            user_id = row.user_id
            if user_id not in self.user_notification_map:
                self.user_notification_map[user_id] = NotificationContainer()
            self.user_notification_map[user_id].closing_opportunities.append(row)

        logger.info(
            "Collected closing date notifications",
            extra={
                "user_count": len(self.user_notification_map),
                "total_notifications": sum(
                    len(container.closing_opportunities)
                    for container in self.user_notification_map.values()
                ),
            },
        )


def _strip_pagination_params(search_query: dict) -> dict:
    """Remove pagination parameters from a search query"""
    search_query = search_query.copy()
    search_query.pop("pagination", None)
    return search_query
