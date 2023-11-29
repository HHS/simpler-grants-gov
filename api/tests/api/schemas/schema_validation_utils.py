from enum import Enum, StrEnum
from random import choice
from string import ascii_uppercase
from typing import Type

from src.api.schemas.extension import MarshmallowErrorContainer, Schema, fields, validators
from src.validation.validation_constants import ValidationErrorType

#############################
# Validation Error Messages
#############################
MISSING_DATA = MarshmallowErrorContainer(
    ValidationErrorType.REQUIRED, "Missing data for required field."
)
INVALID_INTEGER = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid integer.")
INVALID_STRING = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid string.")
INVALID_STRING_PATTERN = MarshmallowErrorContainer(
    ValidationErrorType.FORMAT, "String does not match expected pattern."
)
INVALID_DATE = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid date.")
INVALID_DATETIME = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid datetime.")
INVALID_BOOLEAN = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid boolean.")
INVALID_SCHEMA_MSG = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Invalid input type.")
INVALID_SCHEMA = {"_schema": [INVALID_SCHEMA_MSG]}
INVALID_LIST = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid list.")
INVALID_UUID = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid UUID.")
INVALID_DECIMAL = MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid decimal.")
INVALID_SPECIAL_DECIMAL = MarshmallowErrorContainer(
    ValidationErrorType.SPECIAL_NUMERIC,
    "Special numeric values (nan or infinity) are not permitted.",
)
INVALID_EMAIL = MarshmallowErrorContainer(ValidationErrorType.FORMAT, "Not a valid email address.")
UNKNOWN_FIELD = MarshmallowErrorContainer(ValidationErrorType.UNKNOWN, "Unknown field.")


########################
# Validation Utilities
########################
def get_random_string(length: int):
    return "".join(choice(ascii_uppercase) for i in range(length))


def get_enum_error_msg(*enums: Type[Enum]):
    possible_values = []
    for enum in enums:
        possible_values.extend([e.value for e in enum])

    return MarshmallowErrorContainer(
        ValidationErrorType.INVALID_CHOICE, f"Must be one of: {', '.join(possible_values)}."
    )


def get_one_of_error_msg(choices: list[str]):
    choices_text = ", ".join([c for c in choices])

    return MarshmallowErrorContainer(
        ValidationErrorType.INVALID_CHOICE, f"Value must be one of: {choices_text}"
    )


def get_min_length_error_msg(length: int):
    return MarshmallowErrorContainer(
        ValidationErrorType.MIN_LENGTH, f"Shorter than minimum length {length}."
    )


def get_max_length_error_msg(length: int):
    return MarshmallowErrorContainer(
        ValidationErrorType.MAX_LENGTH, f"Longer than maximum length {length}."
    )


def get_length_range_error_msg(min: int, max: int):
    return MarshmallowErrorContainer(
        ValidationErrorType.MIN_OR_MAX_LENGTH, f"Length must be between {min} and {max}."
    )


def get_length_equal_error_msg(equal: int):
    return MarshmallowErrorContainer(ValidationErrorType.EQUALS, f"Length must be {equal}.")


def get_max_or_min_value_error_msg(min: int = -2147483648, max: int = 2147483647):
    # defaults are the 32-bit integer min/max
    return MarshmallowErrorContainer(
        ValidationErrorType.MIN_OR_MAX_VALUE,
        f"Must be greater than or equal to {min} and less than or equal to {max}.",
    )


def validate_errors(actual_errors, expected_errors):
    assert len(actual_errors) == len(
        expected_errors
    ), f"Expected {len(expected_errors)}, but had {len(actual_errors)} errors"
    for field_name in actual_errors:
        assert field_name in expected_errors, f"{field_name} in errors but not expected"
        assert (
            expected_errors[field_name] == actual_errors[field_name]
        ), f"Actual error for {field_name}: {str(actual_errors[field_name])} but received {str(expected_errors[field_name])}"


########################
# Schemas for testing
########################


class EnumA(StrEnum):
    VALUE1 = "value1"
    VALUE2 = "value2"
    VALUE3 = "value3"


class EnumB(StrEnum):
    VALUE4 = "value4"
    VALUE5 = "value5"
    VALUE6 = "value6"


class DummySchema(Schema):
    both_ab = fields.Enum(EnumA, EnumB)


class InnerTestSchema(Schema):
    inner_str = fields.String()
    inner_required_str = fields.String(required=True)


class FieldTestSchema(Schema):
    field_str = fields.String()
    field_str_required = fields.String(required=True)
    field_str_min = fields.String(validate=[validators.Length(min=2)])
    field_str_max = fields.String(validate=[validators.Length(max=3)])
    field_str_min_and_max = fields.String(validate=[validators.Length(min=2, max=3)])
    field_str_equal = fields.String(validate=[validators.Length(equal=3)])
    field_str_regex = fields.String(validate=[validators.Regexp("^\\d{3}$")])
    field_str_email = fields.String(validate=[validators.Email()])

    field_int = fields.Integer()
    field_int_required = fields.Integer(required=True)
    field_int_strict = fields.Integer(strict=True)

    field_bool = fields.Boolean()
    field_bool_required = fields.Boolean(required=True)

    field_decimal = fields.Decimal()
    field_decimal_required = fields.Decimal(required=True)
    field_decimal_special = fields.Decimal(allow_nan=False)

    field_uuid = fields.UUID()
    field_uuid_required = fields.UUID(required=True)

    field_date = fields.Date()
    field_date_required = fields.Date(required=True)
    field_date_format = fields.Date(format="iso8601")

    field_datetime = fields.DateTime()
    field_datetime_required = fields.DateTime(required=True)
    field_datetime_format = fields.DateTime(format="iso8601")

    field_list = fields.List(fields.Boolean())
    field_list_required = fields.List(fields.Integer(), required=True)
    field_list_indexed = fields.List(fields.Integer())

    field_nested = fields.Nested(InnerTestSchema())
    field_nested_invalid = fields.Nested(InnerTestSchema())
    field_nested_required = fields.Nested(InnerTestSchema(), required=True)

    field_list_nested = fields.List(fields.Nested(InnerTestSchema()))
    field_list_nested_invalid = fields.List(fields.Nested(InnerTestSchema()))
    field_list_nested_required = fields.List(fields.Nested(InnerTestSchema()), required=True)

    # There's no "invalid" raw field it doesn't serialize/deserialize
    field_raw_required = fields.Raw(required=True)

    field_enum = fields.Enum(EnumA)
    field_enum_invalid_choice = fields.Enum(EnumA)
    field_enum_required = fields.Enum(EnumB, required=True)


########################
# Requests for the above schema
########################


def get_valid_field_test_schema_req():
    return {
        "field_str": "text",
        "field_str_required": "text",
        "field_str_min": "abcd",
        "field_str_max": "a",
        "field_str_min_and_max": "ab",
        "field_str_equal": "abc",
        "field_str_regex": "123",
        "field_str_email": "person@example.com",
        "field_int": 1,
        "field_int_required": 2,
        "field_int_strict": 3,
        "field_bool": True,
        "field_bool_required": False,
        "field_decimal": "2.5",
        "field_decimal_required": "555",
        "field_decimal_special": "4",
        "field_uuid": "1234a5b6-7c8d-90ef-1ab2-c3d45678e9f0",
        "field_uuid_required": "1234a5b6-7c8d-90ef-1ab2-c3d45678e9f0",
        "field_date": "2000-01-01",
        "field_date_required": "2010-02-02",
        "field_date_format": "2020-03-03",
        "field_datetime": "2000-01-01T00:01:01Z",
        "field_datetime_required": "2010-02-02T00:02:02Z",
        "field_datetime_format": "2020-03-03T00:03:03Z",
        "field_list": [True],
        "field_list_required": [],
        "field_list_indexed": [1, 2, 3],
        "field_nested": {
            "inner_str": "text",
            "inner_required_str": "text",
        },
        "field_nested_invalid": {
            "inner_str": "text",
            "inner_required_str": "text",
        },
        "field_nested_required": {"inner_str": "text", "inner_required_str": "present"},
        "field_list_nested": [
            {"inner_str": "text", "inner_required_str": "present"},
            {"inner_str": "text", "inner_required_str": "present"},
        ],
        "field_list_nested_invalid": [],
        "field_list_nested_required": [],
        "field_raw_required": {},
        "field_enum": EnumA.VALUE1,
        "field_enum_invalid_choice": EnumA.VALUE2,
        "field_enum_required": EnumB.VALUE4,
    }


def get_invalid_field_test_schema_req():
    return {
        "field_str": 1234,
        # field_str_required not present
        "field_str_min": "a",
        "field_str_max": "abcdef",
        "field_str_min_and_max": "a",
        "field_str_equal": "a",
        "field_str_regex": "abc",
        "field_str_email": "not an email",
        "field_int": {},
        # field_int_required not present
        "field_int_strict": "123",
        "field_bool": 1234,
        # field_bool_required not present
        "field_decimal": "hello",
        # field_decimal_required not present
        "field_decimal_special": "NaN",
        "field_uuid": "hello",
        # field_uuid_required not present
        "field_date": 1234,
        # field_date_required not present
        "field_date_format": "20220202020202",
        "field_datetime": 1234,
        # field_datetime_required not present
        "field_datetime_format": "02022020 7-20PM PDT",
        "field_list": "not_a_list",
        # field_list_required not present
        "field_list_indexed": ["text", 1, "text"],
        "field_nested": {
            "inner_str": 1234,
            # inner_required_str not present
        },
        "field_nested_invalid": 5678,
        # field_nested_required not present
        "field_list_nested": [
            {"inner_str": 5678, "inner_required_str": "present"},
            {"inner_str": "valid"},  # inner_required_str not present
            54321,
        ],
        "field_list_nested_invalid": 54321,
        # field_list_nested_required not present
        # field_raw_required not present
        "field_enum": 12345,
        "field_enum_invalid_choice": "notvalid",
    }


def get_expected_validation_errors():
    # This is the expected output of the above
    # get_invalid_field_test_schema_req function
    return {
        "field_str": [INVALID_STRING],
        "field_str_required": [MISSING_DATA],
        "field_str_min": [get_min_length_error_msg(2)],
        "field_str_max": [get_max_length_error_msg(3)],
        "field_str_min_and_max": [get_length_range_error_msg(2, 3)],
        "field_str_equal": [get_length_equal_error_msg(3)],
        "field_str_regex": [INVALID_STRING_PATTERN],
        "field_str_email": [INVALID_EMAIL],
        "field_int": [INVALID_INTEGER],
        "field_int_required": [MISSING_DATA],
        "field_int_strict": [INVALID_INTEGER],
        "field_bool": [INVALID_BOOLEAN],
        "field_bool_required": [MISSING_DATA],
        "field_decimal": [INVALID_DECIMAL],
        "field_decimal_required": [MISSING_DATA],
        "field_decimal_special": [INVALID_SPECIAL_DECIMAL],
        "field_uuid": [INVALID_UUID],
        "field_uuid_required": [MISSING_DATA],
        "field_date": [INVALID_DATE],
        "field_date_required": [MISSING_DATA],
        "field_date_format": [INVALID_DATE],
        "field_datetime": [INVALID_DATETIME],
        "field_datetime_required": [MISSING_DATA],
        "field_datetime_format": [INVALID_DATETIME],
        "field_list": [INVALID_LIST],
        "field_list_required": [MISSING_DATA],
        "field_list_indexed": {0: [INVALID_INTEGER], 2: [INVALID_INTEGER]},
        "field_nested": {"inner_str": [INVALID_STRING], "inner_required_str": [MISSING_DATA]},
        "field_nested_invalid": INVALID_SCHEMA,
        "field_nested_required": [MISSING_DATA],
        "field_list_nested": {
            0: {"inner_str": [INVALID_STRING]},
            1: {"inner_required_str": [MISSING_DATA]},
            2: INVALID_SCHEMA,
        },
        "field_list_nested_invalid": [INVALID_LIST],
        "field_list_nested_required": [MISSING_DATA],
        "field_raw_required": [MISSING_DATA],
        "field_enum": [get_enum_error_msg(EnumA)],
        "field_enum_invalid_choice": [get_enum_error_msg(EnumA)],
        "field_enum_required": [MISSING_DATA],
    }
