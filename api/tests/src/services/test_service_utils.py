from datetime import date

from grants_shared.pagination.pagination_models import SortDirection, SortOrderParams
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel
from sqlalchemy import select

from src.adapters import search
from src.db.models.user_models import User
from src.search.search_models import (
    BoolSearchFilter,
    DateSearchFilter,
    IntSearchFilter,
    StrSearchFilter,
)
from src.services.service_utils import _add_search_filters


class FilterBag(BaseModel):
    status: StrSearchFilter | None = None
    is_active: BoolSearchFilter | None = None
    amount: IntSearchFilter | None = None
    created_at: DateSearchFilter | None = None


def test_apply_sorting_ascending():
    stmt = select(User)
    sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING)]

    result = apply_sorting(stmt, sort_order, User)

    compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
    assert 'ORDER BY api."user".user_id ASC' in compiled


def test_apply_sorting_descending():
    stmt = select(User)
    sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.DESCENDING)]

    result = apply_sorting(stmt, sort_order, User)

    compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
    assert 'ORDER BY api."user".user_id DESC' in compiled


def test_apply_sorting_multiple_columns():
    stmt = select(User)
    sort_order = [
        SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING),
        SortOrderParams(order_by="created_at", sort_direction=SortDirection.DESCENDING),
    ]

    result = apply_sorting(stmt, sort_order, User)

    compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
    assert 'ORDER BY api."user".user_id ASC, api."user".created_at DESC' in compiled


def test_apply_sorting_empty_list():
    stmt = select(User)

    result = apply_sorting(stmt, [], User)

    assert result.compare(stmt)


def test_add_search_filters_str_filter_calls_filter_terms():
    builder = search.SearchQueryBuilder()
    filters = FilterBag(status=StrSearchFilter(one_of=["active", "pending"]))

    _add_search_filters(builder, {}, filters)

    assert builder.filters == [
        {"terms": {"status": ["active", "pending"]}},
    ]


def test_add_search_filters_bool_filter_calls_filter_terms():
    builder = search.SearchQueryBuilder()
    filters = FilterBag(is_active=BoolSearchFilter(one_of=[True]))

    _add_search_filters(builder, {}, filters)

    assert builder.filters == [{"terms": {"is_active": [True]}}]


def test_add_search_filters_int_filter_calls_filter_int_range():
    builder = search.SearchQueryBuilder()
    filters = FilterBag(amount=IntSearchFilter(min=10, max=100))

    _add_search_filters(builder, {}, filters)

    assert builder.filters == [
        {"range": {"amount": {"gte": 10, "lte": 100}}},
    ]


def test_add_search_filters_date_filter_calls_filter_date_range():
    builder = search.SearchQueryBuilder()
    filters = FilterBag(
        created_at=DateSearchFilter(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
    )

    _add_search_filters(builder, {}, filters)

    assert builder.filters == [
        {
            "range": {
                "created_at": {
                    "gte": "2025-01-01",
                    "lte": "2025-12-31",
                }
            }
        }
    ]


def test_add_search_filters_request_field_name_mapping():
    builder = search.SearchQueryBuilder()
    filters = FilterBag(status=StrSearchFilter(one_of=["active"]))

    _add_search_filters(builder, {"status": "status.keyword"}, filters)

    assert builder.filters == [
        {"terms": {"status.keyword": ["active"]}},
    ]


def test_add_search_filters_no_filters_is_noop():
    builder = search.SearchQueryBuilder()

    _add_search_filters(builder, {}, None)

    assert builder.filters == []
