"""Source boundaries for the optional NSF authorization text."""

from datetime import date

import pytest

from src.form_schema.forms.nsf_deviation_authorization_generated import FORM
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"deviation_authorization": "x"},
        {"deviation_authorization": "x" * 4000},
        {"deviation_authorization": "Déviation & <scope>\n第二行"},
    ],
)
def test_valid_answers(data):
    assert validate_json_schema_for_form(data, FORM) == []


@pytest.mark.parametrize(
    "value,kind",
    [("", "minLength"), ("x" * 4001, "maxLength"), (None, "type"), (False, "type"), ([], "type")],
)
def test_invalid_answers(value, kind):
    issues = validate_json_schema_for_form({"deviation_authorization": value}, FORM)
    assert len(issues) == 1
    assert issues[0].type == kind
    assert issues[0].field == "$.deviation_authorization"


def test_identity():
    assert FORM.legacy_form_id == 306
    assert FORM.omb_number == "3145-0058"
    assert FORM.expiration_date == date(2026, 11, 30)
    assert FORM.form_renderer == "jsonforms"
