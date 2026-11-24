"""Validation of the two optional NSF reviewer lists."""

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form

FIELDS = ["suggested_reviewers", "reviewers_not_to_include"]


def test_empty_form_is_valid(nsf_suggested_reviewers_v1_1):
    assert validate_json_schema_for_form({}, nsf_suggested_reviewers_v1_1) == []


def test_complete_form_is_valid(nsf_suggested_reviewers_v1_1):
    data = {
        "suggested_reviewers": "Dr. Ada Example, Example University; microbial ecology.",
        "reviewers_not_to_include": "Dr. Ben Example; recent collaborator.",
    }
    assert validate_json_schema_for_form(data, nsf_suggested_reviewers_v1_1) == []


@pytest.mark.parametrize("field", FIELDS)
@pytest.mark.parametrize(
    "value", ["x", "x" * 4000, '"Dr. Ada Example"', "null", "Réviseur & <A>\n第二行"]
)
def test_field_accepts_text(nsf_suggested_reviewers_v1_1, field, value):
    assert validate_json_schema_for_form({field: value}, nsf_suggested_reviewers_v1_1) == []


@pytest.mark.parametrize("field", FIELDS)
@pytest.mark.parametrize(
    "value,kind",
    [("", "minLength"), ("x" * 4001, "maxLength"), (None, "type"), (True, "type"), ([], "type")],
)
def test_field_rejects_invalid_value(nsf_suggested_reviewers_v1_1, field, value, kind):
    issues = validate_json_schema_for_form({field: value}, nsf_suggested_reviewers_v1_1)
    assert [(issue.type, issue.field) for issue in issues] == [(kind, f"$.{field}")]
