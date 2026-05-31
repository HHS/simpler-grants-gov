from datetime import date
from unittest.mock import Mock

import pytest
from sqlalchemy import asc, desc, select

from src.db.models.user_models import User
from src.pagination.pagination_models import SortDirection, SortOrderParams
from src.search.search_models import (
    BoolSearchFilter,
    DateSearchFilter,
    IntSearchFilter,
    StrSearchFilter,
)
from src.services.service_utils import _add_search_filters, apply_sorting


class TestApplySorting:
    """Tests for apply_sorting helper."""

    def test_apply_sorting_ascending(self):
        """Ascending sort order wraps column in asc()."""
        stmt = select(User)
        sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING)]

        result = apply_sorting(stmt, User, sort_order)

        # The resulting SQL should contain ASC
        sql_str = str(result.compile(compile_kwargs={"literal_binds": True}))
        assert "ASC" in sql_str.upper()

    def test_apply_sorting_descending(self):
        """Descending sort order wraps column in desc()."""
        stmt = select(User)
        sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.DESCENDING)]

        result = apply_sorting(stmt, User, sort_order)

        sql_str = str(result.compile(compile_kwargs={"literal_binds": True}))
        assert "DESC" in sql_str.upper()

    def test_apply_sorting_multiple_columns(self):
        """Multiple sort orders preserve insertion order."""
        stmt = select(User)
        sort_order = [
            SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING),
            SortOrderParams(order_by="user_id", sort_direction=SortDirection.DESCENDING),
        ]

        result = apply_sorting(stmt, User, sort_order)

        sql_str = str(result.compile(compile_kwargs={"literal_binds": True})).upper()
        # Both ASC and DESC should be present
        assert "ASC" in sql_str
        assert "DESC" in sql_str
        # ASC should come before DESC (insertion order preserved)
        assert sql_str.index("ASC") < sql_str.index("DESC")

    def test_apply_sorting_empty_list(self):
        """Empty sort_order returns statement unchanged."""
        stmt = select(User)
        sort_order = []

        result = apply_sorting(stmt, User, sort_order)

        # The statements should be equivalent (no ORDER BY clause added)
        assert str(result) == str(stmt)


class TestAddSearchFilters:
    """Tests for _add_search_filters helper."""

    def test_add_search_filters_str_filter_calls_filter_terms(self):
        """StrSearchFilter calls builder.filter_terms with field and values."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"status"}
        filters.status = StrSearchFilter(one_of=["posted", "forecasted"])

        _add_search_filters(builder, {}, filters)

        builder.filter_terms.assert_called_once_with("status", ["posted", "forecasted"])

    def test_add_search_filters_bool_filter_calls_filter_terms(self):
        """BoolSearchFilter calls builder.filter_terms with field and bool values."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"is_active"}
        filters.is_active = BoolSearchFilter(one_of=[True])

        _add_search_filters(builder, {}, filters)

        builder.filter_terms.assert_called_once_with("is_active", [True])

    def test_add_search_filters_int_filter_calls_filter_int_range(self):
        """IntSearchFilter calls builder.filter_int_range with field and min/max."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"award_amount"}
        filters.award_amount = IntSearchFilter(min=1000, max=50000)

        _add_search_filters(builder, {}, filters)

        builder.filter_int_range.assert_called_once_with("award_amount", 1000, 50000)

    def test_add_search_filters_date_filter_calls_filter_date_range(self):
        """DateSearchFilter calls builder.filter_date_range with field and dates."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"post_date"}
        start = date(2025, 1, 1)
        end = date(2025, 12, 31)
        filters.post_date = DateSearchFilter(start_date=start, end_date=end)

        _add_search_filters(builder, {}, filters)

        builder.filter_date_range.assert_called_once_with("post_date", start, end)

    def test_add_search_filters_date_filter_uses_relative_dates(self):
        """DateSearchFilter falls back to relative dates when absolute dates are None."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"close_date"}
        filters.close_date = DateSearchFilter(
            start_date=None, end_date=None, start_date_relative=-30, end_date_relative=0
        )

        _add_search_filters(builder, {}, filters)

        builder.filter_date_range.assert_called_once_with("close_date", -30, 0)

    def test_add_search_filters_request_field_name_mapping(self):
        """Field name mapping translates request fields to OpenSearch fields."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"my_field"}
        filters.my_field = StrSearchFilter(one_of=["value"])

        _add_search_filters(builder, {"my_field": "opensearch_field"}, filters)

        builder.filter_terms.assert_called_once_with("opensearch_field", ["value"])

    def test_add_search_filters_no_filters_is_noop(self):
        """None filters produces zero builder calls."""
        builder = Mock()

        _add_search_filters(builder, {}, filters=None)

        builder.assert_not_called()

    def test_add_search_filters_str_filter_empty_one_of_is_noop(self):
        """StrSearchFilter with one_of=None does not call builder."""
        builder = Mock()
        filters = Mock()
        filters.model_fields_set = {"status"}
        filters.status = StrSearchFilter(one_of=None)

        _add_search_filters(builder, {}, filters)

        builder.filter_terms.assert_not_called()
