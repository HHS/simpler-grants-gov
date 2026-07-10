from enum import StrEnum

import pytest

from grants_shared.api.schemas.extension import Schema, SchemaValidationError, fields
from grants_shared.api.schemas.search_schema import (
    BoolSearchSchemaBuilder,
    DateSearchSchemaBuilder,
    IntegerSearchSchemaBuilder,
    StrSearchSchemaBuilder,
    UuidSearchSchemaBuilder,
)
from tests.grants_shared.api.schemas.schema_validation_utils import validate_expected_errors


class MyEnum(StrEnum):
    A = "a"
    B = "b"
    C = "c"


class ExampleSchema(Schema):

    my_str_field = fields.Nested(
        StrSearchSchemaBuilder("MyStrFieldSchema")
        .with_one_of(example="hello", minimum_length=3)
        .build()
    )

    my_enum_field = fields.Nested(
        StrSearchSchemaBuilder("MyEnumFieldSchema").with_one_of(allowed_values=MyEnum).build()
    )

    my_pattern_field = fields.Nested(
        StrSearchSchemaBuilder("MyPatternFieldSchema").with_one_of(pattern=r"^\d{2}$").build()
    )

    positive_int_field = fields.Nested(
        IntegerSearchSchemaBuilder("MyPositiveIntFieldSchema")
        .with_integer_range(positive_only=True)
        .build()
    )
    all_int_field = fields.Nested(
        IntegerSearchSchemaBuilder("MyAllIntFieldSchema")
        .with_integer_range(min_example=-100, max_example=0, positive_only=False)
        .build()
    )

    bool_field = fields.Nested(
        BoolSearchSchemaBuilder("MyBoolFieldSchema").with_one_of(example=True).build()
    )

    date_range_field = fields.Nested(
        DateSearchSchemaBuilder("MyDateRangeFieldSchema").with_date_range().build()
    )

    uuid_field = fields.Nested(
        UuidSearchSchemaBuilder("MyUuidSearchFieldSchema").with_one_of(minimum_length=1).build()
    )
    uuid_null_min_field = fields.Nested(
        UuidSearchSchemaBuilder("MyUuidSearchFieldSchema").with_one_of(minimum_length=None).build()
    )


@pytest.mark.parametrize(
    "data",
    [
        # Empty is fine
        {},
        # Various valid string cases
        {
            "my_str_field": {"one_of": ["hello"]},
            "my_enum_field": {"one_of": ["a", "b"]},
            "my_pattern_field": {"one_of": ["12"]},
        },
        {
            "my_str_field": {"one_of": ["abc", "xyz"]},
            "my_enum_field": {"one_of": ["c", "a"]},
            "my_pattern_field": {"one_of": ["56", "78", "09"]},
        },
        # Various int cases
        {"positive_int_field": {"min": 10, "max": 100}, "all_int_field": {"min": 0, "max": 100}},
        {"positive_int_field": {"min": 0, "max": 1}, "all_int_field": {"min": -5, "max": -1}},
        {"positive_int_field": {"min": 35}, "all_int_field": {"max": -13}},
        # Various bool cases
        {"bool_field": {"one_of": [True]}},
        {"bool_field": {"one_of": [False]}},
        {"bool_field": {"one_of": [True, False]}},
        # Various date cases
        {"date_range_field": {"start_date": "2025-01-01", "end_date": "2025-12-31"}},
        {"date_range_field": {"start_date": "2023-04-03"}},
        {"date_range_field": {"end_date": "2024-05-13"}},
        {"date_range_field": {"start_date_relative": -10, "end_date_relative": 20}},
        {"date_range_field": {"start_date_relative": 35, "end_date_relative": 144}},
        {"date_range_field": {"start_date_relative": 15}},
        {"date_range_field": {"end_date_relative": -20}},
        {"date_range_field": {"start_date": "2022-04-04", "end_date_relative": 100}},
        {"date_range_field": {"start_date_relative": 13, "end_date": "2026-12-31"}},
        # Various UUID cases
        {
            "uuid_field": {"one_of": ["6381d5ae-0334-4b46-9fc7-3717f7829acd"]},
            "uuid_null_min_field": {"one_of": []},
        },
        {
            "uuid_field": {
                "one_of": [
                    "6381d5ae-0334-4b46-9fc7-3717f7829acd",
                    "9f506449-9968-487b-a835-39cbb7ed0ed4",
                ]
            },
            "uuid_null_min_field": {"one_of": ["a3cab250-f15c-464b-a5a0-7c8db58fe162"]},
        },
    ],
)
def test_valid_data_for_schema(data):
    issues = ExampleSchema().validate(data)
    assert len(issues) == 0


@pytest.mark.parametrize(
    "data,expected_errors",
    [
        # Various string issues
        (
            {
                "my_str_field": {"one_of": ["a"]},
                "my_enum_field": {"one_of": ["x"]},
                "my_pattern_field": {"one_of": ["123"]},
            },
            {
                "my_str_field.one_of.0": SchemaValidationError.MIN_LENGTH,
                "my_enum_field.one_of.0": SchemaValidationError.INVALID_CHOICE,
                "my_pattern_field.one_of.0": SchemaValidationError.FORMAT,
            },
        ),
        (
            {"my_str_field": {"one_of": [45]}, "my_enum_field": {"one_of": []}},
            {
                "my_str_field.one_of.0": SchemaValidationError.INVALID,
                "my_enum_field.one_of": SchemaValidationError.MIN_LENGTH,
            },
        ),
        # Various int issues
        (
            {"positive_int_field": {}, "all_int_field": {}},
            {
                "positive_int_field._schema": SchemaValidationError.REQUIRED,
                "all_int_field._schema": SchemaValidationError.REQUIRED,
            },
        ),
        (
            {"positive_int_field": {"min": -5}, "all_int_field": {"max": "hello"}},
            {
                "positive_int_field.min": SchemaValidationError.MIN_VALUE,
                "all_int_field.max": SchemaValidationError.INVALID,
            },
        ),
        # Various bool issues
        (
            {"bool_field": {"one_of": ["hello"]}},
            {"bool_field.one_of.0": SchemaValidationError.INVALID},
        ),
        # Various date range issues
        (
            {"date_range_field": {"start_date": "hello", "end_date": "123-45-67"}},
            {
                "date_range_field.start_date": SchemaValidationError.INVALID,
                "date_range_field.end_date": SchemaValidationError.INVALID,
            },
        ),
        (
            {"date_range_field": {"start_date_relative": "hello", "end_date_relative": {}}},
            {
                "date_range_field.start_date_relative": SchemaValidationError.INVALID,
                "date_range_field.end_date_relative": SchemaValidationError.INVALID,
            },
        ),
        ({"date_range_field": {}}, {"date_range_field._schema": SchemaValidationError.REQUIRED}),
        (
            {"date_range_field": {"start_date": "2026-01-01", "start_date_relative": 13}},
            {"date_range_field._schema": SchemaValidationError.INVALID},
        ),
        (
            {"date_range_field": {"end_date": "2023-07-07", "end_date_relative": 7}},
            {"date_range_field._schema": SchemaValidationError.INVALID},
        ),
        # Various UUID issues
        (
            {"uuid_field": {"one_of": []}, "uuid_null_min_field": {"one_of": ["hello"]}},
            {
                "uuid_field.one_of": SchemaValidationError.MIN_LENGTH,
                "uuid_null_min_field.one_of.0": SchemaValidationError.INVALID,
            },
        ),
        (
            {
                "uuid_field": {"one_of": ["a3cab250-f15c-464b-a5a0-7c8db58fe162", 565]},
                "uuid_null_min_field": {"one_of": ["a-3-c-ab7c8db58fe162"]},
            },
            {
                "uuid_field.one_of.1": SchemaValidationError.INVALID,
                "uuid_null_min_field.one_of.0": SchemaValidationError.INVALID,
            },
        ),
    ],
)
def test_invalid_data_for_schema(data, expected_errors):
    issues = ExampleSchema().validate(data)
    validate_expected_errors(issues, expected_errors)


def test_string_schema_pattern_and_allowed_values():
    with pytest.raises(Exception, match="Cannot specify both a pattern and allowed_values"):
        StrSearchSchemaBuilder("BadSchema123").with_one_of(
            pattern=r"^\d{2}$", allowed_values=MyEnum
        )
