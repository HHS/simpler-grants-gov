import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from grants_shared.pagination.paginator import Paginator
from tests.grants_shared.db.models.factories import ExampleTableFactory
from tests.grants_shared.db_test_models.db_test_models import (
    ExampleTable,
    ExampleType,
    FriendTable,
    LinkFriendType,
)

DEFAULT_EXAMPLE_PARAMS = {
    "description": "opportunity of a lifetime",
    "my_count": 111,
    "example_type": ExampleType.ANECDOTE,
}


@pytest.fixture
def create_examples(db_session, enable_factory_create):
    # As pagination needs to have exact amounts of records in the table to properly
    # test, clear out all prior data first.
    with db_session.no_autoflush:
        records = db_session.scalars(select(ExampleTable).options(selectinload("*")))

        for record in records:
            db_session.delete(record)

        db_session.commit()

    # 5 with the default params
    ExampleTableFactory.create_batch(5, **DEFAULT_EXAMPLE_PARAMS)

    # 4 with a different description
    params = DEFAULT_EXAMPLE_PARAMS | {"description": "something else"}
    ExampleTableFactory.create_batch(4, **params)

    # 3 with a different count
    params = DEFAULT_EXAMPLE_PARAMS | {"my_count": 234}
    ExampleTableFactory.create_batch(3, **params)

    # 2 that aren't drafts
    params = DEFAULT_EXAMPLE_PARAMS | {"example_type": ExampleType.CASE_STUDY}
    ExampleTableFactory.create_batch(2, **params)

    # 1 that is different in all ways
    params = {
        "description": "something else",
        "my_count": 234,
        "example_type": ExampleType.CASE_STUDY,
    }
    ExampleTableFactory.create_batch(1, **params)


def test_paginator(db_session, create_examples):
    # A base "select * from example_table" query
    base_stmt = select(ExampleTable)

    # Verify that with no additional filters, we get everything
    paginator = Paginator(ExampleTable, base_stmt, db_session, page_size=6)
    assert paginator.page_size == 6
    assert paginator.total_pages == 3
    assert paginator.total_records == 15

    # The pages are generated at the expected length
    assert len(paginator.page_at(1)) == 6
    assert len(paginator.page_at(2)) == 6
    assert len(paginator.page_at(3)) == 3
    assert len(paginator.page_at(4)) == 0

    # Verify when filtering by description
    stmt = base_stmt.filter(ExampleTable.description == "something else")
    paginator = Paginator(ExampleTable, stmt, db_session, page_size=10)
    assert paginator.page_size == 10
    assert paginator.total_pages == 1
    assert paginator.total_records == 5

    assert len(paginator.page_at(1)) == 5
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by my_count
    stmt = base_stmt.filter(ExampleTable.my_count == 234)
    paginator = Paginator(ExampleTable, stmt, db_session, page_size=1)
    assert paginator.page_size == 1
    assert paginator.total_pages == 4
    assert paginator.total_records == 4

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 1
    assert len(paginator.page_at(3)) == 1
    assert len(paginator.page_at(4)) == 1
    assert len(paginator.page_at(5)) == 0

    # Verify when filtering by example_type
    stmt = base_stmt.filter(ExampleTable.example_type == ExampleType.CASE_STUDY)
    paginator = Paginator(ExampleTable, stmt, db_session, page_size=100)
    assert paginator.page_size == 100
    assert paginator.total_pages == 1
    assert paginator.total_records == 3

    assert len(paginator.page_at(1)) == 3
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by all fields
    stmt = base_stmt.filter(
        ExampleTable.description == "something else",
        ExampleTable.my_count == 234,
        ExampleTable.example_type == ExampleType.CASE_STUDY,
    )
    paginator = Paginator(ExampleTable, stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 1
    assert paginator.total_records == 1

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering to zero results
    stmt = base_stmt.filter(ExampleTable.description == "something that won't be found")
    paginator = Paginator(ExampleTable, stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 0
    assert paginator.total_records == 0

    assert len(paginator.page_at(1)) == 0

    # Verify when adding joins, the counts continue to be correct
    # If we didn't have distinct in the count function, we'd end up with
    # every example being counted extra for each friend table value
    stmt = base_stmt.join(FriendTable).join(LinkFriendType)
    paginator = Paginator(ExampleTable, stmt, db_session, page_size=6)
    assert paginator.page_size == 6
    assert paginator.total_pages == 3
    assert paginator.total_records == 15


@pytest.mark.parametrize("page_size", [0, -1, -2])
def test_page_size_zero_or_negative(db_session, page_size):
    with pytest.raises(ValueError, match="Page size must be at least 1"):
        Paginator(ExampleTable, select(ExampleTable), db_session, page_size)
