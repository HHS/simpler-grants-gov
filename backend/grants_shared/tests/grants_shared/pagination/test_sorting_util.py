import pytest
from sqlalchemy import select

from grants_shared.pagination.pagination_models import SortDirection, SortOrderParams
from grants_shared.pagination.sorting_util import apply_sorting
from tests.grants_shared.db_test_models.db_test_models import ExampleTable


def validate_order_by(stmt, expected_sql: str):
    raw_sql = stmt.compile(compile_kwargs={"literal_binds": True})
    assert expected_sql in str(raw_sql)


COLUMN_MAPPING = {
    "example_id": ExampleTable.example_id,
    "description": ExampleTable.description,
    "my_count": ExampleTable.my_count,
}


def test_apply_sorting_with_mapping_nulls_last():
    base_stmt = select(ExampleTable)

    # Sort by one field
    result = apply_sorting(
        base_stmt,
        [SortOrderParams(order_by="example_id", sort_direction=SortDirection.ASCENDING)],
        COLUMN_MAPPING,
        nulls_last=True,
    )
    validate_order_by(result, "ORDER BY grants_shared.example.example_id ASC NULLS LAST")

    # Sort by two fields
    result = apply_sorting(
        base_stmt,
        [
            SortOrderParams(order_by="description", sort_direction=SortDirection.DESCENDING),
            SortOrderParams(order_by="my_count", sort_direction=SortDirection.ASCENDING),
        ],
        COLUMN_MAPPING,
        nulls_last=True,
    )
    validate_order_by(
        result,
        "ORDER BY grants_shared.example.description DESC NULLS LAST, grants_shared.example.my_count ASC NULLS LAST",
    )

    # Sort by three fields
    result = apply_sorting(
        base_stmt,
        [
            SortOrderParams(order_by="description", sort_direction=SortDirection.ASCENDING),
            SortOrderParams(order_by="example_id", sort_direction=SortDirection.DESCENDING),
            SortOrderParams(order_by="my_count", sort_direction=SortDirection.DESCENDING),
        ],
        COLUMN_MAPPING,
        nulls_last=True,
    )
    validate_order_by(
        result,
        "ORDER BY grants_shared.example.description ASC NULLS LAST, grants_shared.example.example_id DESC NULLS LAST, grants_shared.example.my_count DESC NULLS LAST",
    )


def test_apply_sorting_with_mapping_no_nulls_last():
    result = apply_sorting(
        select(ExampleTable),
        [
            SortOrderParams(order_by="description", sort_direction=SortDirection.DESCENDING),
            SortOrderParams(order_by="my_count", sort_direction=SortDirection.ASCENDING),
        ],
        COLUMN_MAPPING,
    )
    validate_order_by(
        result,
        "ORDER BY grants_shared.example.description DESC, grants_shared.example.my_count ASC",
    )
    # No NULLS LAST should be emitted when the flag is left at its default
    assert "NULLS LAST" not in str(result.compile())


def test_apply_sorting_with_model_getattr():
    # Passing the model class resolves columns via getattr, no NULLS LAST by default
    result = apply_sorting(
        select(ExampleTable),
        [
            SortOrderParams(order_by="example_id", sort_direction=SortDirection.ASCENDING),
            SortOrderParams(order_by="my_count", sort_direction=SortDirection.DESCENDING),
        ],
        ExampleTable,
    )
    validate_order_by(
        result,
        "ORDER BY grants_shared.example.example_id ASC, grants_shared.example.my_count DESC",
    )
    assert "NULLS LAST" not in str(result.compile())


def test_apply_sorting_with_model_getattr_nulls_last():
    result = apply_sorting(
        select(ExampleTable),
        [SortOrderParams(order_by="my_count", sort_direction=SortDirection.ASCENDING)],
        ExampleTable,
        nulls_last=True,
    )
    validate_order_by(result, "ORDER BY grants_shared.example.my_count ASC NULLS LAST")


def test_apply_sorting_empty_sort_order():
    # An empty sort order should not add an ORDER BY clause
    result = apply_sorting(select(ExampleTable), [], COLUMN_MAPPING)
    assert "ORDER BY" not in str(result.compile())


def test_apply_sorting_missing_column_mapping():
    with pytest.raises(ValueError, match="not found in column mapping"):
        apply_sorting(
            select(ExampleTable),
            [SortOrderParams(order_by="not_a_field", sort_direction=SortDirection.ASCENDING)],
            COLUMN_MAPPING,
        )


def test_apply_sorting_missing_model_attribute():
    with pytest.raises(AttributeError):
        apply_sorting(
            select(ExampleTable),
            [SortOrderParams(order_by="not_a_field", sort_direction=SortDirection.ASCENDING)],
            ExampleTable,
        )
