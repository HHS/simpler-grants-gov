import logging
from typing import Sequence
from uuid import UUID

from sqlalchemy import and_, exists, select, update
from sqlalchemy.orm import selectinload

import src.adapters.db as db
import src.adapters.search as search
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import LinkExternalUser, SuppressedEmail, UserSavedSearch
from src.services.opportunities_v1.search_opportunities import search_opportunities_id
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)

UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=search"


def _strip_pagination_params(search_query: dict) -> dict:
    """Remove pagination parameters from a search query"""
    search_query = search_query.copy()
    search_query.pop("pagination", None)
    return search_query


class SearchNotificationTask(BaseNotificationTask):

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        notification_config: EmailNotificationConfig | None,
    ):
        super().__init__(db_session, notification_config)
        self.search_client = search_client

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed saved searches"""
        stmt = (
            select(UserSavedSearch)
            .options(selectinload(UserSavedSearch.user))
            .where(UserSavedSearch.last_notified_at < datetime_util.utcnow())
            .where(
                UserSavedSearch.is_deleted.isnot(True),
                ~exists().where(
                    and_(
                        SuppressedEmail.email == LinkExternalUser.email,
                        LinkExternalUser.user_id == UserSavedSearch.user_id,
                    )
                ),
            )
        )

        saved_searches = self.db_session.execute(stmt).scalars().all()
        query_map: dict[str, list[UserSavedSearch]] = {}
        for saved_search in saved_searches:
            search_query = _strip_pagination_params(saved_search.search_query)
            query_key = str(search_query)

            if query_key not in query_map:
                query_map[query_key] = []
            query_map[query_key].append(saved_search)

        # Track new opportunities per user
        user_new_opportunities: dict[UUID, set[UUID]] = {}
        # Track which saved searches have updates
        updated_saved_searches: dict[UUID, list[UserSavedSearch]] = {}

        for searches in query_map.values():
            current_results = search_opportunities_id(self.search_client, searches[0].search_query)

            for saved_search in searches:
                previous_results = set(saved_search.searched_opportunity_ids or [])
                # Find NEW opportunities (in current but not in previous)
                top_new_opportunities = set(current_results[:25]) - previous_results

                # Only add searches that have new opportunities
                if top_new_opportunities:
                    user_id = saved_search.user_id
                    updated_saved_searches.setdefault(user_id, []).append(saved_search)
                    # Add top new opportunities for this user
                    user_new_opportunities.setdefault(user_id, set()).update(top_new_opportunities)

                # Always update the saved search with current results
                saved_search.searched_opportunity_ids = current_results

        users_email_notifications: list[UserEmailNotification] = []

        for user_id, saved_items in updated_saved_searches.items():
            user_email: str = saved_items[0].user.email if saved_items[0].user.email else ""

            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            # Get all of the most relevant NEW opportunity IDs for this user
            new_opportunity_ids = user_new_opportunities[user_id]

            logger.info(
                "Created changed search email notification",
                extra={
                    "user_id": user_id,
                    "changed_search_count": len(saved_items),
                    "new_opportunities_count": len(new_opportunity_ids),
                },
            )

            if not new_opportunity_ids:
                logger.info("No new opportunities to notify for user", extra={"user_id": user_id})
                continue

            # Fetch only the new opportunities that need to be included in the notification
            opportunities_stmt = (
                select(Opportunity)
                .join(
                    CurrentOpportunitySummary,
                    CurrentOpportunitySummary.opportunity_id == Opportunity.opportunity_id,
                )
                .join(
                    OpportunitySummary,
                    OpportunitySummary.opportunity_summary_id
                    == CurrentOpportunitySummary.opportunity_summary_id,
                )
                .where(Opportunity.opportunity_id.in_(new_opportunity_ids))
                .options(
                    selectinload(Opportunity.current_opportunity_summary).selectinload(
                        CurrentOpportunitySummary.opportunity_summary
                    )
                )
            )

            opportunities = self.db_session.execute(opportunities_stmt).scalars().all()

            if not opportunities:
                logger.info("No opportunities found to notify about", extra={"user_id": user_id})
                continue

            message = self._build_notification_message(opportunities)

            formatted_date = datetime_util.utcnow().strftime("%-m/%-d/%Y")
            subject = (
                f"New Grant Published on {formatted_date}"
                if len(opportunities) == 1
                else f"{len(opportunities)} New Grants Published on {formatted_date}"
            )
            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user_email,
                    subject=subject,
                    content=message,
                    notification_reason=NotificationReason.SEARCH_UPDATES,
                    notified_object_ids=[
                        saved_search.saved_search_id for saved_search in saved_items
                    ],
                    is_notified=False,  # Default to False, update on success
                )
            )

        logger.info(
            "Collected search notifications",
            extra={
                "user_count": len(updated_saved_searches),
                "total_searches": sum(
                    len(user_saved_searches)
                    for user_saved_searches in updated_saved_searches.values()
                ),
            },
        )

        return users_email_notifications

    def _build_notification_message(self, opportunities: Sequence[Opportunity]) -> str:

        # Build message intro based on number of opportunities
        if len(opportunities) == 1:
            message = (
                "A funding opportunity matching your saved search query was recently published.\n\n"
            )
        else:
            message = "The following funding opportunities matching your saved search queries were recently published.\n\n"

        # Add details for each opportunity
        for opportunity in opportunities:
            summary = (
                opportunity.current_opportunity_summary.opportunity_summary
                if opportunity.current_opportunity_summary
                else None
            )

            if not summary:
                continue

            # Add opportunity title (empty line before title)
            message += f"<b><a href='{self.notification_config.frontend_base_url}/opportunity/{opportunity.opportunity_id}{UTM_TAG}' target='_blank'>{opportunity.opportunity_title}</a></b><br/>"
            # Add status
            status = (
                str(opportunity.opportunity_status).capitalize()
                if opportunity.opportunity_status
                else "Unknown"
            )
            message += f"Status: {status}\n"

            # Add submission period
            if summary.is_forecast:
                message += "Submission period: To be announced.\n"
            elif summary.post_date:
                # Both post and close dates available
                formatted_post = summary.post_date.strftime("%-m/%-d/%Y")
                if summary.close_date:
                    formatted_close = summary.close_date.strftime("%-m/%-d/%Y")
                    message += f"Submission period: {formatted_post}–{formatted_close}\n"
                else:
                    # Post date available but no close date (indefinite submission period)
                    message += f"Submission period: {formatted_post}-(To be determined)\n"
            # The else case is No post date available - skip this opportunity entirely by not adding submission period
            # This case should be rare as opportunities without post dates should be filtered out

            # Add award range
            if summary.award_floor is not None and summary.award_ceiling is not None:
                award_floor_formatted = f"${summary.award_floor:,}"
                award_ceiling_formatted = f"${summary.award_ceiling:,}"
                message += f"Award range: {award_floor_formatted}-{award_ceiling_formatted}\n"

            # Add expected awards
            if summary.expected_number_of_awards is not None:
                message += f"Expected awards: {summary.expected_number_of_awards}\n"
            else:
                message += "Expected awards: --\n"

            # Add cost sharing
            cost_sharing = "Yes" if summary.is_cost_sharing else "No"
            message += f"Cost sharing: {cost_sharing}"

            # Add a blank line between opportunities
            message += "\n\n"

        # Add footer
        if len(opportunities) == 1:
            message += "To unsubscribe from email notifications for this query, delete it from your saved search queries."
        else:
            message += "To unsubscribe from email notifications for a query, delete it from your saved search queries."

        return message.replace("\n", "<br/>")

    def post_notifications_process(self, user_notifications: list[UserEmailNotification]) -> None:
        for user_notification in user_notifications:
            if (
                user_notification.is_notified
                or self.notification_config.reset_emails_without_sending
            ):
                self.db_session.execute(
                    update(UserSavedSearch)
                    .where(
                        UserSavedSearch.saved_search_id.in_(user_notification.notified_object_ids)
                    )
                    .values(last_notified_at=datetime_util.utcnow())
                )
                if not self.notification_config.reset_emails_without_sending:
                    logger.info(
                        "Updated notification log",
                        extra={
                            "user_id": user_notification.user_id,
                            "search_ids": user_notification.notified_object_ids,
                            "notification_reason": user_notification.notification_reason,
                        },
                    )
                    self.increment(
                        self.Metrics.SEARCHES_TRACKED, len(user_notification.notified_object_ids)
                    )
