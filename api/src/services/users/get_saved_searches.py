from typing import Sequence, Tuple, Any
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import asc, desc, select
from sqlalchemy.orm import Query

from src.adapters import db
from src.db.models.user_models import UserSavedSearch
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator


class SavedSearchListParams(BaseModel):
    pagination: PaginationParams

def apply_sorting(stmt: Query , model: Any , sort_order: list) -> Query :
    """
        Applies sorting to a SQLAlchemy query statement based on the provided sorting orders.

        :param stmt: The SQLAlchemy query statement to which sorting should be applied.
        :param model: The model class on which the sorting should be applied.
        :param sort_order: A list of columns to sort by.
        :return: The modified query statement with the applied sorting.
    """

    order_cols: list = []
    for order in sort_order:
        column = getattr(model, order.order_by)
        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column))

    return stmt.order_by(*order_cols)

def get_saved_searches(
    db_session: db.Session, user_id: UUID, raw_search_params: dict
) -> Tuple[Sequence[UserSavedSearch], PaginationInfo]:
    """Get all saved searches for a user"""

    search_params = SavedSearchListParams.model_validate(raw_search_params)

    stmt = select(UserSavedSearch).where(UserSavedSearch.user_id == user_id)

    stmt = apply_sorting(stmt, UserSavedSearch, search_params.pagination.sort_order)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedSearch, stmt, db_session, page_size=search_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=search_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return paginated_search, pagination_info
