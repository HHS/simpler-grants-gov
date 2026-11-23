from uuid import uuid4

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
def minimal_valid_project_abstract_v1_2():
    return {"attachment": "2fbc3fd0-31bf-4434-b883-cfb284c5a394"}


def test_project_abstract_v1_2_minimal_valid_json(
    minimal_valid_project_abstract_v1_2, project_abstract_v1_2
):
    validation_issues = validate_json_schema_for_form(
        minimal_valid_project_abstract_v1_2, project_abstract_v1_2
    )
    assert len(validation_issues) == 0


def test_project_abstract_v1_2_empty_json(project_abstract_v1_2):
    validate_required({}, ["$.attachment"], project_abstract_v1_2)


def test_project_abstract_v1_2_attachment_type(project_abstract_v1_2):
    data = {"attachment": "my_attachment"}
    validation_issues = validate_json_schema_for_form(data, project_abstract_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'my_attachment' is not a 'uuid'"
    assert validation_issues[0].field == "$.attachment"


def test_project_abstract_v1_2_with_valid_attachment(
    enable_factory_create, project_abstract_v1_2, verify_no_warning_error_logs
):
    attachment_id = str(uuid4())
    application_form = setup_application_for_form_validation(
        {"attachment": attachment_id},
        json_schema=project_abstract_v1_2.form_json_schema,
        rule_schema=project_abstract_v1_2.form_rule_schema,
        attachment_ids=[attachment_id, str(uuid4())],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0


def test_project_abstract_v1_2_with_invalid_attachment(
    enable_factory_create, project_abstract_v1_2, verify_no_warning_error_logs
):
    unknown_id = str(uuid4())
    application_form = setup_application_for_form_validation(
        {"attachment": unknown_id},
        json_schema=project_abstract_v1_2.form_json_schema,
        rule_schema=project_abstract_v1_2.form_rule_schema,
        attachment_ids=[str(uuid4())],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 1
    assert issues[0].type == ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT
    assert issues[0].message == "Field references application_attachment_id not on the application"
    assert issues[0].value == unknown_id
