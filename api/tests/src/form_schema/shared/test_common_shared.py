from src.form_schema.jsonschema_validator import validate_json_schema
from src.form_schema.shared import COMMON_SHARED_V1
from tests.src.form_schema.shared.conftest import build_schema
import pytest

###################################
# Attachment
###################################

def test_shared_common_v1_attachment_happy():
    schema = build_schema(COMMON_SHARED_V1, "attachment")
    # Valid case
    assert len(validate_json_schema({"my_field": "cf0a51b7-ab0b-4c00-9d89-0b3b047b30f8"}, schema)) == 0

@pytest.mark.parametrize("value", ["", "not-a-uuid", 1, {}])
def test_shared_common_v1_attachment_invalid(value):
    schema = build_schema(COMMON_SHARED_V1, "attachment")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type in ("format", "type")
    assert validation_issues[0].field == "$.my_field"

###################################
# Person Name
###################################
# TODO

###################################
# Budget Monetary
###################################

@pytest.mark.parametrize("value", ["10", "123.45", "100000000.00", "0.00", "-1.01", "-100000000.00"])
def test_shared_common_v1_budget_monetary_amount(value):
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")
    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 0


@pytest.mark.parametrize("value", ["not-money", "1-0.00", "1-1", "1.1", "-1.2", "10000.000", "-1000.0000", "+12", "!@!@", "1e12", "3.", "4.x0"])
def test_shared_common_v1_budget_monetary_amount_invalid(value):
    schema = build_schema(COMMON_SHARED_V1, "budget_monetary_amount")

    validation_issues = validate_json_schema({"my_field": value}, schema)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "pattern"
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
# TODO