import pytest
from sqlalchemy import select

from src.db.models.user_models import User
from src.pagination.paginator import Paginator
from tests.src.db.models.factories import UserFactory

TEST_PAGINATOR_FIRST_NAME = "test_paginator_first_name"

DEFAULT_USER_PARAMS = {
    "last_name": "last_name",
    "phone_number": "111-111-1111",
    "is_active": True,
    "roles": [],
}


@pytest.fixture
def create_users(db_session, enable_factory_create):
    # Clear any prior users from other tests so we're only fetching
    # records we created here.
    db_session.query(User).delete()

    # 5 with the default params
    UserFactory.create_batch(5, **DEFAULT_USER_PARAMS)

    # 4 with a different last name
    params = DEFAULT_USER_PARAMS | {"last_name": "something else"}
    UserFactory.create_batch(4, **params)

    # 3 with a different phone number
    params = DEFAULT_USER_PARAMS | {"phone_number": "222-222-2222"}
    UserFactory.create_batch(3, **params)

    # 2 that aren't active
    params = DEFAULT_USER_PARAMS | {"is_active": False}
    UserFactory.create_batch(2, **params)

    # 1 that is different in all ways
    params = DEFAULT_USER_PARAMS | {
        "last_name": "something else",
        "phone_number": "222-222-2222",
        "is_active": False,
    }
    UserFactory.create_batch(1, **params)


def test_paginator(db_session, create_users):
    # A base "select * from user" query
    base_stmt = select(User)

    # Verify that with no additional filters, we get everything
    paginator = Paginator(base_stmt, db_session, page_size=6)
    assert paginator.page_size == 6
    assert paginator.total_pages == 3
    assert paginator.total_records == 15

    # The pages are generated at the expected length
    assert len(paginator.page_at(1)) == 6
    assert len(paginator.page_at(2)) == 6
    assert len(paginator.page_at(3)) == 3
    assert len(paginator.page_at(4)) == 0

    # Verify when filtering by last name
    stmt = base_stmt.filter(User.last_name == "something else")
    paginator = Paginator(stmt, db_session, page_size=10)
    assert paginator.page_size == 10
    assert paginator.total_pages == 1
    assert paginator.total_records == 5

    assert len(paginator.page_at(1)) == 5
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by phone number
    stmt = base_stmt.filter(User.phone_number == "222-222-2222")
    paginator = Paginator(stmt, db_session, page_size=1)
    assert paginator.page_size == 1
    assert paginator.total_pages == 4
    assert paginator.total_records == 4

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 1
    assert len(paginator.page_at(3)) == 1
    assert len(paginator.page_at(4)) == 1
    assert len(paginator.page_at(5)) == 0

    # Verify when filtering by is_active
    stmt = base_stmt.filter(User.is_active.is_(False))
    paginator = Paginator(stmt, db_session, page_size=100)
    assert paginator.page_size == 100
    assert paginator.total_pages == 1
    assert paginator.total_records == 3

    assert len(paginator.page_at(1)) == 3
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by all fields
    stmt = base_stmt.filter(
        User.last_name == "something else",
        User.phone_number == "222-222-2222",
        User.is_active.is_(False),
    )
    paginator = Paginator(stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 1
    assert paginator.total_records == 1

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering to zero results
    stmt = base_stmt.filter(User.last_name == "something that won't be found")
    paginator = Paginator(stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 0
    assert paginator.total_records == 0

    assert len(paginator.page_at(1)) == 0


@pytest.mark.parametrize("page_size", [0, -1, -2])
def test_page_size_zero_or_negative(db_session, page_size):
    with pytest.raises(ValueError, match="Page size must be at least 1"):
        Paginator(select(User), db_session, page_size)
