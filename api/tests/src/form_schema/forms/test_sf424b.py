import pytest

from src.form_schema.forms.sf424b import SF424b_v1_1
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


def validate_required(data: dict, expected_required_fields: list[str]):
    validation_issues = validate_json_schema_for_form(data, SF424b_v1_1)

    assert len(validation_issues) == len(expected_required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in expected_required_fields


@pytest.fixture
def minimal_valid_sf424b_v1_1() -> dict:
    return {
        "signature": "Bob Smith",
        "title": "Mr.",
        "applicant_organization": "Business Inc.",
        "date_signed": "2025-01-01",
    }


def test_sf424b_v1_1_minimal_valid_json(minimal_valid_sf424b_v1_1):
    validation_issues = validate_json_schema_for_form(minimal_valid_sf424b_v1_1, SF424b_v1_1)
    assert len(validation_issues) == 0


def test_sf424b_v1_1_empty_json():
    EXPECTED_REQUIRED_FIELDS = [
        "$.signature",
        "$.title",
        "$.applicant_organization",
        "$.date_signed",
    ]

    validate_required({}, EXPECTED_REQUIRED_FIELDS)


def test_sf424b_v1_1_min_length():
    data = {
        "signature": "",
        "title": "",
        "applicant_organization": "",
        "date_signed": "2025-01-01",
    }
    validation_issues = validate_json_schema_for_form(data, SF424b_v1_1)

    EXPECTED_ERROR_FIELDS = [
        "$.signature",
        "$.title",
        "$.applicant_organization",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "minLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS


def test_sf424b_v1_1_max_length():
    data = {
        "signature": "a" * 145,
        "title": "b" * 46,
        "applicant_organization": "c" * 61,
        "date_signed": "2025-01-01",
    }
    validation_issues = validate_json_schema_for_form(data, SF424b_v1_1)

    EXPECTED_ERROR_FIELDS = [
        "$.signature",
        "$.title",
        "$.applicant_organization",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "maxLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS


def test_sf424b_v1_1_date_field(minimal_valid_sf424b_v1_1):
    data = minimal_valid_sf424b_v1_1
    data["date_signed"] = "not-a-date"
    validation_issues = validate_json_schema_for_form(data, SF424b_v1_1)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'not-a-date' is not a 'date'"
