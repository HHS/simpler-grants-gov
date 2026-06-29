"""Unit tests for src.services.service_utils."""

from datetime import date
from unittest.mock import Mock

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
    """Tests for apply_sorting."""

    def test_apply_sorting_ascending(self):
        """Applying an ascending sort wraps the column in asc()."""
        sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING)]
        stmt = select(User)
        result = apply_sorting(stmt, User, sort_order)

        compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
        assert "ASC" in compiled

    def test_apply_sorting_descending(self):
        """Applying a descending sort wraps the column in desc()."""
        sort_order = [SortOrderParams(order_by="user_id", sort_direction=SortDirection.DESCENDING)]
        stmt = select(User)
        result = apply_sorting(stmt, User, sort_order)

        compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
        assert "DESC" in compiled

    def test_apply_sorting_multiple_columns(self):
        """Multiple sort orders preserve insertion order."""
        sort_order = [
            SortOrderParams(order_by="user_id", sort_direction=SortDirection.ASCENDING),
            SortOrderParams(order_by="email", sort_direction=SortDirection.DESCENDING),
        ]
        stmt = select(User)
        result = apply_sorting(stmt, User, sort_order)

        compiled = str(result.compile(compile_kwargs={"literal_binds": True}))
        # Both ASC and DESC should appear, with ASC first
        asc_pos = compiled.index("ASC")
        desc_pos = compiled.index("DESC")
        assert asc_pos < desc_pos

    def test_apply_sorting_empty_list(self):
        """An empty sort order returns the statement unchanged."""
        stmt = select(User)
        result = apply_sorting(stmt, User, [])

        # The statements should compile to the same SQL
        assert str(result.compile(compile_kwargs={"literal_binds": True})) == str(
            stmt.compile(compile_kwargs={"literal_binds": True})
        )


class TestAddSearchFilters:
    """Tests for _add_search_filters."""

    def _make_builder(self) -> Mock:
        return Mock()

    def test_add_search_filters_str_filter_calls_filter_terms(self):
        """StrSearchFilter with one_of calls builder.filter_terms."""
        builder = self._make_builder()

        class Filters:
            pass

        from pydantic import BaseModel

        class FilterBag(BaseModel):
            status: StrSearchFilter | None = None

        bag = FilterBag(status=StrSearchFilter(one_of=["active", "pending"]))
        _add_search_filters(builder, {}, bag)

        builder.filter_terms.assert_called_once_with("status", ["active", "pending"])

    def test_add_search_filters_bool_filter_calls_filter_terms(self):
        """BoolSearchFilter with one_of calls builder.filter_terms."""
        builder = self._make_builder()

        from pydantic import BaseModel

        class FilterBag(BaseModel):
            is_active: BoolSearchFilter | None = None

        bag = FilterBag(is_active=BoolSearchFilter(one_of=[True]))
        _add_search_filters(builder, {}, bag)

        builder.filter_terms.assert_called_once_with("is_active", [True])

    def test_add_search_filters_int_filter_calls_filter_int_range(self):
        """IntSearchFilter calls builder.filter_int_range with min/max."""
        builder = self._make_builder()

        from pydantic import BaseModel

        class FilterBag(BaseModel):
            amount: IntSearchFilter | None = None

        bag = FilterBag(amount=IntSearchFilter(min=10, max=100))
        _add_search_filters(builder, {}, bag)

        builder.filter_int_range.assert_called_once_with("amount", 10, 100)

    def test_add_search_filters_date_filter_calls_filter_date_range(self):
        """DateSearchFilter calls builder.filter_date_range with start/end."""
        builder = self._make_builder()

        from pydantic import BaseModel

        class FilterBag(BaseModel):
            created_at: DateSearchFilter | None = None

        bag = FilterBag(
            created_at=DateSearchFilter(
                start_date=date(2025, 1, 1), end_date=date(2025, 12, 31)
            )
        )
        _add_search_filters(builder, {}, bag)

        builder.filter_date_range.assert_called_once_with(
            "created_at", date(2025, 1, 1), date(2025, 12, 31)
        )

    def test_add_search_filters_request_field_name_mapping(self):
        """Mapped field names are used when calling builder methods."""
        builder = self._make_builder()

        from pydantic import BaseModel

        class FilterBag(BaseModel):
            my_field: StrSearchFilter | None = None

        bag = FilterBag(my_field=StrSearchFilter(one_of=["val"]))
        mapping = {"my_field": "renamed_field"}
        _add_search_filters(builder, mapping, bag)

        builder.filter_terms.assert_called_once_with("renamed_field", ["val"])

    def test_add_search_filters_no_filters_is_noop(self):
        """Passing None for filters makes zero builder calls."""
        builder = self._make_builder()
        _add_search_filters(builder, {}, None)

        builder.assert_not_called()
