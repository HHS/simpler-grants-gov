from uuid import uuid4

import pytest

from src.form_schema.forms import EDAbstractGenerated_v1_1
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.validation.validation_constants import ValidationErrorType
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import setup_resolved_form


@pytest.fixture(scope="module")
def form():
    return setup_resolved_form(EDAbstractGenerated_v1_1)


def test_metadata(form):
    assert (form.legacy_form_id, form.form_version) == (267, "1.1")
    assert form.omb_number is None
    assert form.expiration_date is None
    assert form.form_instruction_id is not None


@pytest.mark.parametrize(
    ("answers", "error"),
    [
        ({}, "required"),
        ({"attachment": "not-a-uuid"}, "format"),
        ({"attachment": str(uuid4())}, None),
    ],
)
def test_attachment_schema(form, answers, error):
    issues = validate_json_schema_for_form(answers, form)
    assert [issue.type for issue in issues] == ([error] if error else [])


@pytest.mark.parametrize("owned", [True, False])
def test_attachment_ownership(form, owned, enable_factory_create):
    attachment_id = str(uuid4())
    application_form = setup_application_for_form_validation(
        {"attachment": attachment_id},
        json_schema=form.form_json_schema,
        rule_schema=form.form_rule_schema,
        attachment_ids=[attachment_id] if owned else [],
    )
    issues = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert [issue.type for issue in issues] == (
        [] if owned else [ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT]
    )
