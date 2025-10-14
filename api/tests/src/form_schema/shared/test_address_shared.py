from src.form_schema.jsonschema_validator import validate_json_schema
from src.form_schema.shared import ADDRESS_SHARED_V1
import pytest

from tests.src.form_schema.shared.conftest import build_schema


###################################
# Address
###################################

@pytest.mark.parametrize("data", [
    {
        "street1": "456 Route 1",
        "city": "Pizzaville",
        "country": "CAN: CANADA",
        "province": "New Brunswick"
    },
    {
        "street1": "123 Main St",
        "city": "Exampleburg",
        "state": "NY: New York",
        "country": "USA: UNITED STATES",
        "zip_code": "12345",
    },
    {
        "street1": "789 Broken Dreams Blvd",
        "street2": "Room #101",
        "city": "Placetown",
        "state": "MI: Michigan",
        "country": "USA: UNITED STATES",
        "zip_code": "56789",
        "county": "Placeville County",
    }
])
def test_shared_address_v1_address_happy(data):
    schema = build_schema(ADDRESS_SHARED_V1, "address")
    validation_issues = validate_json_schema({"my_field": data}, schema)
    assert len(validation_issues) == 0

@pytest.mark.parametrize("data,required_fields", [
    ({}, ["$.my_field.street1", "$.my_field.city", "$.my_field.country"]),
    ({
         "street1": "123 Main St",
         "city": "Exampleburg",
         "country": "USA: UNITED STATES",
     }, ["$.my_field.state", "$.my_field.zip_code"]),
])
def test_shared_address_v1_address_with_required_issues(data, required_fields):
    schema = build_schema(ADDRESS_SHARED_V1, "address")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == len(required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in required_fields

def test_shared_address_v1_address_min_length():
    data = {
        "street1": "",
        "street2": "",
        "city": "",
        "state": "",
        "country": "",
        "zip_code": "",
        "county": "",
        "province": "",
    }
    schema = build_schema(ADDRESS_SHARED_V1, "address")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 8
    for validation_issue in validation_issues:
        if validation_issue.field in ("$.my_field.country", "$.my_field.state"):
            assert validation_issue.type == "enum"
        else:
            assert validation_issue.type == "minLength"

def test_shared_address_v1_address_max_length():
    data = {
        "street1": "A" * 56,
        "street2": "B" * 56,
        "city": "C" * 36,
        "state": "D" * 10,
        "country": "E" * 10,
        "zip_code": "F" * 31,
        "county": "G" * 31,
        "province": "H" * 31,
    }
    schema = build_schema(ADDRESS_SHARED_V1, "address")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 8
    for validation_issue in validation_issues:
        if validation_issue.field in ("$.my_field.country", "$.my_field.state"):
            assert validation_issue.type == "enum"
        else:
            assert validation_issue.type == "maxLength"

###################################
# Simple Address
###################################


@pytest.mark.parametrize("data", [
    {
        "street1": "456 Route 1",
        "city": "Pizzaville"
    },
    {
        "street1": "123 Main St",
        "city": "Exampleburg",
        "state": "NY: New York",
        "zip_code": "12345",
    },
    {
        "street1": "789 Broken Dreams Blvd",
        "street2": "Room #101",
        "city": "Placetown",
        "state": "MI: Michigan",
        "zip_code": "56789",
    }
])
def test_shared_address_v1_simple_address_happy(data):
    schema = build_schema(ADDRESS_SHARED_V1, "simple_address")
    validation_issues = validate_json_schema({"my_field": data}, schema)
    assert len(validation_issues) == 0

def test_shared_address_v1_simple_address_with_required_issues():
    required_fields = ["$.my_field.street1", "$.my_field.city"]
    schema = build_schema(ADDRESS_SHARED_V1, "simple_address")
    validation_issues = validate_json_schema({"my_field": {}}, schema)

    assert len(validation_issues) == 2
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in required_fields

def test_shared_address_v1_simple_address_min_length():
    data = {
        "street1": "",
        "street2": "",
        "city": "",
        "state": "",
        "zip_code": "",
    }
    schema = build_schema(ADDRESS_SHARED_V1, "simple_address")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 5
    for validation_issue in validation_issues:
        if validation_issue.field == "$.my_field.state":
            assert validation_issue.type == "enum"
        else:
            assert validation_issue.type == "minLength"

def test_shared_address_v1_simple_address_max_length():
    data = {
        "street1": "A" * 56,
        "street2": "B" * 56,
        "city": "C" * 36,
        "state": "D" * 10,
        "zip_code": "E" * 31,
    }
    schema = build_schema(ADDRESS_SHARED_V1, "simple_address")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 5
    for validation_issue in validation_issues:
        if validation_issue.field == "$.my_field.state":
            assert validation_issue.type == "enum"
        else:
            assert validation_issue.type == "maxLength"