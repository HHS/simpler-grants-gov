from uuid import uuid4

import pytest

from src.form_schema.forms import PHSCareerDevelopmentGenerated_v6_0
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
    return setup_resolved_form(PHSCareerDevelopmentGenerated_v6_0)


@pytest.fixture
def answers():
    return {"research_strategy": str(uuid4()), "is_us_citizen_or_national": True}


@pytest.mark.parametrize(
    "field",
    [
        "introduction_to_application",
        "candidate_information_and_goals",
        "specific_aims",
        "research_strategy",
        "progress_report_publication_list",
        "responsible_conduct_of_research",
        "mentoring_plan",
        "statements_of_support",
        "letters_of_support",
        "institutional_environment",
        "institutional_commitment",
        "candidates_contribution",
        "vertebrate_animals",
        "select_agent_research",
        "consortium_contractual_arrangements",
        "resource_sharing_plans",
        "other_plans",
        "key_biological_and_or_chemical_resources",
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
    del answers["research_strategy"]
    assert [issue.type for issue in validate_json_schema_for_form(answers, form)] == ["required"]


@pytest.mark.parametrize(("count", "valid"), [(10, True), (11, False)])
def test_appendix_limit(form, answers, count, valid):
    answers["appendix"] = [str(uuid4()) for _ in range(count)]
    issues = validate_json_schema_for_form(answers, form)
    assert [issue.type for issue in issues] == ([] if valid else ["maxItems"])


@pytest.mark.parametrize("owned", [True, False])
def test_appendix_attachment_ownership(form, answers, owned, enable_factory_create):
    appendix_id = str(uuid4())
    owned_ids = [answers["research_strategy"]]
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


def test_non_us_applicant_must_choose_citizenship_status(form, answers):
    answers["is_us_citizen_or_national"] = False
    assert [issue.type for issue in validate_json_schema_for_form(answers, form)] == ["required"]
    answers["non_us_citizenship_status"] = "Temporary U.S. Visa"
    assert validate_json_schema_for_form(answers, form) == []
