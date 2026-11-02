import freezegun
import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import validate_required


@pytest.fixture
def minimal_valid_sf424d_v1_1() -> dict:
    return {
        "signature": "Jane Doe",
        "title": "Mrs.",
        "applicant_organization": "Place Business",
    }


@pytest.fixture
def full_valid_sf424d_v1_1(minimal_valid_sf424d_v1_1) -> dict:
    return minimal_valid_sf424d_v1_1 | {"date_signed": "2025-06-15"}


def test_sf424d_v1_1_minimal_valid_json(minimal_valid_sf424d_v1_1, sf424d_v1_1):
    validation_issues = validate_json_schema_for_form(minimal_valid_sf424d_v1_1, sf424d_v1_1)
    assert len(validation_issues) == 0


def test_sf424d_v1_1_full_valid_json(full_valid_sf424d_v1_1, sf424d_v1_1):
    validation_issues = validate_json_schema_for_form(full_valid_sf424d_v1_1, sf424d_v1_1)
    assert len(validation_issues) == 0


def test_sf424d_v1_1_empty_json(sf424d_v1_1):
    EXPECTED_REQUIRED_FIELDS = [
        "$.title",
        "$.applicant_organization",
    ]

    validate_required({}, EXPECTED_REQUIRED_FIELDS, sf424d_v1_1)


def test_sf424d_v1_1_min_length(sf424d_v1_1):
    data = {
        "signature": "",
        "title": "",
        "applicant_organization": "",
        "date_signed": "2025-01-01",
    }
    validation_issues = validate_json_schema_for_form(data, sf424d_v1_1)

    EXPECTED_ERROR_FIELDS = [
        "$.signature",
        "$.title",
        "$.applicant_organization",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "minLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS


def test_sf424d_v1_1_max_length(sf424d_v1_1):
    data = {
        "signature": "a" * 145,
        "title": "b" * 46,
        "applicant_organization": "c" * 61,
        "date_signed": "2025-01-01",
    }
    validation_issues = validate_json_schema_for_form(data, sf424d_v1_1)

    EXPECTED_ERROR_FIELDS = [
        "$.signature",
        "$.title",
        "$.applicant_organization",
    ]

    assert len(validation_issues) == len(EXPECTED_ERROR_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "maxLength"
        assert validation_issue.field in EXPECTED_ERROR_FIELDS


def test_sf424d_v1_1_date_field(minimal_valid_sf424d_v1_1, sf424d_v1_1):
    data = minimal_valid_sf424d_v1_1
    data["date_signed"] = "not-a-date"
    validation_issues = validate_json_schema_for_form(data, sf424d_v1_1)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'not-a-date' is not a 'date'"


@freezegun.freeze_time("2025-06-15 12:00:00", tz_offset=0)
def test_sf424d_v1_1_post_population(enable_factory_create, sf424d_v1_1):
    data = {
        "title": "Director",
        "applicant_organization": "Place Business",
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424d_v1_1.form_json_schema,
        rule_schema=sf424d_v1_1.form_rule_schema,
        user_email="myexamplemail@example.com",
    )

    issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(issues) == 0
    # Verify just the two post-population fields were added
    assert application_form.application_response == data | {
        "signature": "myexamplemail@example.com",
        "date_signed": "2025-06-15",
    }
