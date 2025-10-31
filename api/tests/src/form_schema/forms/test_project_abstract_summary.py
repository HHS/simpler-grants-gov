import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_required


@pytest.fixture
def minimal_valid_summary_v2_0() -> dict:
    return {
        "funding_opportunity_number": "ABC-123",
        "applicant_name": "My Company LLC",
        "project_title": "Research into Science",
        "project_abstract": "We plan to do research on science",
    }


@pytest.fixture
def full_valid_summary_v2_0() -> dict:
    return {
        "funding_opportunity_number": "XYZ-456",
        "assistance_listing_number": "12.345",
        "applicant_name": "My Business Inc",
        "project_title": "Space Exploration",
        "project_abstract": "We are going to Pluto",
    }


def test_summary_v2_0_minimal_valid_json(minimal_valid_summary_v2_0, project_abstract_summary_v2_0):
    validation_issues = validate_json_schema_for_form(
        minimal_valid_summary_v2_0, project_abstract_summary_v2_0
    )
    assert len(validation_issues) == 0


def test_summary_v2_0_full_valid_json(full_valid_summary_v2_0, project_abstract_summary_v2_0):
    validation_issues = validate_json_schema_for_form(
        full_valid_summary_v2_0, project_abstract_summary_v2_0
    )
    assert len(validation_issues) == 0


def test_summary_v2_0_empty_json(project_abstract_summary_v2_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.funding_opportunity_number",
        "$.applicant_name",
        "$.project_title",
        "$.project_abstract",
    ]

    validate_required({}, EXPECTED_REQUIRED_FIELDS, project_abstract_summary_v2_0)


def test_summary_v2_0_min_length(project_abstract_summary_v2_0):
    data = {
        "funding_opportunity_number": "",
        "assistance_listing_number": "",
        "applicant_name": "",
        "project_title": "",
        "project_abstract": "",
    }
    validation_issues = validate_json_schema_for_form(data, project_abstract_summary_v2_0)

    EXPECTED_ERROR_FIELDS = [
        "$.funding_opportunity_number",
        "$.assistance_listing_number",
        "$.applicant_name",
        "$.project_title",
        "$.project_abstract",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "minLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS


def test_summary_v2_0_max_length(project_abstract_summary_v2_0):
    data = {
        "funding_opportunity_number": "a" * 41,
        "assistance_listing_number": "b" * 16,
        "applicant_name": "c" * 61,
        "project_title": "d" * 251,
        "project_abstract": "e" * 4001,
    }
    validation_issues = validate_json_schema_for_form(data, project_abstract_summary_v2_0)

    EXPECTED_ERROR_FIELDS = [
        "$.funding_opportunity_number",
        "$.assistance_listing_number",
        "$.applicant_name",
        "$.project_title",
        "$.project_abstract",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "maxLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS
