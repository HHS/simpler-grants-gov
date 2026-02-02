import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.validation.validation_constants import ValidationErrorType
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import validate_required


@pytest.fixture
def minimal_valid_other_narrative_v1_2():
    return {"attachments": ["2fbc3fd0-31bf-4434-b883-cfb284c5a394"]}


def test_other_narrative_v1_2_minimal_valid_json(
    minimal_valid_other_narrative_v1_2, other_narrative_attachment_v1_2
):
    validation_issues = validate_json_schema_for_form(
        minimal_valid_other_narrative_v1_2, other_narrative_attachment_v1_2
    )
    assert len(validation_issues) == 0


def test_other_narrative_v1_2_empty_json(other_narrative_attachment_v1_2):
    validate_required({}, ["$.attachments"], other_narrative_attachment_v1_2)


def test_other_narrative_v1_2_empty_attachments(other_narrative_attachment_v1_2):
    data = {"attachments": []}
    validation_issues = validate_json_schema_for_form(data, other_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minItems"
    assert validation_issues[0].message == "[] should be non-empty"


def test_other_narrative_v1_2_too_many_attachments(other_narrative_attachment_v1_2):
    data = {"attachments": ["3d23a54c-2c16-4d5c-bfd3-9889b80e6b75" for _ in range(101)]}
    validation_issues = validate_json_schema_for_form(data, other_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxItems"
    assert validation_issues[0].message == "The array is too long, expected a maximum length of 100"


def test_other_narrative_v1_2_attachment_type(other_narrative_attachment_v1_2):
    data = {"attachments": ["3d23a54c-2c16-4d5c-bfd3-9889b80e6b75", "my_attachment"]}
    validation_issues = validate_json_schema_for_form(data, other_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'my_attachment' is not a 'uuid'"
    assert validation_issues[0].field == "$.attachments[1]"


def test_other_narrative_attachment_v1_2_with_valid_attachment(
    enable_factory_create, other_narrative_attachment_v1_2, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        {
            "attachments": [
                "854568b1-b362-4e48-800f-25828987d2f4",
                "fbe13b07-c692-4d5f-bd97-eaafae9ea3bf",
            ]
        },
        json_schema=other_narrative_attachment_v1_2.form_json_schema,
        rule_schema=other_narrative_attachment_v1_2.form_rule_schema,
        attachment_ids=[
            "854568b1-b362-4e48-800f-25828987d2f4",
            "fbe13b07-c692-4d5f-bd97-eaafae9ea3bf",
            "b43a1ed2-4441-4e0b-851c-663816d10a56",
        ],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0


def test_other_narrative_attachment_v1_2_with_invalid_attachment(
    enable_factory_create, other_narrative_attachment_v1_2, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        {
            "attachments": [
                "230efa76-de05-4294-ae37-2e7bb77d0aed",
                "e56e8d6c-f8fa-4ff5-b82c-59b14a00db62",
            ]
        },
        json_schema=other_narrative_attachment_v1_2.form_json_schema,
        rule_schema=other_narrative_attachment_v1_2.form_rule_schema,
        attachment_ids=["230efa76-de05-4294-ae37-2e7bb77d0aed"],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 1
    assert issues[0].type == ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT
    assert issues[0].message == "Field references application_attachment_id not on the application"
    assert issues[0].field == "$.attachments[1]"
    assert issues[0].value == "e56e8d6c-f8fa-4ff5-b82c-59b14a00db62"
