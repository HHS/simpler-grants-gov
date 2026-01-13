import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.validation.validation_constants import ValidationErrorType
from tests.lib.data_factories import setup_application_for_form_validation


@pytest.fixture
def minimal_valid_attachment_form_v1_2():
    return {"att1": "00b9001b-6ca8-4c0c-9328-46f39e9ff14b"}


def test_attachment_form_v1_2_minimal_valid_json(
    minimal_valid_attachment_form_v1_2, attachment_form_v1_2
):
    validation_issues = validate_json_schema_for_form(
        minimal_valid_attachment_form_v1_2, attachment_form_v1_2
    )
    assert len(validation_issues) == 0


def test_attachment_form_v1_2_empty_json(attachment_form_v1_2):
    # All fields are optional, so empty object should be valid
    validation_issues = validate_json_schema_for_form({}, attachment_form_v1_2)
    assert len(validation_issues) == 0


def test_attachment_form_v1_2_multiple_attachments(attachment_form_v1_2):
    data = {
        "att1": "c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5",
        "att5": "12345678-1234-5678-1234-567812345678",
        "att10": "87654321-4321-8765-4321-876543218765",
        "att15": "abcdef12-3456-7890-abcd-ef1234567890",
    }
    validation_issues = validate_json_schema_for_form(data, attachment_form_v1_2)
    assert len(validation_issues) == 0


def test_attachment_form_v1_2_invalid_attachment_type(attachment_form_v1_2):
    data = {
        "att1": "c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5",
        "att2": "my_attachment",
    }
    validation_issues = validate_json_schema_for_form(data, attachment_form_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'my_attachment' is not a 'uuid'"
    assert validation_issues[0].field == "$.att2"


def test_attachment_form_v1_2_all_attachments(attachment_form_v1_2):
    # Test with all 15 attachment fields populated
    data = {
        "att1": "11111111-1111-1111-1111-111111111111",
        "att2": "22222222-2222-2222-2222-222222222222",
        "att3": "33333333-3333-3333-3333-333333333333",
        "att4": "44444444-4444-4444-4444-444444444444",
        "att5": "55555555-5555-5555-5555-555555555555",
        "att6": "66666666-6666-6666-6666-666666666666",
        "att7": "77777777-7777-7777-7777-777777777777",
        "att8": "88888888-8888-8888-8888-888888888888",
        "att9": "99999999-9999-9999-9999-999999999999",
        "att10": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "att11": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "att12": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "att13": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "att14": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "att15": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    }
    validation_issues = validate_json_schema_for_form(data, attachment_form_v1_2)
    assert len(validation_issues) == 0


def test_attachment_form_v1_2_invalid_field_name(attachment_form_v1_2):
    # Test that additional fields are not allowed
    data = {
        "att1": "c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5",
        "att16": "12345678-1234-5678-1234-567812345678",  # Invalid field
    }
    validation_issues = validate_json_schema_for_form(data, attachment_form_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "additionalProperties"


def test_attachment_form_v1_2_with_valid_attachments(
    enable_factory_create, attachment_form_v1_2, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        {
            "att1": "c64b0b36-3298-4d63-982e-07ec50c79d81",
            "att2": "dc435ad9-02a9-4e05-b28c-db6ba5fc39d7",
        },
        json_schema=attachment_form_v1_2.form_json_schema,
        rule_schema=attachment_form_v1_2.form_rule_schema,
        attachment_ids=[
            "c64b0b36-3298-4d63-982e-07ec50c79d81",
            "dc435ad9-02a9-4e05-b28c-db6ba5fc39d7",
        ],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0


def test_attachment_form_v1_2_with_invalid_attachment(
    enable_factory_create, attachment_form_v1_2, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        {"att1": "e74282d5-f41c-4b38-b5a2-e0a5ccdc8b99"},
        json_schema=attachment_form_v1_2.form_json_schema,
        rule_schema=attachment_form_v1_2.form_rule_schema,
        attachment_ids=["05056742-2b05-47bd-b5e7-8469fa9126ff"],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 1
    assert issues[0].type == ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT
    assert issues[0].message == "Field references application_attachment_id not on the application"
    assert issues[0].value == "e74282d5-f41c-4b38-b5a2-e0a5ccdc8b99"
