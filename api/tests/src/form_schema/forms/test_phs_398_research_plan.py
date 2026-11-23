"""Required strategy, optional named documents and DAT Appendix bounds."""

import uuid
from datetime import date

import pytest

from src.form_schema.forms.phs_398_research_plan_generated import FORM
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
    return setup_resolved_form(FORM)


SINGLE_DOCUMENTS = (
    "introduction_to_application",
    "specific_aims",
    "research_strategy",
    "progress_report_publication_list",
    "vertebrate_animals",
    "select_agent_research",
    "multiple_pd_pi_leadership_plan",
    "consortium_contractual_arrangements",
    "letters_of_support",
    "resource_sharing_plans",
    "other_plans",
    "authentication_of_key_biological_and_or_chemical_resources",
)
FILE_ID = "83cd24d4-e319-4c61-982c-b216299f5eb4"


@pytest.mark.parametrize("field", SINGLE_DOCUMENTS)
def test_named_document_uuid(form, field):
    data = {"research_strategy": FILE_ID, field: FILE_ID}
    assert validate_json_schema_for_form(data, form) == []
    data[field] = "not-a-file-id"
    issues = validate_json_schema_for_form(data, form)
    assert len(issues) == 1
    assert issues[0].type == "format"
    assert issues[0].field == f"$.{field}"


def test_strategy_is_required(form):
    issues = validate_json_schema_for_form({}, form)
    assert len(issues) == 1
    assert issues[0].type == "required"
    assert issues[0].field == "$.research_strategy"


@pytest.mark.parametrize("count", [0, 1, 10])
def test_appendix_valid_counts(form, count):
    data = {"research_strategy": FILE_ID, "appendix": [str(uuid.uuid4()) for _ in range(count)]}
    assert validate_json_schema_for_form(data, form) == []


def test_appendix_over_dat_limit(form):
    issues = validate_json_schema_for_form(
        {"research_strategy": FILE_ID, "appendix": [FILE_ID] * 11}, form
    )
    assert len(issues) == 1
    assert issues[0].type == "maxItems"


def test_identity():
    assert FORM.legacy_form_id == 797
    assert FORM.omb_number == "0925-0001"
    assert FORM.expiration_date == date(2027, 12, 31)


@pytest.mark.parametrize("include_appendix_upload", [True, False])
def test_appendix_attachment_must_belong_to_application(
    form, include_appendix_upload, enable_factory_create
):
    strategy_id = str(uuid.uuid4())
    appendix_id = str(uuid.uuid4())
    application_form = setup_application_for_form_validation(
        {"research_strategy": strategy_id, "appendix": [appendix_id]},
        json_schema=form.form_json_schema,
        rule_schema=form.form_rule_schema,
        attachment_ids=[strategy_id, appendix_id] if include_appendix_upload else [strategy_id],
    )
    errors = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert [error.type for error in errors] == (
        [] if include_appendix_upload else [ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT]
    )
