"""Tests for the NASA - PI and AOR Supplemental Data Sheet generated from forms/specs.

There is no hand-written form to compare it with, so these check its JSON Schema directly.
"""

import copy

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_max_length, validate_required

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

PEOPLE = ("authorized_representative", "principal_investigator")

_FULL_FORM = {
    "authorized_representative": {
        "name": {
            "prefix": "Ms.",
            "first_name": "Alicia",
            "middle_name": "M",
            "last_name": "Reyes",
            "suffix": "Jr.",
        },
        "nspires_username": "areyes",
    },
    "principal_investigator": {
        "name": {"prefix": "Dr.", "first_name": "Maria", "last_name": "Chen"},
        "us_government_participation": True,
        "federal_agency": "141: National Oceanic and Atmospheric Administration (NOAA)",
        "federal_agency_dollar": "125000.00",
        "international_participation": False,
    },
}

# Only the answers the form requires.
_MINIMAL_FORM = {
    "authorized_representative": {"name": {"first_name": "Alicia", "last_name": "Reyes"}},
    "principal_investigator": {
        "name": {"first_name": "Maria", "last_name": "Chen"},
        "us_government_participation": False,
        "international_participation": False,
    },
}


def _full_form() -> dict:
    return copy.deepcopy(_FULL_FORM)


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(nasa_pi_and_aor_generated_v1_0):
    validate_required(_full_form(), [], nasa_pi_and_aor_generated_v1_0)


def test_form_without_optional_answers_is_valid(nasa_pi_and_aor_generated_v1_0):
    validate_required(copy.deepcopy(_MINIMAL_FORM), [], nasa_pi_and_aor_generated_v1_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_both_people(nasa_pi_and_aor_generated_v1_0):
    expected = [f"$.{person}" for person in PEOPLE]
    validate_required({}, expected, nasa_pi_and_aor_generated_v1_0)


def test_authorized_representative_requires_name(nasa_pi_and_aor_generated_v1_0):
    data = {**_full_form(), "authorized_representative": {}}
    validate_required(data, ["$.authorized_representative.name"], nasa_pi_and_aor_generated_v1_0)


def test_principal_investigator_requires_name_and_participation(
    nasa_pi_and_aor_generated_v1_0,
):
    data = {**_full_form(), "principal_investigator": {}}
    expected = [
        "$.principal_investigator.name",
        "$.principal_investigator.us_government_participation",
        "$.principal_investigator.international_participation",
    ]
    validate_required(data, expected, nasa_pi_and_aor_generated_v1_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_name_requires_first_and_last(person, nasa_pi_and_aor_generated_v1_0):
    data = _full_form()
    data[person]["name"] = {}
    expected = [f"$.{person}.name.first_name", f"$.{person}.name.last_name"]
    validate_required(data, expected, nasa_pi_and_aor_generated_v1_0)


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


def test_nspires_username_rejects_answer_past_max_length(nasa_pi_and_aor_generated_v1_0):
    data = _full_form()
    data["authorized_representative"]["nspires_username"] = "a" * 100
    validate_max_length(
        data, ["$.authorized_representative.nspires_username"], nasa_pi_and_aor_generated_v1_0
    )


def test_federal_agency_must_be_listed_agency(nasa_pi_and_aor_generated_v1_0):
    data = _full_form()
    data["principal_investigator"]["federal_agency"] = "NOAA"
    assert _issues(data, nasa_pi_and_aor_generated_v1_0) == [
        ("enum", "$.principal_investigator.federal_agency")
    ]


@pytest.mark.parametrize("amount", ["125,000", "125000.5", "1234567890123"])
def test_dollar_amount_must_be_budget_amount(amount, nasa_pi_and_aor_generated_v1_0):
    data = _full_form()
    data["principal_investigator"]["federal_agency_dollar"] = amount
    assert _issues(data, nasa_pi_and_aor_generated_v1_0) == [
        ("pattern", "$.principal_investigator.federal_agency_dollar")
    ]


@pytest.mark.parametrize("field", ["us_government_participation", "international_participation"])
def test_participation_must_be_yes_or_no(field, nasa_pi_and_aor_generated_v1_0):
    data = _full_form()
    data["principal_investigator"][field] = "Yes"
    assert _issues(data, nasa_pi_and_aor_generated_v1_0) == [
        ("type", f"$.principal_investigator.{field}")
    ]
