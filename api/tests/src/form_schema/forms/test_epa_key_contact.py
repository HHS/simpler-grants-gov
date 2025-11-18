import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
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
                "city": "",
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        }

@pytest.fixture
def key_contact_partial1() -> dict:
    return {
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        }

@pytest.fixture
def key_contact_partial2() -> dict:
    return {
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        }

@pytest.fixture
def full_valid_epa_key_contact_v2_0() -> dict:
    return {
        "authorized_representative": {
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        },
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        },
        "administrative_contact": {
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        },
        "project_manager": {
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
                "state": "",
                "zip_code": "",
                "country": "",
            },
            "phone": "",
            "fax": "",
            "email": "",
        },
    }

def test_epa_key_contact_v2_0_empty(epa_key_contact_v2_0):
    # No fields are required for this, empty is perfectly fine
    validate_required({}, [], epa_key_contact_v2_0)


# TODO
# Full valid
# Empty nested
# empty two layer nested
# Min length
# Max length
