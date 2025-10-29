from collections.abc import Sequence
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserSavedSearch
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.service_utils import apply_sorting


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

    stmt = apply_sorting(stmt, UserSavedSearch, search_params.pagination.sort_order)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedSearch, stmt, db_session, page_size=search_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=search_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return paginated_search, pagination_info
