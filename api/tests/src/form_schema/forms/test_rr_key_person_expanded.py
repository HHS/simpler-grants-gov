"""Tests for the R&R Senior/Key Person Profile (Expanded) form generated from forms/specs.

There is no hand-written form to compare it with, so these check its JSON Schema directly.
"""

import copy

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)
from tests.src.form_schema.forms.senior_key_person_profiles import (
    BANK_MAX_LENGTHS,
    NON_US_ADDRESS,
    PEOPLE,
    field_paths,
    ui_rules,
    with_person,
    with_values,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_PROFILE = {
    "name": {"prefix": "Dr.", "first_name": "Maria", "last_name": "Chen"},
    "title": "Professor of Biology",
    "organization_name": "University of Wisconsin-Madison",
    "department": "Department of Biology",
    "address": {
        "street1": "1200 University Avenue",
        "city": "Madison",
        "state": "WI: Wisconsin",
        "zip_code": "53706-1380",
        "country": "USA: UNITED STATES",
    },
    "phone": "6085550100",
    "email": "maria.chen@example.edu",
    "project_role": "PD/PI",
    "credential": "mchen",
    "degree_type": "PhD",
    "degree_year": "2004",
    "biographical_sketch": "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    "current_pending_support": "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
}

_INTERNATIONAL_PROFILE = {
    "name": {"first_name": "Tom", "last_name": "Okafor"},
    "address": {
        "street1": "25 King's Parade",
        "city": "Cambridge",
        "province": "Cambridgeshire",
        "zip_code": "CB2 1ST",
        "country": "GBR: UNITED KINGDOM",
    },
    "phone": "+44 1223 555 0100",
    "email": "tom.okafor@example.ac.uk",
    "project_role": "Other Professional",
    "other_project_role_category": "Engineer",
    "biographical_sketch": "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
}


# Only the answers a profile requires.
_MINIMAL_PROFILE = {
    "name": {"first_name": "Ana", "last_name": "Ruiz"},
    "address": {
        "street1": "1 Main Street",
        "city": "Madison",
        "state": "WI: Wisconsin",
        "zip_code": "53706",
        "country": "USA: UNITED STATES",
    },
    "phone": "6085550101",
    "email": "ana.ruiz@example.edu",
    "project_role": "Faculty",
    "biographical_sketch": "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
}

# The bank's limits, and this form's own fields.
_MAX_LENGTHS = {
    **BANK_MAX_LENGTHS,
    "organization_name": 60,
    "credential": 60,
    "other_project_role_category": 40,
    "degree_type": 75,
    "degree_year": 25,
}


def _full_form() -> dict:
    return {
        "principal_investigator": copy.deepcopy(_PROFILE),
        "senior_key_persons": [copy.deepcopy(_INTERNATIONAL_PROFILE)],
        "additional_profiles": "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
        "additional_biographical_sketches": "d6f8a0b2-3e5a-4b7c-9d1e-5a7c9e1b3f55",
        "additional_current_pending_support": "e7a9b1c3-4f6b-4c8d-ae2f-6b8d0f2c4a66",
    }


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(rr_key_person_expanded_generated_v4_0):
    validate_required(_full_form(), [], rr_key_person_expanded_generated_v4_0)


def test_principal_investigator_alone_is_valid(rr_key_person_expanded_generated_v4_0):
    data = {"principal_investigator": copy.deepcopy(_PROFILE)}
    validate_required(data, [], rr_key_person_expanded_generated_v4_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_without_optional_answers_is_valid(person, rr_key_person_expanded_generated_v4_0):
    data = with_person(_full_form(), person, _MINIMAL_PROFILE)
    validate_required(data, [], rr_key_person_expanded_generated_v4_0)


def test_senior_key_persons_may_be_empty(rr_key_person_expanded_generated_v4_0):
    data = {**_full_form(), "senior_key_persons": []}
    validate_required(data, [], rr_key_person_expanded_generated_v4_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_principal_investigator(rr_key_person_expanded_generated_v4_0):
    validate_required({}, ["$.principal_investigator"], rr_key_person_expanded_generated_v4_0)


_PROFILE_REQUIRED = ["name", "address", "phone", "email", "project_role"]


def test_empty_profile_requires_its_fields(rr_key_person_expanded_generated_v4_0):
    data = {"principal_investigator": {}}
    # The XSD makes every sketch optional; the form requires the PD/PI's, as the DAT does.
    expected = [
        f"$.principal_investigator.{field}" for field in [*_PROFILE_REQUIRED, "biographical_sketch"]
    ]
    validate_required(data, expected, rr_key_person_expanded_generated_v4_0)


def test_senior_key_person_requires_their_fields(rr_key_person_expanded_generated_v4_0):
    data = _full_form()
    data["senior_key_persons"] = [{}]
    expected = [f"$.senior_key_persons[0].{field}" for field in _PROFILE_REQUIRED]
    validate_required(data, expected, rr_key_person_expanded_generated_v4_0)


def test_senior_key_person_needs_no_biographical_sketch(rr_key_person_expanded_generated_v4_0):
    profile = copy.deepcopy(_MINIMAL_PROFILE)
    del profile["biographical_sketch"]
    data = with_person(_full_form(), "senior_key_persons[0]", profile)
    validate_required(data, [], rr_key_person_expanded_generated_v4_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_name_and_address_require_their_parts(person, rr_key_person_expanded_generated_v4_0):
    profile = with_values(_MINIMAL_PROFILE, {"name": {}, "address": {}})
    expected = field_paths(
        person,
        ["name.first_name", "name.last_name", "address.street1", "address.city", "address.country"],
    )
    data = with_person(_full_form(), person, profile)
    validate_required(data, expected, rr_key_person_expanded_generated_v4_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_us_address_requires_state_and_zip_code(person, rr_key_person_expanded_generated_v4_0):
    address = {"street1": "1 Main Street", "city": "Madison", "country": "USA: UNITED STATES"}
    profile = with_values(_MINIMAL_PROFILE, {"address": address})
    expected = field_paths(person, ["address.state", "address.zip_code"])
    data = with_person(_full_form(), person, profile)
    validate_required(data, expected, rr_key_person_expanded_generated_v4_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_non_us_address_needs_no_state_or_zip_code(person, rr_key_person_expanded_generated_v4_0):
    profile = with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS})
    data = with_person(_full_form(), person, profile)
    validate_required(data, [], rr_key_person_expanded_generated_v4_0)


# ---------------------------------------------------------------------------
# Repeating field tests
# ---------------------------------------------------------------------------


def test_too_many_senior_key_persons_rejected(rr_key_person_expanded_generated_v4_0):
    data = {**_full_form(), "senior_key_persons": [copy.deepcopy(_MINIMAL_PROFILE)] * 100}
    assert _issues(data, rr_key_person_expanded_generated_v4_0) == [
        ("maxItems", "$.senior_key_persons")
    ]


# ---------------------------------------------------------------------------
# Length and format tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_fields_reject_empty_answers(person, rr_key_person_expanded_generated_v4_0):
    fields = [field for field in _MAX_LENGTHS if field != "email"]
    profile = with_values(
        with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS}),
        {field: "" for field in fields},
    )
    data = with_person(_full_form(), person, profile)
    validate_min_length(data, field_paths(person, fields), rr_key_person_expanded_generated_v4_0)


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_fields_reject_answers_past_max_length(
    person, rr_key_person_expanded_generated_v4_0
):
    profile = with_values(
        with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS}),
        {field: "@" * (length + 1) for field, length in _MAX_LENGTHS.items()},
    )
    data = with_person(_full_form(), person, profile)
    validate_max_length(
        data, field_paths(person, _MAX_LENGTHS), rr_key_person_expanded_generated_v4_0
    )


@pytest.mark.parametrize("person", PEOPLE)
def test_email_must_be_email_address(person, rr_key_person_expanded_generated_v4_0):
    profile = with_values(_MINIMAL_PROFILE, {"email": "not-an-email"})
    data = with_person(_full_form(), person, profile)
    assert _issues(data, rr_key_person_expanded_generated_v4_0) == [("format", f"$.{person}.email")]


@pytest.mark.parametrize("person", PEOPLE)
def test_project_role_must_be_listed_role(person, rr_key_person_expanded_generated_v4_0):
    # A role from NSF (Expanded), which this form's XSD doesn't list.
    profile = with_values(_MINIMAL_PROFILE, {"project_role": "Other Senior Personnel"})
    data = with_person(_full_form(), person, profile)
    assert _issues(data, rr_key_person_expanded_generated_v4_0) == [
        ("enum", f"$.{person}.project_role")
    ]


@pytest.mark.parametrize("person", PEOPLE)
def test_documents_must_be_upload_ids(person, rr_key_person_expanded_generated_v4_0):
    documents = {"biographical_sketch": "sketch.pdf", "current_pending_support": "support.pdf"}
    data = with_person(_full_form(), person, with_values(_MINIMAL_PROFILE, documents))
    expected = [("format", path) for path in field_paths(person, documents)]
    assert sorted(_issues(data, rr_key_person_expanded_generated_v4_0)) == expected


# ---------------------------------------------------------------------------
# Conditional field tests
# ---------------------------------------------------------------------------


def test_other_role_category_enabled_only_for_other_roles(rr_key_person_expanded_generated_v4_0):
    rules = ui_rules(rr_key_person_expanded_generated_v4_0, "other_project_role_category")
    assert len(rules) == len(PEOPLE)
    for rule in rules:
        assert rule["effect"] == "ENABLE"
        assert rule["condition"]["scope"].endswith("/properties/project_role")
        assert rule["condition"]["schema"] == {"enum": ["Other Professional", "Other (Specify)"]}


def test_province_shown_only_outside_us(rr_key_person_expanded_generated_v4_0):
    rules = ui_rules(rr_key_person_expanded_generated_v4_0, "province")
    assert len(rules) == len(PEOPLE)
    for rule in rules:
        assert rule["effect"] == "SHOW"
        assert rule["condition"]["scope"].endswith("/properties/address/properties/country")
        assert {"not": {"const": "USA: UNITED STATES"}} in rule["condition"]["schema"]["allOf"]
