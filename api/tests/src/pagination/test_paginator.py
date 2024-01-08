import pytest
from sqlalchemy import select

from src.db.models.opportunity_models import Opportunity
from src.pagination.paginator import Paginator
from tests.src.db.models.factories import OpportunityFactory

DEFAULT_OPPORTUNITY_PARAMS = {
    "opportunity_title": "opportunity of a lifetime",
    "opportunity_number": "XYZ-111",
    "is_draft": True,
}


@pytest.fixture
def create_opportunities(db_session, enable_factory_create):
    # Clear any prior opportunities from other tests so we're only fetching
    # records we created here.
    db_session.query(Opportunity).delete()

    # 5 with the default params
    OpportunityFactory.create_batch(5, **DEFAULT_OPPORTUNITY_PARAMS)

    # 4 with a different last name
    params = DEFAULT_OPPORTUNITY_PARAMS | {"opportunity_title": "something else"}
    OpportunityFactory.create_batch(4, **params)

    # 3 with a different opportunity number
    params = DEFAULT_OPPORTUNITY_PARAMS | {"opportunity_number": "XYZ-222"}
    OpportunityFactory.create_batch(3, **params)

    # 2 that aren't drafts
    params = DEFAULT_OPPORTUNITY_PARAMS | {"is_draft": False}
    OpportunityFactory.create_batch(2, **params)

    # 1 that is different in all ways
    params = DEFAULT_OPPORTUNITY_PARAMS | {
        "opportunity_title": "something else",
        "opportunity_number": "XYZ-222",
        "is_draft": False,
    }
    OpportunityFactory.create_batch(1, **params)


def test_paginator(db_session, create_opportunities):
    # A base "select * from opportunity" query
    base_stmt = select(Opportunity)

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
    stmt = base_stmt.filter(Opportunity.opportunity_title == "something else")
    paginator = Paginator(stmt, db_session, page_size=10)
    assert paginator.page_size == 10
    assert paginator.total_pages == 1
    assert paginator.total_records == 5

    assert len(paginator.page_at(1)) == 5
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by opportunity number
    stmt = base_stmt.filter(Opportunity.opportunity_number == "XYZ-222")
    paginator = Paginator(stmt, db_session, page_size=1)
    assert paginator.page_size == 1
    assert paginator.total_pages == 4
    assert paginator.total_records == 4

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 1
    assert len(paginator.page_at(3)) == 1
    assert len(paginator.page_at(4)) == 1
    assert len(paginator.page_at(5)) == 0

    # Verify when filtering by is_draft
    stmt = base_stmt.filter(Opportunity.is_draft.is_(False))
    paginator = Paginator(stmt, db_session, page_size=100)
    assert paginator.page_size == 100
    assert paginator.total_pages == 1
    assert paginator.total_records == 3

    assert len(paginator.page_at(1)) == 3
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering by all fields
    stmt = base_stmt.filter(
        Opportunity.opportunity_title == "something else",
        Opportunity.opportunity_number == "XYZ-222",
        Opportunity.is_draft.is_(False),
    )
    paginator = Paginator(stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 1
    assert paginator.total_records == 1

    assert len(paginator.page_at(1)) == 1
    assert len(paginator.page_at(2)) == 0

    # Verify when filtering to zero results
    stmt = base_stmt.filter(Opportunity.opportunity_title == "something that won't be found")
    paginator = Paginator(stmt, db_session)
    assert paginator.page_size == 25
    assert paginator.total_pages == 0
    assert paginator.total_records == 0

    assert len(paginator.page_at(1)) == 0


@pytest.mark.parametrize("page_size", [0, -1, -2])
def test_page_size_zero_or_negative(db_session, page_size):
    with pytest.raises(ValueError, match="Page size must be at least 1"):
        Paginator(select(Opportunity), db_session, page_size)
