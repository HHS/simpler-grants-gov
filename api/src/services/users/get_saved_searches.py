from typing import Sequence, Tuple
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import asc, desc, select

from src.adapters import db
from src.db.models.user_models import UserSavedSearch
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator


class SavedSearchListParams(BaseModel):
    pagination: PaginationParams


def get_saved_searches(
    db_session: db.Session, user_id: UUID, raw_search_params: dict
) -> Tuple[Sequence[UserSavedSearch], PaginationInfo]:
    """Get all saved searches for a user"""

    search_params = SavedSearchListParams.model_validate(raw_search_params)

    stmt = select(UserSavedSearch).where(UserSavedSearch.user_id == user_id)

    order_cols: list = []
    for order in search_params.pagination.sort_order:
        column = getattr(UserSavedSearch, order.order_by)

        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column))

    stmt = stmt.order_by(*order_cols)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedSearch, stmt, db_session, page_size=search_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=search_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return paginated_search, pagination_info
