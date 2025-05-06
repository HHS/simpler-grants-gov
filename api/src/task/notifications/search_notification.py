import logging
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

import src.adapters.db as db
import src.adapters.search as search
from src.db.models.user_models import UserSavedSearch
from src.services.opportunities_v1.search_opportunities import search_opportunities_id
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.constants import Metrics, NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)


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
    ):
        super().__init__(db_session)
        self.search_client = search_client

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed saved searches"""
        stmt = (
            select(UserSavedSearch)
            .options(selectinload(UserSavedSearch.user))
            .where(UserSavedSearch.last_notified_at < datetime_util.utcnow())
        )
        saved_searches = self.db_session.execute(stmt).scalars().all()

        query_map: dict[str, list[UserSavedSearch]] = {}
        for saved_search in saved_searches:
            search_query = _strip_pagination_params(saved_search.search_query)
            query_key = str(search_query)

            if query_key not in query_map:
                query_map[query_key] = []
            query_map[query_key].append(saved_search)

        updated_saved_searches: dict[UUID, list[UserSavedSearch]] = {}

        for searches in query_map.values():
            current_results = search_opportunities_id(self.search_client, searches[0].search_query)
            for saved_search in searches:
                previous_results = set(saved_search.searched_opportunity_ids)
                if set(current_results) != previous_results:
                    user_id = saved_search.user_id
                    updated_saved_searches.setdefault(user_id, []).append(saved_search)
                    saved_search.searched_opportunity_ids = list(current_results)

        users_email_notifications: list[UserEmailNotification] = []

        for user_id, saved_items in updated_saved_searches.items():
            user_email: str = saved_items[0].user.email if saved_items[0].user.email else ""

            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            logger.info(
                "Created changed search email notification",
                extra={"user_id": user_id, "changed_search_count": len(saved_items)},
            )
            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user_email,
                    subject="Updates to Your Saved Opportunities",
                    content="",
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

    def post_notifications_process(self, user_notifications: list[UserEmailNotification]) -> None:
        for user_notification in user_notifications:
            if user_notification.is_notified:
                self.db_session.execute(
                    update(UserSavedSearch)
                    .where(
                        UserSavedSearch.saved_search_id.in_(user_notification.notified_object_ids)
                    )
                    .values(last_notified_at=datetime_util.utcnow())
                )
                logger.info(
                    "Updated notification log",
                    extra={
                        "user_id": user_notification.user_id,
                        "search_ids": user_notification.notified_object_ids,
                        "notification_reason": user_notification.notification_reason,
                    },
                )
                self.increment(Metrics.SEARCHES_TRACKED, len(user_notification.notified_object_ids))
