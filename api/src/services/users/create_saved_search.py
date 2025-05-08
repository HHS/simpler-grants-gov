import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db, search
from src.db.models.user_models import UserSavedSearch
from src.services.opportunities_v1.search_opportunities import search_opportunities_id

logger = logging.getLogger(__name__)


def create_saved_search(
    search_client: search.SearchClient, db_session: db.Session, user_id: UUID, json_data: dict
) -> UserSavedSearch:
    # Check if a saved search exists
    record = db_session.execute(
        select(UserSavedSearch).filter(
            UserSavedSearch.user_id == user_id,
            UserSavedSearch.search_query == json_data["search_query"],
            UserSavedSearch.name == json_data["name"],
        )
    ).scalar_one_or_none()

    if not record:
        # Retrieve opportunity IDs
        opportunity_ids = search_opportunities_id(search_client, json_data["search_query"])

        saved_search = UserSavedSearch(
            user_id=user_id,
            name=json_data["name"],
            search_query=json_data["search_query"],
            searched_opportunity_ids=opportunity_ids,
        )

        db_session.add(saved_search)

        return saved_search

    record.is_deleted = False

    return record
