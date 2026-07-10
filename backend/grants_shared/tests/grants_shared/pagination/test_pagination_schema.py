import pytest

from grants_shared.api.schemas.extension import Schema, SchemaValidationError, fields
from grants_shared.pagination.pagination_schema import generate_pagination_schema
from tests.grants_shared.api.schemas.schema_validation_utils import validate_expected_errors


class ExampleSchema(Schema):

    pagination = fields.Nested(
        generate_pagination_schema(
            "ExamplePagination1Schema", order_by_fields=["field1", "field2"]
        ),
        required=False,
    )

    pagination_with_defaults = fields.Nested(
        generate_pagination_schema(
            "ExamplePagination2Schema",
            order_by_fields=["field_a", "field_b", "field_c"],
            default_sort_order=[{"order_by": "field_a", "sort_direction": "ascending"}],
            default_page_size=5,
            default_page_offset=1,
        ),
        required=False,
    )


@pytest.mark.parametrize(
    "data",
    [
        {},
        {
            "pagination": {
                "sort_order": [{"order_by": "field1", "sort_direction": "ascending"}],
                "page_size": 5,
                "page_offset": 1,
            }
        },
        {
            "pagination": {
                "sort_order": [
                    {"order_by": "field1", "sort_direction": "ascending"},
                    {"order_by": "field2", "sort_direction": "descending"},
                ],
                "page_size": 25,
                "page_offset": 50,
            }
        },
        # One with defaults is perfectly valid to be empty
        {"pagination_with_defaults": {}},
    ],
)
def test_pagination_schema_valid_requests(data):
    issues = ExampleSchema().validate(data)
    assert len(issues) == 0


@pytest.mark.parametrize(
    "data,expected_errors",
    [
        # Missing required
        (
            {"pagination": {}},
            {
                "pagination.sort_order": SchemaValidationError.REQUIRED,
                "pagination.page_size": SchemaValidationError.REQUIRED,
                "pagination.page_offset": SchemaValidationError.REQUIRED,
            },
        ),
        # Empty sort_order
        (
            {"pagination": {"sort_order": [], "page_size": 5, "page_offset": 1}},
            {"pagination.sort_order": SchemaValidationError.MIN_OR_MAX_LENGTH},
        ),
        # Missing sort_order params
        (
            {"pagination": {"sort_order": [{}], "page_size": 5, "page_offset": 1}},
            {
                "pagination.sort_order.0.order_by": SchemaValidationError.REQUIRED,
                "pagination.sort_order.0.sort_direction": SchemaValidationError.REQUIRED,
            },
        ),
        # Invalid order_by
        (
            {
                "pagination": {
                    "sort_order": [{"order_by": "not_a_field", "sort_direction": "ascending"}],
                    "page_size": 5,
                    "page_offset": 1,
                }
            },
            {"pagination.sort_order.0.order_by": SchemaValidationError.INVALID_CHOICE},
        ),
    ],
)
def test_pagination_schema_invalid_values(data, expected_errors):
    issues = ExampleSchema().validate(data)
    validate_expected_errors(issues, expected_errors)
