import freezegun
import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation

EXPECTED_SECTION_FIELDS = {
    "federal_agency": ["/properties/agency_name"],
    "assistance_listing": [
        "/properties/assistance_listing_number",
        "/properties/assistance_listing_program_title",
    ],
    "date_received": ["/properties/date_received"],
    "funding_opportunity": [
        "/properties/funding_opportunity_number",
        "/properties/funding_opportunity_title",
    ],
    "applicant_information": [
        "/properties/organization_name",
        "/properties/applicant/properties/street1",
        "/properties/applicant/properties/street2",
        "/properties/applicant/properties/city",
        "/properties/applicant/properties/county",
        "/properties/applicant/properties/state",
        "/properties/applicant/properties/province",
        "/properties/applicant/properties/country",
        "/properties/applicant/properties/zip_code",
        "/properties/applicant_web_address",
        "/properties/applicant_type_code",
        "/properties/applicant_type_other_specify",
        "/properties/employer_taxpayer_identification_number",
        "/properties/sam_uei",
        "/properties/congressional_district_applicant",
    ],
    "project_information": [
        "/properties/project_title",
        "/properties/project_description",
        "/properties/project_start_date",
        "/properties/project_end_date",
    ],
    "project_director": [
        "/properties/project_director/properties/name/properties/prefix",
        "/properties/project_director/properties/name/properties/first_name",
        "/properties/project_director/properties/name/properties/middle_name",
        "/properties/project_director/properties/name/properties/last_name",
        "/properties/project_director/properties/name/properties/suffix",
        "/properties/project_director/properties/title",
        "/properties/project_director/properties/email",
        "/properties/project_director/properties/phone_number",
        "/properties/project_director/properties/fax",
        "/properties/project_director/properties/address/properties/street1",
        "/properties/project_director/properties/address/properties/street2",
        "/properties/project_director/properties/address/properties/city",
        "/properties/project_director/properties/address/properties/county",
        "/properties/project_director/properties/address/properties/state",
        "/properties/project_director/properties/address/properties/province",
        "/properties/project_director/properties/address/properties/country",
        "/properties/project_director/properties/address/properties/zip_code",
    ],
    "contact_person": [
        "/properties/same_as_project_director",
        "/properties/contact_person/properties/name/properties/prefix",
        "/properties/contact_person/properties/name/properties/first_name",
        "/properties/contact_person/properties/name/properties/middle_name",
        "/properties/contact_person/properties/name/properties/last_name",
        "/properties/contact_person/properties/name/properties/suffix",
        "/properties/contact_person/properties/title",
        "/properties/contact_person/properties/email",
        "/properties/contact_person/properties/phone_number",
        "/properties/contact_person/properties/fax",
        "/properties/contact_person/properties/address/properties/street1",
        "/properties/contact_person/properties/address/properties/street2",
        "/properties/contact_person/properties/address/properties/city",
        "/properties/contact_person/properties/address/properties/county",
        "/properties/contact_person/properties/address/properties/state",
        "/properties/contact_person/properties/address/properties/province",
        "/properties/contact_person/properties/address/properties/country",
        "/properties/contact_person/properties/address/properties/zip_code",
    ],
    "authorized_representative": [
        "/properties/application_certification",
        "/properties/authorized_representative/properties/prefix",
        "/properties/authorized_representative/properties/first_name",
        "/properties/authorized_representative/properties/middle_name",
        "/properties/authorized_representative/properties/last_name",
        "/properties/authorized_representative/properties/suffix",
        "/properties/authorized_representative_title",
        "/properties/authorized_representative_email",
        "/properties/authorized_representative_phone_number",
        "/properties/authorized_representative_fax",
        "/properties/aor_signature",
        "/properties/authorized_representative_date_signed",
    ],
}


def _find_property(schema: dict, property_name: str) -> dict | None:
    properties = schema.get("properties", {})
    if property_name in properties:
        return properties[property_name]

    for combined_schema in schema.get("allOf", []):
        matching_property = _find_property(combined_schema, property_name)
        if matching_property is not None:
            return matching_property

    return None


def _resolve_ui_definition(schema: dict, definition: str) -> dict | None:
    definition_parts = definition.removeprefix("/").split("/")
    resolved_schema = schema

    for index in range(0, len(definition_parts), 2):
        if definition_parts[index] != "properties":
            return None

        resolved_schema = _find_property(resolved_schema, definition_parts[index + 1])
        if resolved_schema is None:
            return None

    return resolved_schema


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
    # All optional fields set with a separate primary contact.
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


def test_sf424_short_v3_0_form_title_and_ui_section_order(sf424_short_v3_0):
    assert (
        sf424_short_v3_0.form_name
        == "APPLICATION FOR FEDERAL DOMESTIC ASSISTANCE-SHORT ORGANIZATIONAL (SF-424)"
    )
    assert [section["label"] for section in sf424_short_v3_0.form_ui_schema] == [
        "1. Name of Federal Agency",
        "2. Assistance Listing Number and Title",
        "3. Date Received",
        "4. Funding Opportunity Number and Title",
        "5. Applicant Information",
        "6. Project Information",
        "7. Project Director",
        "8. Primary Contact/Grants Administrator",
        "9. Authorized Representative",
    ]


def test_sf424_short_v3_0_ui_fields_are_in_expected_sections(sf424_short_v3_0):
    actual_section_fields = {
        section["name"]: [child["definition"] for child in section["children"]]
        for section in sf424_short_v3_0.form_ui_schema
    }

    assert actual_section_fields == EXPECTED_SECTION_FIELDS


def test_sf424_short_v3_0_ui_copy_and_widgets(sf424_short_v3_0):
    schema_properties = sf424_short_v3_0.form_json_schema["properties"]
    applicant_section = next(
        section
        for section in sf424_short_v3_0.form_ui_schema
        if section["name"] == "applicant_information"
    )
    applicant_type_field = next(
        field
        for field in applicant_section["children"]
        if field["definition"] == "/properties/applicant_type_code"
    )

    assert schema_properties["organization_name"]["description"] == (
        "Enter the legal name of applicant that will undertake the assistance activity. "
        "This is the name that the organization has registered with the System for Award "
        "Management (SAM.gov). Information on registering with SAM may be obtained by "
        "visiting the Grants.gov website."
    )
    assert schema_properties["applicant_web_address"]["title"] == "Web Address"
    assert schema_properties["applicant_type_code"]["description"] == (
        "Select a minimum of one applicant type or select up to three applicant types in "
        "accordance with agency instructions. If “Other” is selected, then specify Other "
        "Type of Applicant in text box."
    )
    assert schema_properties["applicant_type_code"]["minItems"] == 1
    assert schema_properties["applicant_type_code"]["maxItems"] == 3
    assert applicant_type_field["widget"] == "MultiSelect"
    assert schema_properties["congressional_district_applicant"]["description"] == (
        "Congressional District of Applicant is required: Enter the Congressional District "
        "in the format: 2 character State Abbreviation - 3 character District Number. "
        "Examples: CA-005 for California's 5th District, CA-012 for California's 12th "
        "District, NC-103 for North Carolina's 103rd District. If outside the U.S., enter "
        "00-000."
    )
    assert schema_properties["project_start_date"]["format"] == "date"
    assert schema_properties["project_end_date"]["format"] == "date"


def test_sf424_short_v3_0_same_as_project_director_checkbox_configuration(
    sf424_short_v3_0,
):
    checkbox_schema = sf424_short_v3_0.form_json_schema["properties"]["same_as_project_director"]

    assert checkbox_schema["type"] == "boolean"
    assert checkbox_schema["title"] == (
        "Same as Project Director (if checked, fill in information same as Project "
        "Director above)"
    )
    assert "default" not in checkbox_schema


def test_sf424_short_v3_0_authorized_representative_agreement_copy(
    sf424_short_v3_0,
):
    agreement_schema = sf424_short_v3_0.form_json_schema["properties"]["application_certification"]
    expected_description = (
        "** The list of certifications and assurances, or an internet site where you may "
        "obtain this list, is contained in the announcement or agency specific instructions. "
        "By signing this application, I certify (1) to the statements contained in the list "
        "of certifications and (2) that the statements herein are true, complete and accurate "
        "to the best of my knowledge. I also provide the required assurances and agree to "
        "comply with any resulting terms if I accept an award. I am aware that any false, "
        "fictitious, or fraudulent statements or claims may subject me to criminal, civil, or "
        "administrative penalties. (U.S. Code, Title 18, Section 1001)"
    )

    assert agreement_schema["title"] == "** I Agree"
    assert agreement_schema["description"] == expected_description
    assert agreement_schema["description"].startswith("** The list of certifications")
    assert agreement_schema["description"].index(
        "** The list of certifications"
    ) < agreement_schema["description"].index("By signing this application")
    assert agreement_schema["description"].count("The list of certifications") == 1
    assert agreement_schema["description"].count("By signing this application") == 1

    authorized_representative_section = next(
        section
        for section in sf424_short_v3_0.form_ui_schema
        if section["name"] == "authorized_representative"
    )
    agreement_field = authorized_representative_section["children"][0]
    assert agreement_field == {
        "type": "field",
        "definition": "/properties/application_certification",
        "printDescription": True,
    }


def test_sf424_short_v3_0_pre_and_post_populated_fields_use_null_ui_fields(
    sf424_short_v3_0,
):
    expected_null_definitions = {
        "/properties/agency_name",
        "/properties/assistance_listing_number",
        "/properties/assistance_listing_program_title",
        "/properties/date_received",
        "/properties/funding_opportunity_number",
        "/properties/funding_opportunity_title",
        "/properties/sam_uei",
        "/properties/aor_signature",
        "/properties/authorized_representative_date_signed",
    }
    actual_null_definitions = {
        field["definition"]
        for section in sf424_short_v3_0.form_ui_schema
        for field in section["children"]
        if field["type"] == "null"
    }

    assert actual_null_definitions == expected_null_definitions


def test_sf424_short_v3_0_only_post_populated_fields_use_json_schema_read_only(
    sf424_short_v3_0,
):
    schema_properties = sf424_short_v3_0.form_json_schema["properties"]
    expected_read_only_fields = {
        "date_received",
        "aor_signature",
        "authorized_representative_date_signed",
    }
    actual_read_only_fields = {
        field_name
        for field_name, field_schema in schema_properties.items()
        if field_schema.get("readOnly") is True
    }

    assert actual_read_only_fields == expected_read_only_fields


def test_sf424_short_v3_0_ui_schema_is_print_view_compatible(sf424_short_v3_0):
    for section in sf424_short_v3_0.form_ui_schema:
        assert section["type"] == "section"
        for field in section["children"]:
            assert field["type"] in {"field", "null"}
            assert (
                _resolve_ui_definition(sf424_short_v3_0.form_json_schema, field["definition"])
                is not None
            )


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
