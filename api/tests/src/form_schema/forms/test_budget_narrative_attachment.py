import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
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
