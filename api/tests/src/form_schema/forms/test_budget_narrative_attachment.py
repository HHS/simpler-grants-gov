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
def minimal_valid_budget_narrative_v1_2():
    return {"attachments": ["00b9001b-6ca8-4c0c-9328-46f39e9ff14b"]}


def test_budget_narrative_v1_2_minimal_valid_json(
    minimal_valid_budget_narrative_v1_2, budget_narrative_attachment_v1_2
):
    validation_issues = validate_json_schema_for_form(
        minimal_valid_budget_narrative_v1_2, budget_narrative_attachment_v1_2
    )
    assert len(validation_issues) == 0


def test_budget_narrative_v1_2_empty_json(budget_narrative_attachment_v1_2):
    validate_required({}, ["$.attachments"], budget_narrative_attachment_v1_2)


def test_budget_narrative_v1_2_empty_attachments(budget_narrative_attachment_v1_2):
    data = {"attachments": []}
    validation_issues = validate_json_schema_for_form(data, budget_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minItems"
    assert validation_issues[0].message == "[] should be non-empty"


def test_budget_narrative_v1_2_too_many_attachments(budget_narrative_attachment_v1_2):
    data = {"attachments": ["c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5" for _ in range(101)]}
    validation_issues = validate_json_schema_for_form(data, budget_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxItems"
    assert validation_issues[0].message == "The array is too long, expected a maximum length of 100"


def test_budget_narrative_v1_2_attachment_type(budget_narrative_attachment_v1_2):
    data = {"attachments": ["c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5", "my_attachment"]}
    validation_issues = validate_json_schema_for_form(data, budget_narrative_attachment_v1_2)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'my_attachment' is not a 'uuid'"
    assert validation_issues[0].field == "$.attachments[1]"


def test_budget_narrative_attachment_v1_2_with_valid_attachment(
    enable_factory_create, budget_narrative_attachment_v1_2, verify_no_warning_error_logs
):
    first_id, second_id, unused_id = (str(uuid4()) for _ in range(3))
    application_form = setup_application_for_form_validation(
        {"attachments": [first_id, second_id]},
        json_schema=budget_narrative_attachment_v1_2.form_json_schema,
        rule_schema=budget_narrative_attachment_v1_2.form_rule_schema,
        attachment_ids=[first_id, second_id, unused_id],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0


def test_budget_narrative_attachment_v1_2_with_invalid_attachment(
    enable_factory_create, budget_narrative_attachment_v1_2, verify_no_warning_error_logs
):
    attached_id, unknown_id = str(uuid4()), str(uuid4())
    application_form = setup_application_for_form_validation(
        {"attachments": [attached_id, unknown_id]},
        json_schema=budget_narrative_attachment_v1_2.form_json_schema,
        rule_schema=budget_narrative_attachment_v1_2.form_rule_schema,
        attachment_ids=[attached_id],
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 1
    assert issues[0].type == ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT
    assert issues[0].message == "Field references application_attachment_id not on the application"
    assert issues[0].field == "$.attachments[1]"
    assert issues[0].value == unknown_id
