import pytest

from src.form_schema.forms.sflll import SFLLL_v2_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


def validate_required(data: dict, expected_required_fields: list[str]):
    validation_issues = validate_json_schema_for_form(data, SFLLL_v2_0)

    assert len(validation_issues) == len(expected_required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in expected_required_fields


@pytest.fixture
def minimal_valid_sflll_v2_0() -> dict:
    return {
        "federal_action_type": "Grant",
        "federal_action_status": "InitialAward",
        "report_type": "InitialFiling",
        "reporting_entity": {
            "entity_type": "Prime",
            "applicant_reporting_entity": {
                "organization_name": "My example org",
                "address": {"street1": "123 Main St", "city": "Exampleburg"},
            },
        },
        "federal_agency_department": "Department of Research",
        "lobbying_registrant": {
            "individual": {
                "first_name": "Sally",
                "last_name": "Smith",
            },
        },
        "individual_performing_service": {
            "individual": {
                "first_name": "Fred",
                "last_name": "Jones",
            }
        },
        "signature_block": {
            "name": {
                "first_name": "Bob",
                "last_name": "Brown",
            },
        },
    }


@pytest.fixture
def full_valid_sflll_v2_0():
    return {
        "federal_action_type": "Grant",
        "federal_action_status": "InitialAward",
        "report_type": "MaterialChange",
        "material_change_year": "2025",
        "material_change_quarter": 3,
        "last_report_date": "2025-01-01",
        "reporting_entity": {
            "entity_type": "SubAwardee",
            "tier": 3,
            "applicant_reporting_entity": {
                "organization_name": "My example org",
                "address": {
                    "street1": "123 Main St",
                    "street2": "Rm #456",
                    "city": "Exampleburg",
                    "state": "DE: Delaware",
                    "zip_code": "12345-6789",
                },
                "congressional_district": "CA-012",
            },
            "prime_reporting_entity": {
                "organization_name": "My prime org",
                "address": {
                    "street1": "456 Primary Way",
                    "street2": "Apt #1",
                    "city": "Atlanta",
                    "state": "GA: Georgia",
                    "zip_code": "11111-1111",
                },
                "congressional_district": "GA-234",
            },
        },
        "federal_agency_department": "Department of Research",
        "federal_program_name": "Research",
        "assistance_listing_number": "12.345",
        "federal_action_number": "RFP-ABC-12-345",
        "award_amount": "100.00",
        "lobbying_registrant": {
            "individual": {
                "first_name": "Sally",
                "middle_name": "Sara",
                "last_name": "Smith",
                "prefix": "Ms",
                "suffix": "Jr",
            },
            "address": {
                "street1": "55 Dream Blvd",
                "street2": "Room #234",
                "city": "Exampleburg",
                "state": "HI: Hawaii",
                "zip_code": "45678",
            },
        },
        "individual_performing_service": {
            "individual": {
                "first_name": "Fred",
                "middle_name": "Robert",
                "last_name": "Jones",
            }
        },
        "signature_block": {
            "signature": "Bob",
            "name": {
                "first_name": "Bob",
                "middle_name": "Billy",
                "last_name": "Brown",
                "prefix": "Senor",
                "suffix": "Esquire",
            },
            "signed_date": "2025-01-01",
        },
    }


def test_sflll_v2_0_minimal_valid_json(minimal_valid_sflll_v2_0):
    validation_issues = validate_json_schema_for_form(minimal_valid_sflll_v2_0, SFLLL_v2_0)
    assert len(validation_issues) == 0


def test_sflll_v2_0_full_valid_json(full_valid_sflll_v2_0):
    validation_issues = validate_json_schema_for_form(full_valid_sflll_v2_0, SFLLL_v2_0)
    assert len(validation_issues) == 0


def test_sflll_v2_0_empty_json():
    EXPECTED_REQUIRED_FIELDS = [
        "$.federal_action_type",
        "$.federal_action_status",
        "$.report_type",
        "$.reporting_entity",
        "$.federal_agency_department",
        "$.lobbying_registrant",
        "$.individual_performing_service",
        "$.signature_block",
    ]
    validate_required({}, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_missing_material_change_fields(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["report_type"] = "MaterialChange"

    EXPECTED_REQUIRED_FIELDS = [
        "$.material_change_year",
        "$.material_change_quarter",
        "$.last_report_date",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


@pytest.mark.parametrize("bad_year", ["999", "10000", "-1000", "1000.123"])
def test_sflll_2_0_material_change_year_bad(full_valid_sflll_v2_0, bad_year):
    data = full_valid_sflll_v2_0
    data["material_change_year"] = bad_year

    validation_issues = validate_json_schema_for_form(data, SFLLL_v2_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "pattern"
    assert validation_issues[0].message == f"'{bad_year}' does not match '^[1-9][0-9]{{3}}$'"


def test_sflll_2_0_empty_objects(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["reporting_entity"] = {}
    data["lobbying_registrant"] = {}
    data["individual_performing_service"] = {}
    data["signature_block"] = {}

    EXPECTED_REQUIRED_FIELDS = [
        "$.reporting_entity.entity_type",
        "$.reporting_entity.applicant_reporting_entity",
        "$.lobbying_registrant.individual",
        "$.individual_performing_service.individual",
        "$.signature_block.name",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_entity_type_subawardee_missing_fields(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["reporting_entity"]["entity_type"] = "SubAwardee"

    EXPECTED_REQUIRED_FIELDS = [
        "$.reporting_entity.prime_reporting_entity",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_empty_reporting_entities(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["reporting_entity"]["applicant_reporting_entity"] = {}
    data["reporting_entity"]["prime_reporting_entity"] = {}

    EXPECTED_REQUIRED_FIELDS = [
        "$.reporting_entity.applicant_reporting_entity.organization_name",
        "$.reporting_entity.applicant_reporting_entity.address",
        "$.reporting_entity.prime_reporting_entity.organization_name",
        "$.reporting_entity.prime_reporting_entity.address",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_empty_reporting_entity_address(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["reporting_entity"]["applicant_reporting_entity"] = {
        "organization_name": "My org",
        "address": {},
    }

    EXPECTED_REQUIRED_FIELDS = [
        "$.reporting_entity.applicant_reporting_entity.address.street1",
        "$.reporting_entity.applicant_reporting_entity.address.city",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_empty_lobbying_registrant_fields(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["lobbying_registrant"] = {"individual": {}, "address": {}}

    EXPECTED_REQUIRED_FIELDS = [
        "$.lobbying_registrant.individual.first_name",
        "$.lobbying_registrant.individual.last_name",
        "$.lobbying_registrant.address.street1",
        "$.lobbying_registrant.address.city",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_empty_individual_performing_service_fields(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["individual_performing_service"] = {"individual": {}, "address": {}}

    EXPECTED_REQUIRED_FIELDS = [
        "$.individual_performing_service.individual.first_name",
        "$.individual_performing_service.individual.last_name",
        "$.individual_performing_service.address.street1",
        "$.individual_performing_service.address.city",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


def test_sflll_2_0_empty_signature_block_name_fields(minimal_valid_sflll_v2_0):
    data = minimal_valid_sflll_v2_0
    data["signature_block"]["name"] = {}

    EXPECTED_REQUIRED_FIELDS = [
        "$.signature_block.name.first_name",
        "$.signature_block.name.last_name",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS)


@pytest.mark.parametrize(
    "field,value",
    [
        ("federal_action_type", "not-a-value"),
        ("federal_action_status", "bidoffer"),
        ("report_type", "xyz"),
    ],
)
def test_sflll_2_0_invalid_enums(minimal_valid_sflll_v2_0, field, value):
    data = minimal_valid_sflll_v2_0
    data[field] = value

    validation_issues = validate_json_schema_for_form(data, SFLLL_v2_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "enum"
    assert validation_issues[0].message.startswith(f"'{value}' is not one of")
