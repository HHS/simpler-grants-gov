from uuid import UUID

from sqlalchemy import select, asc, desc

from src.adapters import db
from src.db.models.user_models import UserSavedSearch
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from pydantic import BaseModel


class SavedSearchListParams(BaseModel):
    pagination: PaginationParams


def get_saved_searches(db_session: db.Session, user_id: UUID, json_data: SavedSearchListParams) -> list[
    UserSavedSearch]:
    """Get all saved searches for a user"""
    stmt = select(UserSavedSearch).where(UserSavedSearch.user_id == user_id)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedSearch, stmt, db_session, page_size=json_data.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=json_data.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(json_data, paginator)


    return paginated_search, pagination_info
