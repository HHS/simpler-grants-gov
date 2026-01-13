import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_required


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
