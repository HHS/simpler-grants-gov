import logging
from uuid import UUID

from sqlalchemy import select

from src.db.models.user_models import UserSavedSearch
from src.services.opportunities_v1.search_opportunities import search_opportunities_id
from src.task.notifications.BaseNotification import BaseNotification
from src.task.notifications.constants import EmailData, NotificationConstants
from src.util import datetime_util

logger = logging.getLogger(__name__)


def _strip_pagination_params(search_query: dict) -> dict:
    """Remove pagination parameters from a search query"""
    search_query = search_query.copy()
    search_query.pop("pagination", None)
    return search_query


class SearchNotification(BaseNotification):
    collected_data: dict | None = None

    def collect_notifications(self) -> dict[UUID, list[UserSavedSearch]] | None:
        """Collect notifications for changed saved searches"""
        stmt = select(UserSavedSearch).where(
            UserSavedSearch.last_notified_at < datetime_util.utcnow()
        )
        saved_searches = self.db_session.execute(stmt).scalars()

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
        self.collected_data = updated_saved_searches or None
        return updated_saved_searches or None

    def prepare_notification(
        self, saved_search_data: dict[UUID, list[UserSavedSearch]]
    ) -> EmailData:

        return EmailData(
            to_addresses=[],
            subject="",
            content={},
            notification_reason=NotificationConstants.SEARCH_UPDATES,
        )
