from typing import Sequence, Tuple

from sqlalchemy import asc, desc, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.response import PaginationInfo
from src.db.models.user_models import Role, RoleType, User
from src.pagination.pagination_models import PaginationParams
from src.pagination.paginator import Paginator


class SearchUserParams(PaginationParams):
    phone_number: str | None = None
    is_active: bool | None = None
    role_type: RoleType | None = None


def search_user(
    db_session: db.Session, search_user_dict: dict
) -> Tuple[Sequence[User], PaginationInfo]:
    # Convert the dictionary request into something a little easier to use
    search_user_params = SearchUserParams.model_validate(search_user_dict)

    with db_session.begin():
        return _search_user(db_session, search_user_params)


def _search_user(
    db_session: db.Session, search_user_params: SearchUserParams
) -> Tuple[Sequence[User], PaginationInfo]:
    # Determine whether it is ascending/descending sort order
    sort_fn = asc if search_user_params.sorting.is_ascending else desc

    # Create the base select statement
    stmt = (
        select(User)
        .options(selectinload(User.roles))
        .order_by(sort_fn(search_user_params.sorting.order_by))
    )

    # Attach any filters
    if search_user_params.phone_number is not None:
        stmt = stmt.where(User.phone_number == search_user_params.phone_number)

    if search_user_params.is_active is not None:
        stmt = stmt.where(User.is_active == search_user_params.is_active)

    if search_user_params.role_type is not None:
        stmt = stmt.join(Role).where(Role.type == search_user_params.role_type)

    # Call the paginator and fetch pagination info to return
    paginator: Paginator[User] = Paginator(
        stmt, db_session, page_size=search_user_params.paging.page_size
    )
    users = paginator.page_at(page_offset=search_user_params.paging.page_offset)
    pagination_info = PaginationInfo.from_pagination_models(search_user_params, paginator)

    return users, pagination_info
