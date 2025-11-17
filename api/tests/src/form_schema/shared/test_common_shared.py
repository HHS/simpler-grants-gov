import pytest

from src.form_schema.jsonschema_validator import validate_json_schema
from src.form_schema.shared import COMMON_SHARED_V1
from tests.src.form_schema.shared.conftest import build_schema

###################################
# Attachment
###################################


def test_shared_common_v1_attachment_happy():
    schema = build_schema(COMMON_SHARED_V1, "attachment")
    # Valid case
    assert (
        len(validate_json_schema({"my_field": "cf0a51b7-ab0b-4c00-9d89-0b3b047b30f8"}, schema)) == 0
    )


@pytest.mark.parametrize("value", ["", "not-a-uuid", "12345678-1234-1234-12345678", "-123"])
def test_shared_common_v1_attachment_invalid_format(value):
    schema = build_schema(COMMON_SHARED_V1, "attachment")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].field == "$.my_field"


###################################
# Person Name
###################################


@pytest.mark.parametrize(
    "data",
    [
        {
            "first_name": "Bob",
            "last_name": "Smith",
        },
        {
            "prefix": "Ms.",
            "first_name": "Sally",
            "middle_name": "Sue",
            "last_name": "Sanders",
            "suffix": "Esq.",
        },
    ],
)
def test_shared_common_v1_person_name_happy(data):
    schema = build_schema(COMMON_SHARED_V1, "person_name")
    validation_issues = validate_json_schema({"my_field": data}, schema)
    assert len(validation_issues) == 0


@pytest.mark.parametrize(
    "data,required_fields",
    [
        ({}, ["$.my_field.first_name", "$.my_field.last_name"]),
        (
            {"prefix": "Ms.", "middle_name": "Sue", "suffix": "Esq."},
            ["$.my_field.first_name", "$.my_field.last_name"],
        ),
    ],
)
def test_shared_common_v1_person_name_with_required_issues(data, required_fields):
    schema = build_schema(COMMON_SHARED_V1, "person_name")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == len(required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in required_fields


def test_shared_address_v1_address_min_length():
    data = {"prefix": "", "first_name": "", "middle_name": "", "last_name": "", "suffix": ""}
    schema = build_schema(COMMON_SHARED_V1, "person_name")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 5
    for validation_issue in validation_issues:
        assert validation_issue.type == "minLength"


def test_shared_address_v1_address_max_length():
    data = {
        "prefix": "A" * 11,
        "first_name": "B" * 36,
        "middle_name": "C" * 26,
        "last_name": "D" * 61,
        "suffix": "E" * 11,
    }
    schema = build_schema(COMMON_SHARED_V1, "person_name")
    validation_issues = validate_json_schema({"my_field": data}, schema)

    assert len(validation_issues) == 5
    for validation_issue in validation_issues:
        assert validation_issue.type == "maxLength"


###################################
# Budget Monetary
###################################


@pytest.mark.parametrize(
    "value", ["10", "123.45", "100000000.00", "0.00", "-1.01", "-100000000.00"]
)
def test_shared_common_v1_budget_monetary_amount(value):
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


@pytest.mark.parametrize(
    "value",
    [
        "not-money",
        "1-0.00",
        "1-1",
        "1.1",
        "-1.2",
        "10000.000",
        "-1000.0000",
        "+12",
        "!@!@",
        "1e12",
        "3.",
        "4.x0",
    ],
)
def test_shared_common_v1_budget_monetary_amount_invalid(value):
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "pattern"
    assert validation_issues[0].field == "$.my_field"


def test_shared_common_v1_budget_monetary_amount_min_length():
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")

    validation_issues = validate_json_schema({"my_field": ""}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"
    assert validation_issues[0].field == "$.my_field"


@pytest.mark.parametrize("value", ["100000000000000", "-123456789000.00"])
def test_shared_common_v1_budget_monetary_amount_max_length(value):
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"
    assert validation_issues[0].field == "$.my_field"


###################################
# Phone Number
###################################


@pytest.mark.parametrize(
    "value", ["123-456-7890", "1234567890", "+12345678900", "technically valid"]
)
def test_shared_common_v1_phone_number(value):
    schema = build_schema(COMMON_SHARED_V1, "phone_number")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


def test_shared_common_v1_phone_number_min_length():
    schema = build_schema(COMMON_SHARED_V1, "phone_number")

    validation_issues = validate_json_schema({"my_field": ""}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"
    assert validation_issues[0].field == "$.my_field"


def test_shared_common_v1_phone_number_max_length():
    schema = build_schema(COMMON_SHARED_V1, "phone_number")

    validation_issues = validate_json_schema({"my_field": "1" * 26}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"
    assert validation_issues[0].field == "$.my_field"


###################################
# Contact Person Title
###################################
@pytest.mark.parametrize(
    "value", ["Doctor", "Director", "3rd Best Employee", "Her Royal Highness, First of Her Name"]
)
def test_shared_common_v1_contact_person_title(value):
    schema = build_schema(COMMON_SHARED_V1, "contact_person_title")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


def test_shared_common_v1_contact_person_title_min_length():
    schema = build_schema(COMMON_SHARED_V1, "contact_person_title")

    validation_issues = validate_json_schema({"my_field": ""}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"
    assert validation_issues[0].field == "$.my_field"


def test_shared_common_v1_contact_person_title_max_length():
    schema = build_schema(COMMON_SHARED_V1, "phone_number")

    validation_issues = validate_json_schema({"my_field": "A" * 46}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"
    assert validation_issues[0].field == "$.my_field"


###################################
# Signature
###################################
@pytest.mark.parametrize("value", ["Fred Jones", "Norville 'Shaggy' Rogers", "Scooby"])
def test_shared_common_v1_signature(value):
    schema = build_schema(COMMON_SHARED_V1, "signature")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


def test_shared_common_v1_signature_min_length():
    schema = build_schema(COMMON_SHARED_V1, "signature")

    validation_issues = validate_json_schema({"my_field": ""}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"
    assert validation_issues[0].field == "$.my_field"


def test_shared_common_v1_signature_max_length():
    schema = build_schema(COMMON_SHARED_V1, "signature")

    validation_issues = validate_json_schema({"my_field": "A" * 145}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"
    assert validation_issues[0].field == "$.my_field"


###################################
# Submitted Date
###################################
@pytest.mark.parametrize("value", ["2025-01-01", "1970-05-13", "2167-12-31"])
def test_shared_common_v1_submitted_date(value):
    schema = build_schema(COMMON_SHARED_V1, "submitted_date")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


@pytest.mark.parametrize("value", ["not-a-date", "-1234-56-78", "2025-01-01T12:00:00", "123-45-67"])
def test_shared_common_v1_submitted_date_invalid_format(value):
    schema = build_schema(COMMON_SHARED_V1, "submitted_date")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].field == "$.my_field"


###################################
# Organization Name
###################################
@pytest.mark.parametrize("value", ["Research Inc", "Science Place", "Social Studies LLC"])
def test_shared_common_v1_organization_name(value):
    schema = build_schema(COMMON_SHARED_V1, "organization_name")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


def test_shared_common_v1_organization_name_min_length():
    schema = build_schema(COMMON_SHARED_V1, "organization_name")

    validation_issues = validate_json_schema({"my_field": ""}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"
    assert validation_issues[0].field == "$.my_field"


def test_shared_common_v1_organization_name_max_length():
    schema = build_schema(COMMON_SHARED_V1, "organization_name")

    validation_issues = validate_json_schema({"my_field": "A" * 61}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"
    assert validation_issues[0].field == "$.my_field"
