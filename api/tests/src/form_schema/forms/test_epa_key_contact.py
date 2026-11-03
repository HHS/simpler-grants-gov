import pytest

from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)


@pytest.fixture
def key_contact_full1() -> dict:
    return {
        "name": {
            "prefix": "Doctor",
            "first_name": "Sue",
            "middle_name": "Sally",
            "last_name": "Storm",
            "suffix": "Esquire",
        },
        "title": "Director",
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
def key_contact_full2() -> dict:
    return {
        "name": {
            "prefix": "Mr",
            "first_name": "Bob",
            "middle_name": "Baker",
            "last_name": "Barker",
            "suffix": "IV",
        },
        "title": "TV Show Host",
        "address": {
            "street1": "456 Dream Blvd",
            "street2": "Room #4",
            "city": "Somewhereburg",
            "state": "CA: California",
            "zip_code": "98765",
            "country": "USA: UNITED STATES",
        },
        "phone": "555-555-5555",
        "fax": "555-555-5555",
        "email": "person@fake.com",
    }


@pytest.fixture
def key_contact_partial1() -> dict:
    return {
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
    }


@pytest.fixture
def key_contact_partial2() -> dict:
    return {
        "name": {
            "first_name": "Fred",
            "middle_name": "Eugene",
            "last_name": "Jones",
            "suffix": "VII",
        },
        "title": "Doctor",
        "address": {
            "street1": "444 Senators Place",
            "city": "Ottawa",
            "zip_code": "12345-6789",
            "country": "CAN: CANADA",
        },
        "phone": "45678912340",
        "email": "person@place.com",
    }


@pytest.fixture
def full_valid_epa_key_contact_v2_0(
    key_contact_full1, key_contact_full2, key_contact_partial1, key_contact_partial2
) -> dict:
    return {
        "authorized_representative": key_contact_full1,
        "payee": key_contact_full2,
        "administrative_contact": key_contact_partial1,
        "project_manager": key_contact_partial2,
    }


def test_epa_key_contact_v2_0_full_valid(full_valid_epa_key_contact_v2_0, epa_key_contact_v2_0):
    validate_required(full_valid_epa_key_contact_v2_0, [], epa_key_contact_v2_0)


def test_epa_key_contact_v2_0_empty(epa_key_contact_v2_0):
    # No fields are required for this, empty is perfectly fine
    validate_required({}, [], epa_key_contact_v2_0)


def test_epa_key_contact_v2_0_nested(epa_key_contact_v2_0):
    data = {
        # Completely empty
        "authorized_representative": {},
        # Nested fields are empty
        "payee": {"name": {}, "address": {}},
    }
    EXPECTED_REQUIRED_FIELDS = [
        "$.authorized_representative.name",
        "$.authorized_representative.address",
        "$.authorized_representative.phone",
        "$.payee.name.first_name",
        "$.payee.name.last_name",
        "$.payee.address.street1",
        "$.payee.address.city",
        "$.payee.address.country",
        "$.payee.phone",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, epa_key_contact_v2_0)


def test_epa_key_contact_v2_0_min_length(epa_key_contact_v2_0):
    data = {
        "payee": {
            "name": {
                "prefix": "",
                "first_name": "",
                "middle_name": "",
                "last_name": "",
                "suffix": "",
            },
            "title": "",
            "address": {
                "street1": "",
                "street2": "",
                "city": "",
                # zip_code excluded: non-US zip has minLength=0
                "country": "CAN: CANADA",
            },
            "phone": "",
            "fax": "",
            "email": "example@example.com",
        }
    }

    EXPECTED_ERROR_FIELDS = [
        "$.payee.name.prefix",
        "$.payee.name.first_name",
        "$.payee.name.middle_name",
        "$.payee.name.last_name",
        "$.payee.name.suffix",
        "$.payee.title",
        "$.payee.address.street1",
        "$.payee.address.street2",
        "$.payee.address.city",
        "$.payee.phone",
        "$.payee.fax",
    ]
    validate_min_length(data, EXPECTED_ERROR_FIELDS, epa_key_contact_v2_0)


def test_epa_key_contact_v2_0_us_zip_required(epa_key_contact_v2_0):
    """US address requires zip_code."""
    data = {
        "payee": {
            "name": {"first_name": "Bob", "last_name": "Smith"},
            "address": {
                "street1": "123 Main St",
                "city": "Springfield",
                "state": "IL: Illinois",
                "country": "USA: UNITED STATES",
            },
            "phone": "555-555-5555",
        }
    }
    from src.form_schema.jsonschema_validator import validate_json_schema_for_form

    issues = validate_json_schema_for_form(data, epa_key_contact_v2_0)
    assert len(issues) == 1
    assert issues[0].type == "required"
    assert issues[0].field == "$.payee.address.zip_code"


def test_epa_key_contact_v2_0_us_zip_any_length_valid(epa_key_contact_v2_0):
    """US zip_code has no minimum length beyond being present."""
    from src.form_schema.jsonschema_validator import validate_json_schema_for_form

    data = {
        "payee": {
            "name": {"first_name": "Bob", "last_name": "Smith"},
            "address": {
                "street1": "123 Main St",
                "city": "Springfield",
                "state": "IL: Illinois",
                "country": "USA: UNITED STATES",
                "zip_code": "12345",  # 5 chars — valid, no minimum length requirement
            },
            "phone": "555-555-5555",
        }
    }
    assert validate_json_schema_for_form(data, epa_key_contact_v2_0) == []


def test_epa_key_contact_v2_0_non_us_zip_optional(epa_key_contact_v2_0):
    """Non-US zip_code is optional and has no minimum length."""
    from src.form_schema.jsonschema_validator import validate_json_schema_for_form

    data = {
        "payee": {
            "name": {"first_name": "Bob", "last_name": "Smith"},
            "address": {
                "street1": "456 Rio",
                "city": "Montevideo",
                "country": "URY: URUGUAY",
                "zip_code": "",  # empty is fine for non-US
            },
            "phone": "555-555-5555",
        }
    }
    assert validate_json_schema_for_form(data, epa_key_contact_v2_0) == []


def test_epa_key_contact_v2_0_max_length(epa_key_contact_v2_0):
    data = {
        "payee": {
            "name": {
                "prefix": "A" * 11,
                "first_name": "B" * 36,
                "middle_name": "C" * 26,
                "last_name": "D" * 61,
                "suffix": "E" * 11,
            },
            "title": "F" * 46,
            "address": {
                "street1": "G" * 56,
                "street2": "H" * 56,
                "city": "I" * 36,
                "zip_code": "J" * 31,
                "country": "CAN: CANADA",
            },
            "phone": "K" * 26,
            "fax": "L" * 26,
            "email": "@" * 61,
        }
    }

    EXPECTED_ERROR_FIELDS = [
        "$.payee.name.prefix",
        "$.payee.name.first_name",
        "$.payee.name.middle_name",
        "$.payee.name.last_name",
        "$.payee.name.suffix",
        "$.payee.title",
        "$.payee.address.street1",
        "$.payee.address.street2",
        "$.payee.address.city",
        "$.payee.address.zip_code",
        "$.payee.phone",
        "$.payee.fax",
        "$.payee.email",
    ]
    validate_max_length(data, EXPECTED_ERROR_FIELDS, epa_key_contact_v2_0)
