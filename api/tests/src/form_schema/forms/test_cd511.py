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
def minimal_cd511_v1_1():
    return {
        "applicant_name": "Example Inc.",
        "project_name": "My example project",
        "contact_person": {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        "contact_person_title": "Director",
    }


@pytest.fixture
def full_cd511_v1_1():
    return {
        "applicant_name": "Example Inc.",
        "award_number": "ABC-XYZ",
        "project_name": "My example project",
        "contact_person": {
            "prefix": "Ms",
            "first_name": "Sally",
            "middle_name": "Sue",
            "last_name": "Sanders",
            "suffix": "III",
        },
        "contact_person_title": "Director",
        "signature": "Bob Smith",
        "submitted_date": "2025-01-01",
    }


def test_cd511_v1_1_minimal(minimal_cd511_v1_1, cd511_v1_1):
    validate_required(minimal_cd511_v1_1, [], cd511_v1_1)


def test_cd511_v1_1_full(full_cd511_v1_1, cd511_v1_1):
    validate_required(full_cd511_v1_1, [], cd511_v1_1)


def test_cd511_v1_1_empty_json(cd511_v1_1):
    validate_required(
        {},
        [
            "$.applicant_name",
            "$.contact_person",
            "$.contact_person_title",
            "$.project_name",
            "$.award_number",
        ],
        cd511_v1_1,
    )


def test_cd511_v1_1_empty_contact_person(minimal_cd511_v1_1, cd511_v1_1):
    data = minimal_cd511_v1_1
    data["contact_person"] = {}
    validate_required(
        data, ["$.contact_person.first_name", "$.contact_person.last_name"], cd511_v1_1
    )


def test_cd511_v1_1_mutually_required_fields(cd511_v1_1):
    """Test that one of project_name or award_number is required
    and will make their collective error messages go away."""
    base_data = {
        "applicant_name": "Example Inc.",
        "contact_person": {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        "contact_person_title": "Director",
    }
    validate_required(base_data, ["$.project_name", "$.award_number"], cd511_v1_1)

    # Adding project_name or award_number removes all the errors.
    validate_required(base_data | {"project_name": "my example project"}, [], cd511_v1_1)
    validate_required(base_data | {"award_number": "abc123"}, [], cd511_v1_1)
    # Both can be included as well
    validate_required(
        base_data | {"award_number": "abc123", "project_name": "my example project"}, [], cd511_v1_1
    )


def test_cd511_v1_1_min_length(cd511_v1_1):
    data = {
        "applicant_name": "",
        "award_number": "",
        "project_name": "",
        "contact_person": {
            "prefix": "",
            "first_name": "",
            "middle_name": "",
            "last_name": "",
            "suffix": "",
        },
        "contact_person_title": "",
        "signature": "",
    }

    EXPECTED_ERROR_FIELDS = [
        "$.applicant_name",
        "$.award_number",
        "$.project_name",
        "$.contact_person.prefix",
        "$.contact_person.first_name",
        "$.contact_person.middle_name",
        "$.contact_person.last_name",
        "$.contact_person.suffix",
        "$.contact_person_title",
        "$.signature",
    ]
    validate_min_length(data, EXPECTED_ERROR_FIELDS, cd511_v1_1)


def test_cd511_v1_1_max_length(cd511_v1_1):
    data = {
        "applicant_name": "A" * 61,
        "award_number": "B" * 26,
        "project_name": "C" * 61,
        "contact_person": {
            "prefix": "D" * 11,
            "first_name": "E" * 36,
            "middle_name": "F" * 26,
            "last_name": "G" * 61,
            "suffix": "H" * 11,
        },
        "contact_person_title": "I" * 46,
        "signature": "J" * 145,
    }

    EXPECTED_ERROR_FIELDS = [
        "$.applicant_name",
        "$.award_number",
        "$.project_name",
        "$.contact_person.prefix",
        "$.contact_person.first_name",
        "$.contact_person.middle_name",
        "$.contact_person.last_name",
        "$.contact_person.suffix",
        "$.contact_person_title",
        "$.signature",
    ]
    validate_max_length(data, EXPECTED_ERROR_FIELDS, cd511_v1_1)


def test_cd511_v1_1_pre_population(enable_factory_create, full_cd511_v1_1, cd511_v1_1):
    # Note that this form has no pre-population, this is mostly a sanity check
    # that nothing gets changed by it.
    application_form = setup_application_for_form_validation(
        full_cd511_v1_1,
        json_schema=cd511_v1_1.form_json_schema,
        rule_schema=cd511_v1_1.form_rule_schema,
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert len(issues) == 0

    # No changes
    assert full_cd511_v1_1 == application_form.application_response


@freezegun.freeze_time("2024-06-15 12:00:00", tz_offset=0)
def test_cd511_v1_1_post_population(enable_factory_create, full_cd511_v1_1, cd511_v1_1):
    application_form = setup_application_for_form_validation(
        full_cd511_v1_1,
        json_schema=cd511_v1_1.form_json_schema,
        rule_schema=cd511_v1_1.form_rule_schema,
        user_email="myexamplemail@example.com",
    )

    issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(issues) == 0
    app_json = application_form.application_response
    # Verify just the two post-population fields were added
    assert app_json == full_cd511_v1_1 | {
        "signature": "myexamplemail@example.com",
        "submitted_date": "2024-06-15",
    }
