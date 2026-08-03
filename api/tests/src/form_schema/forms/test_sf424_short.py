import freezegun
import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation


@pytest.fixture
def contact_person_group():
    return {
        "name": {
            "first_name": "Jane",
            "last_name": "Doe",
        },
        "title": "Project Director",
        "email": "jane@example.com",
        "phone_number": "123-456-7890",
        "address": {
            "street1": "123 Main St",
            "city": "Exampleburg",
            "state": "NY: New York",
            "country": "USA: UNITED STATES",
            "zip_code": "12345",
        },
    }


@pytest.fixture
def valid_json_v3_0(contact_person_group):
    # Minimal valid response. contact_person is always required regardless of the
    # same_as_project_director checkbox value — the user always fills in Section 8 directly.
    return {
        "agency_name": "Department of Research",
        "funding_opportunity_number": "ABC-123",
        "funding_opportunity_title": "My Example Opportunity",
        "organization_name": "Example Org",
        "applicant": {
            "street1": "123 Main St",
            "city": "Exampleburg",
            "state": "NY: New York",
            "country": "USA: UNITED STATES",
            "zip_code": "12345",
        },
        "applicant_type_code": ["P: Individual"],
        "employer_taxpayer_identification_number": "123-456-7890",
        "sam_uei": "UEI123123123",
        "congressional_district_applicant": "NY-001",
        "project_title": "My Project",
        "project_description": "A short description of my project.",
        "project_start_date": "2026-01-01",
        "project_end_date": "2026-12-31",
        "project_director": contact_person_group,
        "same_as_project_director": True,
        "contact_person": contact_person_group,
        "application_certification": True,
        "authorized_representative": {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        "authorized_representative_title": "Doctor",
        "authorized_representative_email": "example@mail.com",
        "authorized_representative_phone_number": "123-456-7890",
    }


@pytest.fixture
def full_valid_json_v3_0(valid_json_v3_0, contact_person_group):
    # All optional fields set and the primary contact provided separately from the
    # project director (same_as_project_director is False).
    contact = contact_person_group | {
        "name": {
            "prefix": "Mrs",
            "first_name": "Sally",
            "middle_name": "Anne",
            "last_name": "Jones",
            "suffix": "III",
        },
        "title": "Grants Administrator",
        "email": "sally@example.com",
        "fax": "222-222-2222",
    }
    return valid_json_v3_0 | {
        "assistance_listing_number": "12.345",
        "assistance_listing_program_title": "Secret Research",
        "date_received": "2025-01-01",
        "applicant_web_address": "https://example.org",
        "applicant_type_code": ["P: Individual", "X: Other (specify)"],
        "applicant_type_other_specify": "Secret Development",
        "same_as_project_director": False,
        "contact_person": contact,
        "authorized_representative": {
            "prefix": "Mr",
            "first_name": "Bob",
            "middle_name": "Frank",
            "last_name": "Smith",
            "suffix": "Jr",
        },
        "authorized_representative_fax": "333-333-3333",
        "aor_signature": "Bob Smith",
        "authorized_representative_date_signed": "2025-06-01",
    }


def test_sf424_short_v3_0_valid_json(sf424_short_v3_0, valid_json_v3_0):
    validation_issues = validate_json_schema_for_form(valid_json_v3_0, sf424_short_v3_0)
    assert len(validation_issues) == 0


def test_sf424_short_v3_0_full_valid_json(sf424_short_v3_0, full_valid_json_v3_0):
    validation_issues = validate_json_schema_for_form(full_valid_json_v3_0, sf424_short_v3_0)
    assert len(validation_issues) == 0


def test_sf424_short_v3_0_empty_json(sf424_short_v3_0):
    validation_issues = validate_json_schema_for_form({}, sf424_short_v3_0)

    EXPECTED_REQUIRED_FIELDS = {
        "$.agency_name",
        "$.funding_opportunity_number",
        "$.funding_opportunity_title",
        "$.organization_name",
        "$.applicant",
        "$.applicant_type_code",
        "$.employer_taxpayer_identification_number",
        "$.sam_uei",
        "$.congressional_district_applicant",
        "$.project_title",
        "$.project_description",
        "$.project_start_date",
        "$.project_end_date",
        "$.project_director",
        "$.contact_person",  # always required
        "$.application_certification",
        "$.authorized_representative",
        "$.authorized_representative_title",
        "$.authorized_representative_email",
        "$.authorized_representative_phone_number",
    }

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424_short_v3_0_empty_nested(sf424_short_v3_0, valid_json_v3_0):
    data = valid_json_v3_0
    data["applicant"] = {}
    data["project_director"] = {}
    data["authorized_representative"] = {}

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)

    EXPECTED_REQUIRED_FIELDS = {
        "$.applicant.street1",
        "$.applicant.city",
        "$.applicant.country",
        "$.project_director.name",
        "$.project_director.title",
        "$.project_director.address",
        "$.project_director.phone_number",
        "$.project_director.email",
        "$.authorized_representative.first_name",
        "$.authorized_representative.last_name",
    }

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


@pytest.mark.parametrize(
    "value",
    [
        ["X: Other (specify)"],
        ["X: Other (specify)", "A: State Government"],
        ["E: Regional Organization", "X: Other (specify)", "G: Independent School District"],
    ],
)
def test_sf424_short_v3_0_applicant_type_other(sf424_short_v3_0, valid_json_v3_0, value):
    """An applicant type of Other makes applicant_type_other_specify required."""
    data = valid_json_v3_0
    data["applicant_type_code"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == "'applicant_type_other_specify' is a required property"


@pytest.mark.parametrize(
    "value,expected_error",
    [
        ([], "[] should be non-empty"),
        (
            [
                "A: State Government",
                "B: County Government",
                "C: City or Township Government",
                "D: Special District Government",
            ],
            "The array is too long, expected a maximum length of 3",
        ),
    ],
)
def test_sf424_short_v3_0_applicant_type_length(
    sf424_short_v3_0, valid_json_v3_0, value, expected_error
):
    """Applicant type must have 1-3 values."""
    data = valid_json_v3_0
    data["applicant_type_code"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == expected_error


@pytest.mark.parametrize(
    "data,required_fields",
    [
        # Address in the US requires state and zip
        (
            {
                "applicant": {
                    "street1": "123 Main St",
                    "city": "New York",
                    "country": "USA: UNITED STATES",
                }
            },
            ["$.applicant.state", "$.applicant.zip_code"],
        ),
    ],
)
def test_sf424_short_v3_0_conditionally_required_fields(
    sf424_short_v3_0, valid_json_v3_0, data, required_fields
):
    data = valid_json_v3_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == len(required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in required_fields


def test_sf424_short_v3_0_contact_person_always_required(sf424_short_v3_0, valid_json_v3_0):
    """contact_person is always required regardless of the same_as_project_director flag."""
    data = valid_json_v3_0
    del data["contact_person"]

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "required"
    assert validation_issues[0].field == "$.contact_person"


@pytest.mark.parametrize(
    "data",
    [
        # Date fields
        {"date_received": "not-a-date"},
        {"project_start_date": "nope"},
        {"project_end_date": "Jan 1st, 2025"},
        {"authorized_representative_date_signed": "words"},
        # Email fields
        {"authorized_representative_email": "bob at mail.com"},
    ],
)
def test_sf424_short_v3_0_formats(sf424_short_v3_0, valid_json_v3_0, data):
    data = valid_json_v3_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"


@pytest.mark.parametrize(
    "data",
    [
        {"employer_taxpayer_identification_number": "12345678"},
        {"sam_uei": "xyz123"},
        {"congressional_district_applicant": ""},
        {"authorized_representative": {"first_name": "", "last_name": "Smith"}},
        {"authorized_representative_fax": ""},
    ],
)
def test_sf424_short_v3_0_min_length(sf424_short_v3_0, valid_json_v3_0, data):
    """Test some field length requirements - does not check every single field."""
    data = valid_json_v3_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"


@pytest.mark.parametrize(
    "data",
    [
        {"employer_taxpayer_identification_number": "1" * 31},
        {"sam_uei": "xyz123xyz123xyz"},
        {"congressional_district_applicant": "1234567"},
        {"project_title": "a" * 201},
        {"project_description": "a" * 1001},
        {"authorized_representative_title": "a" * 46},
    ],
)
def test_sf424_short_v3_0_max_length(sf424_short_v3_0, valid_json_v3_0, data):
    """Test some field length requirements - does not check every single field."""
    data = valid_json_v3_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_short_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"


def test_sf424_short_v3_0_pre_population_with_all_non_null_values(
    enable_factory_create, valid_json_v3_0, sf424_short_v3_0, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        valid_json_v3_0,
        json_schema=sf424_short_v3_0.form_json_schema,
        rule_schema=sf424_short_v3_0.form_rule_schema,
        opportunity_number="ABC-123-XYZ",
        opportunity_title="My Example Opportunity",
        has_agency=True,
        agency_name="Example Agency XYZ",
        agency_code="ABC-XYZ-123-456-789",
        has_organization=True,
        uei="SHORTUEI9876",
        has_assistance_listing_number=True,
        assistance_listing_number="12.345",
        assistance_listing_program_title="Example Program Title",
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0
    app_json = application_form.application_response
    assert app_json["sam_uei"] == "SHORTUEI9876"
    assert app_json["agency_name"] == "Example Agency XYZ"
    assert app_json["assistance_listing_number"] == "12.345"
    assert app_json["assistance_listing_program_title"] == "Example Program Title"
    assert app_json["funding_opportunity_number"] == "ABC-123-XYZ"
    assert app_json["funding_opportunity_title"] == "My Example Opportunity"
    # Post-populated fields not present on a modify
    assert "date_received" not in app_json
    assert "aor_signature" not in app_json
    assert "authorized_representative_date_signed" not in app_json


@freezegun.freeze_time("2023-02-20 12:00:00", tz_offset=0)
def test_sf424_short_v3_0_post_population(
    enable_factory_create, valid_json_v3_0, sf424_short_v3_0, verify_no_warning_error_logs
):
    application_form = setup_application_for_form_validation(
        valid_json_v3_0,
        json_schema=sf424_short_v3_0.form_json_schema,
        rule_schema=sf424_short_v3_0.form_rule_schema,
        user_email="mynewmail@example.com",
    )

    issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(issues) == 0
    app_json = application_form.application_response
    assert app_json["date_received"] == "2023-02-20"
    assert app_json["authorized_representative_date_signed"] == "2023-02-20"
    assert app_json["aor_signature"] == "mynewmail@example.com"
