import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)


@pytest.fixture
def contact_full() -> dict:
    return {
        "project_role": "Principal Investigator",
        "name": {
            "prefix": "Doctor",
            "first_name": "Sue",
            "middle_name": "Sally",
            "last_name": "Storm",
            "suffix": "Esquire",
        },
        "title": "Director",
        "organizational_affiliation": "Acme University",
        "address": {
            "street1": "123 Main Street",
            "street2": "Apt 123",
            "city": "Placeville",
            "state": "WY: Wyoming",
            "zip_code": "56789-1234",
            "country": "USA: UNITED STATES",
        },
        "phone": "1234567890",
        "fax": "1112223333",
        "email": "example@example.com",
    }


@pytest.fixture
def contact_minimal() -> dict:
    return {
        "project_role": "Project Manager",
        "name": {
            "first_name": "Joe",
            "last_name": "Smithers",
        },
        "address": {
            "street1": "456 Rio",
            "city": "Montevideo",
            "country": "URY: URUGUAY",
        },
        "phone": "1234567890",
        "email": "person@place.com",
    }


def test_key_contacts_v2_0_full_valid(contact_full, contact_minimal, key_contacts_v2_0):
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [contact_full, contact_minimal, contact_full, contact_minimal],
    }
    validate_required(data, [], key_contacts_v2_0)


def test_key_contacts_v2_0_minimal_valid(contact_minimal, key_contacts_v2_0):
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [contact_minimal],
    }
    validate_required(data, [], key_contacts_v2_0)


def test_key_contacts_v2_0_empty(key_contacts_v2_0):
    validate_required({}, ["$.applicant_organization_name", "$.key_contacts"], key_contacts_v2_0)


def test_key_contacts_v2_0_empty_array(key_contacts_v2_0):
    data = {"applicant_organization_name": "Acme Corporation", "key_contacts": []}
    issues = validate_json_schema_for_form(data, key_contacts_v2_0)
    assert len(issues) == 1
    assert issues[0].type == "minItems"
    assert issues[0].field == "$.key_contacts"


def test_key_contacts_v2_0_too_many(contact_minimal, key_contacts_v2_0):
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [contact_minimal] * 5,
    }
    issues = validate_json_schema_for_form(data, key_contacts_v2_0)
    assert len(issues) == 1
    assert issues[0].type == "maxItems"
    assert issues[0].field == "$.key_contacts"


def test_key_contacts_v2_0_nested_required(key_contacts_v2_0):
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [{"name": {}, "address": {}}],
    }
    EXPECTED_REQUIRED_FIELDS = [
        "$.key_contacts[0].project_role",
        "$.key_contacts[0].phone",
        "$.key_contacts[0].email",
        "$.key_contacts[0].name.first_name",
        "$.key_contacts[0].name.last_name",
        "$.key_contacts[0].address.street1",
        "$.key_contacts[0].address.city",
        "$.key_contacts[0].address.country",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, key_contacts_v2_0)


def test_key_contacts_v2_0_min_length(key_contacts_v2_0):
    data = {
        "applicant_organization_name": "",
        "key_contacts": [
            {
                "project_role": "",
                "name": {
                    "prefix": "",
                    "first_name": "",
                    "middle_name": "",
                    "last_name": "",
                    "suffix": "",
                },
                "title": "",
                "organizational_affiliation": "",
                "address": {
                    "street1": "",
                    "street2": "",
                    "city": "",
                    "county": "",
                    "province": "",
                    "zip_code": "",
                    "country": "CAN: CANADA",
                },
                "phone": "",
                "fax": "",
                "email": "example@example.com",
            }
        ],
    }
    EXPECTED_ERROR_FIELDS = [
        "$.applicant_organization_name",
        "$.key_contacts[0].project_role",
        "$.key_contacts[0].name.prefix",
        "$.key_contacts[0].name.first_name",
        "$.key_contacts[0].name.middle_name",
        "$.key_contacts[0].name.last_name",
        "$.key_contacts[0].name.suffix",
        "$.key_contacts[0].title",
        "$.key_contacts[0].organizational_affiliation",
        "$.key_contacts[0].address.street1",
        "$.key_contacts[0].address.street2",
        "$.key_contacts[0].address.city",
        "$.key_contacts[0].address.county",
        "$.key_contacts[0].address.province",
        "$.key_contacts[0].address.zip_code",
        "$.key_contacts[0].phone",
        "$.key_contacts[0].fax",
    ]
    validate_min_length(data, EXPECTED_ERROR_FIELDS, key_contacts_v2_0)


def test_key_contacts_v2_0_max_length(key_contacts_v2_0):
    data = {
        "applicant_organization_name": "A" * 61,
        "key_contacts": [
            {
                "project_role": "B" * 46,
                "name": {
                    "prefix": "C" * 11,
                    "first_name": "D" * 36,
                    "middle_name": "E" * 26,
                    "last_name": "F" * 61,
                    "suffix": "G" * 11,
                },
                "title": "H" * 46,
                "organizational_affiliation": "I" * 61,
                "address": {
                    "street1": "J" * 56,
                    "street2": "K" * 56,
                    "city": "L" * 36,
                    "county": "P" * 31,
                    "province": "Q" * 31,
                    "zip_code": "M" * 31,
                    "country": "CAN: CANADA",
                },
                "phone": "N" * 26,
                "fax": "O" * 26,
                "email": "@" * 61,
            }
        ],
    }
    EXPECTED_ERROR_FIELDS = [
        "$.applicant_organization_name",
        "$.key_contacts[0].project_role",
        "$.key_contacts[0].name.prefix",
        "$.key_contacts[0].name.first_name",
        "$.key_contacts[0].name.middle_name",
        "$.key_contacts[0].name.last_name",
        "$.key_contacts[0].name.suffix",
        "$.key_contacts[0].title",
        "$.key_contacts[0].organizational_affiliation",
        "$.key_contacts[0].address.street1",
        "$.key_contacts[0].address.street2",
        "$.key_contacts[0].address.city",
        "$.key_contacts[0].address.county",
        "$.key_contacts[0].address.province",
        "$.key_contacts[0].address.zip_code",
        "$.key_contacts[0].phone",
        "$.key_contacts[0].fax",
        "$.key_contacts[0].email",
    ]
    validate_max_length(data, EXPECTED_ERROR_FIELDS, key_contacts_v2_0)


def test_key_contacts_v2_0_invalid_email_format(contact_minimal, key_contacts_v2_0):
    contact_minimal["email"] = "not-an-email"
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [contact_minimal],
    }
    issues = validate_json_schema_for_form(data, key_contacts_v2_0)
    assert len(issues) == 1
    assert issues[0].type == "format"
    assert issues[0].field == "$.key_contacts[0].email"


def test_key_contacts_v2_0_us_address_requires_state_zip(contact_minimal, key_contacts_v2_0):
    contact_minimal["address"] = {
        "street1": "123 Main Street",
        "city": "Placeville",
        "country": "USA: UNITED STATES",
    }
    data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [contact_minimal],
    }
    EXPECTED_REQUIRED_FIELDS = [
        "$.key_contacts[0].address.state",
        "$.key_contacts[0].address.zip_code",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, key_contacts_v2_0)
