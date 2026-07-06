from collections.abc import Sequence
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams
from grants_shared.pagination.paginator import Paginator
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel
from sqlalchemy import select

from src.db.models.user_models import UserSavedSearch


class SavedSearchListParams(BaseModel):
    pagination: PaginationParams


def get_saved_searches(
    db_session: db.Session, user_id: UUID, raw_search_params: dict
) -> tuple[Sequence[UserSavedSearch], PaginationInfo]:
    """Get all saved searches for a user"""

    search_params = SavedSearchListParams.model_validate(raw_search_params)

    stmt = select(UserSavedSearch).where(
        UserSavedSearch.user_id == user_id, UserSavedSearch.is_deleted.isnot(True)
    )

    stmt = apply_sorting(stmt, search_params.pagination.sort_order, UserSavedSearch)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedSearch, stmt, db_session, page_size=search_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=search_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return paginated_search, pagination_info
