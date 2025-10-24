import freezegun
import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation


@pytest.fixture
def valid_json_v4_0():
    return {
        "submission_type": "Application",
        "application_type": "New",
        "organization_name": "Example Org",
        "employer_taxpayer_identification_number": "123-456-7890",
        "sam_uei": "UEI123123123",
        "applicant": {
            "street1": "123 Main St",
            "city": "Exampleburg",
            "state": "NY: New York",
            "country": "USA: UNITED STATES",
            "zip_code": "12345",
        },
        "contact_person": {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        "phone_number": "123-456-7890",
        "email": "example@mail.com",
        "applicant_type_code": ["P: Individual"],
        "agency_name": "Department of Research",
        "funding_opportunity_number": "ABC-123",
        "funding_opportunity_title": "My Example Opportunity",
        "project_title": "My Project",
        "congressional_district_applicant": "MI.345",
        "congressional_district_program_project": "MI.567",
        "project_start_date": "2026-01-01",
        "project_end_date": "2026-12-31",
        "federal_estimated_funding": "5000.00",
        "applicant_estimated_funding": "1000.00",
        "state_estimated_funding": "2000.00",
        "local_estimated_funding": "1000.00",
        "other_estimated_funding": "0.00",
        "program_income_estimated_funding": "10.00",
        "total_estimated_funding": "9010.00",
        "state_review": "c. Program is not covered by E.O. 12372.",
        "delinquent_federal_debt": False,
        "certification_agree": True,
        "authorized_representative": {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        "authorized_representative_title": "Doctor",
        "authorized_representative_phone_number": "123-456-7890",
        "authorized_representative_email": "example@mail.com",
    }


@pytest.fixture
def full_valid_json_v4_0(valid_json_v4_0):
    # This makes it so all optional fields are set
    # and the if-then required logic would be hit and satisfied

    return valid_json_v4_0 | {
        "application_type": "Revision",
        "revision_type": "E: Other (specify)",
        "revision_other_specify": "I am redoing it",
        "date_received": "2025-01-01",
        "applicant_id": "ABC123",
        "federal_entity_identifier": "XYZ456",
        "federal_award_identifier": "1234567890",
        "state_receive_date": "2025-06-01",
        "state_application_id": "12345",
        "applicant": {
            "street1": "123 Main St",
            "street2": "Room 101",
            "city": "Big Apple",
            "county": "Madison",
            "state": "NY: New York",
            "country": "CAN: CANADA",
            "zip_code": "56789",
        },
        "department_name": "Department of Research",
        "division_name": "Science",
        "contact_person": {
            "prefix": "Mrs",
            "first_name": "Sally",
            "middle_name": "Anne",
            "last_name": "Jones",
            "suffix": "III",
        },
        "contact_person_title": "Director",
        "organization_affiliation": "Secret Research",
        "fax": "123-456-7890",
        "applicant_type_code": ["P: Individual", "X: Other (specify)"],
        "applicant_type_other_specify": "Secret Development",
        "assistance_listing_number": "12.345",
        "assistance_listing_program_title": "Secret Research",
        "competition_identification_number": "ABC-XYZ-123",
        "competition_identification_title": "Secret Research Project",
        "areas_affected": "06dea634-6882-4ffc-805c-f1e3e43038c7",
        "additional_project_title": [
            "e7293742-d325-4f11-88ac-c17e58a775e4",
            "fa824ef2-413a-4e93-a4b3-ad87df6f6dad",
        ],
        "additional_congressional_districts": "9003399d-93ea-42db-a80b-c3f94fc1aa16",
        "state_review": "a. This application was made available to the state under the Executive Order 12372 Process for review on",
        "state_review_available_date": "2025-05-31",
        "delinquent_federal_debt": True,
        "debt_explanation": "fc1c203a-4890-4237-a54f-8a66a7938cca",
        "authorized_representative": {
            "prefix": "Mr",
            "first_name": "Bob",
            "middle_name": "Frank",
            "last_name": "Smith",
            "suffix": "Jr",
        },
        "authorized_representative_title": "Agent",
        "authorized_representative_fax": "333-333-3333",
        "aor_signature": "Bob Smith",
        "date_signed": "2025-06-01",
    }


def test_sf424_v4_0_valid_json(sf424_v4_0, valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(valid_json_v4_0, sf424_v4_0)
    assert len(validation_issues) == 0


def test_sf424_v4_0_full_valid_json(sf424_v4_0, full_valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(full_valid_json_v4_0, sf424_v4_0)
    assert len(validation_issues) == 0


def test_sf424_v4_0_empty_json(sf424_v4_0):
    validation_issues = validate_json_schema_for_form({}, sf424_v4_0)

    EXPECTED_REQUIRED_FIELDS = {
        "$.submission_type",
        "$.application_type",
        "$.organization_name",
        "$.employer_taxpayer_identification_number",
        "$.sam_uei",
        "$.applicant",
        "$.contact_person",
        "$.phone_number",
        "$.email",
        "$.applicant_type_code",
        "$.agency_name",
        "$.funding_opportunity_number",
        "$.funding_opportunity_title",
        "$.project_title",
        "$.congressional_district_applicant",
        "$.congressional_district_program_project",
        "$.project_start_date",
        "$.project_end_date",
        "$.federal_estimated_funding",
        "$.applicant_estimated_funding",
        "$.state_estimated_funding",
        "$.local_estimated_funding",
        "$.other_estimated_funding",
        "$.program_income_estimated_funding",
        "$.total_estimated_funding",
        "$.state_review",
        "$.delinquent_federal_debt",
        "$.certification_agree",
        "$.authorized_representative",
        "$.authorized_representative_title",
        "$.authorized_representative_phone_number",
        "$.authorized_representative_email",
    }

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424_v4_0_empty_nested(sf424_v4_0, valid_json_v4_0):
    data = valid_json_v4_0
    data["applicant"] = {}
    data["contact_person"] = {}
    data["authorized_representative"] = {}

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)

    EXPECTED_REQUIRED_FIELDS = {
        "$.applicant.city",
        "$.applicant.country",
        "$.applicant.street1",
        "$.authorized_representative.first_name",
        "$.authorized_representative.last_name",
        "$.contact_person.first_name",
        "$.contact_person.last_name",
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
def test_sf424_v4_0_applicant_type_other(sf424_v4_0, valid_json_v4_0, value):
    """Verify that an applicant type of Other makes applicant_type_other_specify required"""
    data = valid_json_v4_0
    data["applicant_type_code"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
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
def test_sf424_v_4_0_applicant_type_length(sf424_v4_0, valid_json_v4_0, value, expected_error):
    """Verify applicant type length must be 1-3"""
    data = valid_json_v4_0
    data["applicant_type_code"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == expected_error


@pytest.mark.parametrize("value", ["123.4", "$123.45", "123..45", "12.345"])
def test_sf424_v4_0_monetary_amount_format(sf424_v4_0, valid_json_v4_0, value):
    data = valid_json_v4_0
    data["federal_estimated_funding"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert (
        validation_issues[0].message == f"'{value}' does not match '^(-)?\\\\d*([.]\\\\d{{2}})?$'"
    )


@pytest.mark.parametrize(
    "data",
    [
        # Date fields
        {"date_received": "not-a-date"},
        {"state_receive_date": "202323542312"},
        {"project_start_date": "nope"},
        {"project_end_date": "Jan 1st, 2025"},
        {"state_review_available_date": "n/a"},
        {"date_signed": "words"},
        # email fields
        {"email": "567890"},
        {"authorized_representative_email": "bob at mail.com"},
        # Attachment/uuid fields
        {"debt_explanation": "not-a-uuid"},
        {"additional_congressional_districts": "abc123"},
        {"additional_project_title": ["not-a-uuid"]},
        {"areas_affected": "yep"},
    ],
)
def test_sf424_v4_0_formats(sf424_v4_0, valid_json_v4_0, data):
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"


@pytest.mark.parametrize(
    "data",
    [
        {"applicant_id": ""},
        {"employer_taxpayer_identification_number": "12345678"},
        {"sam_uei": "xyz123"},
        {"congressional_district_applicant": ""},
        {"authorized_representative": {"first_name": "", "last_name": "Smith"}},
        {"authorized_representative_fax": ""},
    ],
)
def test_sf424_v4_0_min_length(sf424_v4_0, valid_json_v4_0, data):
    """Test some of the fields length requirements - does not check every single field"""
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"


@pytest.mark.parametrize(
    "data",
    [
        {"applicant_id": "1234567890123456789012345678901234567890"},
        {"employer_taxpayer_identification_number": "1" * 31},
        {"sam_uei": "xyz123xyz123xyz"},
        {"congressional_district_applicant": "1234567"},
        {
            "authorized_representative": {
                "first_name": "Bob",
                "middle_name": "Way-too-long-of-a-middle-name",
                "last_name": "Jones",
            }
        },
        {"assistance_listing_number": "1234567890.123456789"},
        {"federal_estimated_funding": "12345678901234567890"},
    ],
)
def test_sf424_v4_0_max_length(sf424_v4_0, valid_json_v4_0, data):
    """Test some of the fields length requirements - does not check every single field"""
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"


@pytest.mark.parametrize(
    "data,required_fields",
    [
        ({"application_type": "Revision"}, ["$.revision_type", "$.federal_award_identifier"]),
        ({"application_type": "Continuation"}, ["$.federal_award_identifier"]),
        ({"revision_type": "E: Other (specify)"}, ["$.revision_other_specify"]),
        ({"delinquent_federal_debt": True}, ["$.debt_explanation"]),
        (
            {
                "state_review": "a. This application was made available to the state under the Executive Order 12372 Process for review on"
            },
            ["$.state_review_available_date"],
        ),
        ({"applicant_type_code": ["X: Other (specify)"]}, ["$.applicant_type_other_specify"]),
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
def test_sf424_v4_0_conditionally_required_fields(
    sf424_v4_0, valid_json_v4_0, data, required_fields
):
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == len(required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in required_fields


def test_sf424_v4_0_pre_population_with_all_non_null_values(
    enable_factory_create, valid_json_v4_0, sf424_v4_0
):
    application_form = setup_application_for_form_validation(
        valid_json_v4_0,
        json_schema=sf424_v4_0.form_json_schema,
        rule_schema=sf424_v4_0.form_rule_schema,
        opportunity_number="ABC-123-XYZ",
        opportunity_title="My Example Opportunity",
        has_agency=True,
        agency_name="Example Agency XYZ",
        agency_code="ABC-XYZ-123-456-789",
        attachment_ids=["4943c20b-57cc-4611-9d10-582144de726d"],
        has_organization=True,
        uei="TESTUEI98765",
        has_assistance_listing_number=True,
        assistance_listing_number="12.345",
        assistance_listing_program_title="Example Program Title",
        public_competition_id="COMP-ABC-XYZ-123",
        competition_title="Competition for Research Funding",
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0
    # Verify prepopulation rules ran
    app_json = application_form.application_response
    assert app_json["sam_uei"] == "TESTUEI98765"
    assert app_json["agency_name"] == "Example Agency XYZ"
    assert app_json["assistance_listing_number"] == "12.345"
    assert app_json["assistance_listing_program_title"] == "Example Program Title"
    assert app_json["funding_opportunity_number"] == "ABC-123-XYZ"
    assert app_json["funding_opportunity_title"] == "My Example Opportunity"
    assert app_json["competition_identification_number"] == "COMP-ABC-XYZ-123"
    assert app_json["competition_identification_title"] == "Competition for Research Funding"
    # Post-populated fields not present
    assert "date_received" not in app_json
    assert "date_signed" not in app_json
    assert "aor_signature" not in app_json


def test_sf424_v4_0_pre_population_with_all_null_values(
    enable_factory_create, valid_json_v4_0, sf424_v4_0
):
    application_form = setup_application_for_form_validation(
        valid_json_v4_0,
        json_schema=sf424_v4_0.form_json_schema,
        rule_schema=sf424_v4_0.form_rule_schema,
        opportunity_number=None,
        opportunity_title=None,
        has_agency=False,
        agency_code=None,
        has_organization=False,
        has_assistance_listing_number=False,
        public_competition_id=None,
        competition_title=None,
    )

    issues = validate_application_form(application_form, ApplicationAction.MODIFY)

    assert len(issues) == 0
    # Verify prepopulation rules ran
    app_json = application_form.application_response
    assert app_json["sam_uei"] == "00000000INDV"
    assert app_json["agency_name"] == "unknown"
    assert app_json["funding_opportunity_number"] == "unknown"
    assert app_json["funding_opportunity_title"] == "unknown"
    assert "assistance_listing_program_title" not in app_json
    assert "competition_identification_number" not in app_json
    assert "competition_identification_title" not in app_json
    # Post-populated fields not present
    assert "date_received" not in app_json
    assert "date_signed" not in app_json
    assert "aor_signature" not in app_json


@freezegun.freeze_time("2023-02-20 12:00:00", tz_offset=0)
def test_sf424_post_population(enable_factory_create, valid_json_v4_0, sf424_v4_0):
    application_form = setup_application_for_form_validation(
        valid_json_v4_0,
        json_schema=sf424_v4_0.form_json_schema,
        rule_schema=sf424_v4_0.form_rule_schema,
        user_email="mynewmail@example.com",
    )

    issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(issues) == 0
    app_json = application_form.application_response
    assert app_json["date_received"] == "2023-02-20"
    assert app_json["date_signed"] == "2023-02-20"
    assert app_json["aor_signature"] == "mynewmail@example.com"
