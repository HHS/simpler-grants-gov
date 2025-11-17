import freezegun
import pytest

from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)


@pytest.fixture
def minimal_valid_gg_lobbying_form_v1_1() -> dict:
    return {
        "organization_name": "Research Organization",
        "authorized_representative_name": {
            "first_name": "Joe",
            "last_name": "Doe",
        },
        "authorized_representative_title": "Professor",
    }


@pytest.fixture
def full_valid_gg_lobbying_form_v1_1() -> dict:
    return {
        "organization_name": "Investigative Place",
        "authorized_representative_name": {
            "prefix": "Mrs",
            "first_name": "Sue",
            "middle_name": "Lynn",
            "last_name": "Smith",
            "suffix": "Sr",
        },
        "authorized_representative_title": "Professor",
        "authorized_representative_signature": "Sue Smith",
        "submitted_date": "2025-01-01",
    }


def test_gg_lobbying_form_v1_1_minimal_valid_json(
    minimal_valid_gg_lobbying_form_v1_1, gg_lobbying_form_v1_1
):
    validate_required(minimal_valid_gg_lobbying_form_v1_1, [], gg_lobbying_form_v1_1)


def test_gg_lobbying_form_v1_1_full_valid_json(
    full_valid_gg_lobbying_form_v1_1, gg_lobbying_form_v1_1
):
    validate_required(full_valid_gg_lobbying_form_v1_1, [], gg_lobbying_form_v1_1)


def test_gg_lobbying_form_v1_1_empty_json(gg_lobbying_form_v1_1):
    EXPECTED_REQUIRED_FIELDS = [
        "$.organization_name",
        "$.authorized_representative_name",
        "$.authorized_representative_title",
    ]
    validate_required({}, EXPECTED_REQUIRED_FIELDS, gg_lobbying_form_v1_1)


def test_gg_lobbying_form_v1_1_empty_nested_json(
    minimal_valid_gg_lobbying_form_v1_1, gg_lobbying_form_v1_1
):
    data = minimal_valid_gg_lobbying_form_v1_1
    data["authorized_representative_name"] = {}

    EXPECTED_REQUIRED_FIELDS = [
        "$.authorized_representative_name.first_name",
        "$.authorized_representative_name.last_name",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, gg_lobbying_form_v1_1)


def test_gg_lobbying_form_v1_1_min_length(gg_lobbying_form_v1_1):
    data = {
        "organization_name": "",
        "authorized_representative_name": {
            "prefix": "",
            "first_name": "",
            "middle_name": "",
            "last_name": "",
            "suffix": "",
        },
        "authorized_representative_title": "",
        "authorized_representative_signature": "",
    }
    EXPECTED_ERROR_FIELDS = [
        "$.organization_name",
        "$.authorized_representative_name.prefix",
        "$.authorized_representative_name.first_name",
        "$.authorized_representative_name.middle_name",
        "$.authorized_representative_name.last_name",
        "$.authorized_representative_name.suffix",
        "$.authorized_representative_title",
        "$.authorized_representative_signature",
    ]

    validate_min_length(data, EXPECTED_ERROR_FIELDS, gg_lobbying_form_v1_1)


def test_gg_lobbying_form_v1_1_max_length(gg_lobbying_form_v1_1):
    data = {
        "organization_name": "A" * 61,
        "authorized_representative_name": {
            "prefix": "B" * 11,
            "first_name": "C" * 36,
            "middle_name": "D" * 26,
            "last_name": "E" * 61,
            "suffix": "F" * 11,
        },
        "authorized_representative_title": "G" * 46,
        "authorized_representative_signature": "H" * 145,
    }
    EXPECTED_ERROR_FIELDS = [
        "$.organization_name",
        "$.authorized_representative_name.prefix",
        "$.authorized_representative_name.first_name",
        "$.authorized_representative_name.middle_name",
        "$.authorized_representative_name.last_name",
        "$.authorized_representative_name.suffix",
        "$.authorized_representative_title",
        "$.authorized_representative_signature",
    ]

    validate_max_length(data, EXPECTED_ERROR_FIELDS, gg_lobbying_form_v1_1)


@freezegun.freeze_time("2025-06-15 12:00:00", tz_offset=0)
def test_gg_lobbying_form_v1_1_post_population(
    enable_factory_create, minimal_valid_gg_lobbying_form_v1_1, gg_lobbying_form_v1_1
):
    application_form = setup_application_for_form_validation(
        minimal_valid_gg_lobbying_form_v1_1,
        json_schema=gg_lobbying_form_v1_1.form_json_schema,
        rule_schema=gg_lobbying_form_v1_1.form_rule_schema,
        user_email="myexamplemail@example.com",
    )

    issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(issues) == 0
    app_json = application_form.application_response
    assert app_json == minimal_valid_gg_lobbying_form_v1_1 | {
        "authorized_representative_signature": "myexamplemail@example.com",
        "submitted_date": "2025-06-15",
    }
