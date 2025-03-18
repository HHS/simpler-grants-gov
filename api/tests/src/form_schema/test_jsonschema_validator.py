import pytest

from src.api.response import ValidationErrorDetail
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.db.models.factories import FormFactory

# Form with a fairly simple JsonSchema
SIMPLE_FORM = FormFactory.build(
    form_json_schema={
        "type": "object",
        "properties": {
            # Note that format validation by default is not enabled, so we're testing that it works
            "StrField": {"type": "string", "maxLength": 20, "format": "email"},
            "IntField": {"type": "integer", "maximum": 1000},
        },
        "required": ["StrField"],
    }
)

IF_THEN_FORM = FormFactory.build(
    form_json_schema={
        "type": "object",
        "properties": {"StrField": {"type": "string"}, "IntField": {"type": "integer"}},
        "if": {"properties": {"StrField": {"const": "BigValue"}}},
        "then": {"properties": {"IntField": {"minimum": 500}}},
        "else": {"properties": {"IntField": {"maximum": 10}}},
    }
)


@pytest.mark.parametrize(
    "data,expected_issues",
    [
        # Happy request
        ({"StrField": "Bob@mail.com", "IntField": 5}, []),
        # Empty request
        (
            {},
            [
                ValidationErrorDetail(
                    message="'StrField' is a required property", type="required", field="$"
                )
            ],
        ),
        # Exceed max length
        (
            {"StrField": "bobsmith@fakemail.com", "IntField": 1005},
            [
                ValidationErrorDetail(
                    message="'bobsmith@fakemail.com' is too long",
                    type="maxLength",
                    field="$.StrField",
                ),
                ValidationErrorDetail(
                    message="1005 is greater than the maximum of 1000",
                    type="maximum",
                    field="$.IntField",
                ),
            ],
        ),
        # Bad format
        (
                {"StrField": "not an email"},
                [
                    ValidationErrorDetail(
                        message="'not an email' is not a 'email'",
                        type="format",
                        field="$.StrField",
                    )
                ],
        ),
        # Bad types
        (
            {"StrField": 4, "IntField": "hello"},
            [
                ValidationErrorDetail(
                    message="4 is not of type 'string'", type="type", field="$.StrField"
                ),
                ValidationErrorDetail(
                    message="'hello' is not of type 'integer'", type="type", field="$.IntField"
                ),
            ],
        ),
        # Null values
        (
            {"StrField": None, "IntField": None},
            [
                ValidationErrorDetail(
                    message="None is not of type 'string'", type="type", field="$.StrField"
                ),
                ValidationErrorDetail(
                    message="None is not of type 'integer'", type="type", field="$.IntField"
                ),
            ],
        ),
    ],
)
def test_validate_json_schema_for_form_simple(data, expected_issues):
    validation_issues = validate_json_schema_for_form(data, SIMPLE_FORM)

    assert set(validation_issues) == set(expected_issues)


@pytest.mark.parametrize(
    "data,expected_issues",
    [
        ({"StrField": "BigValue", "IntField": 600}, []),
        (
            {"StrField": "BigValue", "IntField": 1},
            [
                ValidationErrorDetail(
                    message="1 is less than the minimum of 500", type="minimum", field="$.IntField"
                )
            ],
        ),
        (
            {"StrField": "SomethingElse", "IntField": 600},
            [
                ValidationErrorDetail(
                    message="600 is greater than the maximum of 10",
                    type="maximum",
                    field="$.IntField",
                )
            ],
        ),
        ({"StrField": "SomethingElse", "IntField": 1}, []),
    ],
)
def test_validate_json_schema_for_form_if_then(data, expected_issues):
    """This is mostly a sanity test that conditional validation looks the same"""
    validation_issues = validate_json_schema_for_form(data, IF_THEN_FORM)

    assert set(validation_issues) == set(expected_issues)
