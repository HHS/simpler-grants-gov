from uuid import uuid4

import pytest

from src.form_schema.forms import PHSResearchTrainingGenerated_v5_0
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
    return setup_resolved_form(PHSResearchTrainingGenerated_v5_0)


@pytest.fixture
def answers():
    return {"program_plan": str(uuid4())}


@pytest.mark.parametrize(
    "field",
    [
        "introduction_to_application",
        "program_plan",
        "responsible_conduct_of_research",
        "methods_for_enhancing_reproducibility",
        "multiple_pd_pi_leadership_plan",
        "progress_report",
        "participating_faculty_biosketches",
        "letters_of_support",
        "data_tables",
        "vertebrate_animals",
        "select_agent_research",
        "consortium_contractual_arrangements",
        "other_plans",
    ],
)
def test_named_document_uuid(form, answers, field):
    answers[field] = str(uuid4())
    assert validate_json_schema_for_form(answers, form) == []
    answers[field] = "not-a-file-id"
    issues = validate_json_schema_for_form(answers, form)
    assert [(issue.type, issue.field) for issue in issues] == [("format", f"$.{field}")]


def test_optional_documents_can_be_omitted(form, answers):
    assert validate_json_schema_for_form(answers, form) == []


def test_required_document(form, answers):
    del answers["program_plan"]
    assert [issue.type for issue in validate_json_schema_for_form(answers, form)] == ["required"]


@pytest.mark.parametrize(("count", "valid"), [(10, True), (11, False)])
def test_appendix_limit(form, answers, count, valid):
    answers["appendix"] = [str(uuid4()) for _ in range(count)]
    issues = validate_json_schema_for_form(answers, form)
    assert [issue.type for issue in issues] == ([] if valid else ["maxItems"])


@pytest.mark.parametrize("owned", [True, False])
def test_appendix_attachment_ownership(form, answers, owned, enable_factory_create):
    appendix_id = str(uuid4())
    owned_ids = [answers["program_plan"]]
    if owned:
        owned_ids.append(appendix_id)
    application_form = setup_application_for_form_validation(
        {**answers, "appendix": [appendix_id]},
        json_schema=form.form_json_schema,
        rule_schema=form.form_rule_schema,
        attachment_ids=owned_ids,
    )
    issues = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert [issue.type for issue in issues] == (
        [] if owned else [ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT]
    )
