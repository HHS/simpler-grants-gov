"""Tests for the NSF Senior/Key Person Profile (Expanded) form generated from forms/specs.

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

# Every NSF profile attaches all four documents.
_DOCUMENTS = {
    "biographical_sketch": "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    "current_pending_support": "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
    "collaborators": "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
    "synergistic_activities": "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
}

_PRINCIPAL_INVESTIGATOR = {
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
    "nsf_id": "000123456",
    **_DOCUMENTS,
}

_SENIOR_KEY_PERSON = {
    "name": {"first_name": "Tom", "last_name": "Okafor"},
    "organization_uei": "ABCDEFGH1234",
    "address": {
        "street1": "25 King's Parade",
        "city": "Cambridge",
        "province": "Cambridgeshire",
        "zip_code": "CB2 1ST",
        "country": "GBR: UNITED KINGDOM",
    },
    "phone": "+44 1223 555 0100",
    "email": "tom.okafor@example.ac.uk",
    "project_role": "Other Senior Personnel",
    **_DOCUMENTS,
}

# Only the answers a profile requires. The PD/PI's and a senior/key person's are the same.
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
    "project_role": "Co-PD/PI",
    **_DOCUMENTS,
}

# The bank's limits, and each person's own field: the PD/PI names the organization, and a
# senior/key person gives its UEI.
_MAX_LENGTHS = {
    "principal_investigator": {**BANK_MAX_LENGTHS, "organization_name": 60},
    "senior_key_persons[0]": {**BANK_MAX_LENGTHS, "organization_uei": 12},
}


def _full_form() -> dict:
    return {
        "principal_investigator": copy.deepcopy(_PRINCIPAL_INVESTIGATOR),
        "senior_key_persons": [copy.deepcopy(_SENIOR_KEY_PERSON)],
        "additional_profiles": "d6f8a0b2-3e5a-4b7c-9d1e-5a7c9e1b3f55",
    }


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


_PROFILE_REQUIRED = [
    "name",
    "address",
    "phone",
    "email",
    "project_role",
    *_DOCUMENTS,
]

# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(nsf_key_person_expanded_generated_v3_3):
    validate_required(_full_form(), [], nsf_key_person_expanded_generated_v3_3)


def test_principal_investigator_alone_is_valid(nsf_key_person_expanded_generated_v3_3):
    data = {"principal_investigator": copy.deepcopy(_PRINCIPAL_INVESTIGATOR)}
    validate_required(data, [], nsf_key_person_expanded_generated_v3_3)


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_without_optional_answers_is_valid(person, nsf_key_person_expanded_generated_v3_3):
    data = with_person(_full_form(), person, _MINIMAL_PROFILE)
    validate_required(data, [], nsf_key_person_expanded_generated_v3_3)


def test_senior_key_persons_may_be_empty(nsf_key_person_expanded_generated_v3_3):
    data = {**_full_form(), "senior_key_persons": []}
    validate_required(data, [], nsf_key_person_expanded_generated_v3_3)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_principal_investigator(nsf_key_person_expanded_generated_v3_3):
    validate_required({}, ["$.principal_investigator"], nsf_key_person_expanded_generated_v3_3)


def test_empty_profile_requires_its_fields_and_all_four_documents(
    nsf_key_person_expanded_generated_v3_3,
):
    data = {"principal_investigator": {}}
    expected = [f"$.principal_investigator.{field}" for field in _PROFILE_REQUIRED]
    validate_required(data, expected, nsf_key_person_expanded_generated_v3_3)


def test_senior_key_person_requires_their_fields(nsf_key_person_expanded_generated_v3_3):
    data = _full_form()
    data["senior_key_persons"] = [{}]
    expected = [f"$.senior_key_persons[0].{field}" for field in _PROFILE_REQUIRED]
    validate_required(data, expected, nsf_key_person_expanded_generated_v3_3)


@pytest.mark.parametrize("person", PEOPLE)
def test_name_and_address_require_their_parts(person, nsf_key_person_expanded_generated_v3_3):
    profile = with_values(_MINIMAL_PROFILE, {"name": {}, "address": {}})
    expected = field_paths(
        person,
        ["name.first_name", "name.last_name", "address.street1", "address.city", "address.country"],
    )
    data = with_person(_full_form(), person, profile)
    validate_required(data, expected, nsf_key_person_expanded_generated_v3_3)


@pytest.mark.parametrize("person", PEOPLE)
def test_us_address_requires_state_and_zip_code(person, nsf_key_person_expanded_generated_v3_3):
    address = {"street1": "1 Main Street", "city": "Madison", "country": "USA: UNITED STATES"}
    profile = with_values(_MINIMAL_PROFILE, {"address": address})
    expected = field_paths(person, ["address.state", "address.zip_code"])
    data = with_person(_full_form(), person, profile)
    validate_required(data, expected, nsf_key_person_expanded_generated_v3_3)


@pytest.mark.parametrize("person", PEOPLE)
def test_non_us_address_needs_no_state_or_zip_code(person, nsf_key_person_expanded_generated_v3_3):
    profile = with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS})
    data = with_person(_full_form(), person, profile)
    validate_required(data, [], nsf_key_person_expanded_generated_v3_3)


# ---------------------------------------------------------------------------
# Repeating field tests
# ---------------------------------------------------------------------------


def test_too_many_senior_key_persons_rejected(nsf_key_person_expanded_generated_v3_3):
    data = {**_full_form(), "senior_key_persons": [copy.deepcopy(_MINIMAL_PROFILE)] * 100}
    assert _issues(data, nsf_key_person_expanded_generated_v3_3) == [
        ("maxItems", "$.senior_key_persons")
    ]


# ---------------------------------------------------------------------------
# Format and length tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_fields_reject_empty_answers(person, nsf_key_person_expanded_generated_v3_3):
    fields = [field for field in _MAX_LENGTHS[person] if field != "email"]
    profile = with_values(
        with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS}),
        {field: "" for field in fields},
    )
    data = with_person(_full_form(), person, profile)
    validate_min_length(data, field_paths(person, fields), nsf_key_person_expanded_generated_v3_3)


@pytest.mark.parametrize("person", PEOPLE)
def test_profile_fields_reject_answers_past_max_length(
    person, nsf_key_person_expanded_generated_v3_3
):
    max_lengths = _MAX_LENGTHS[person]
    profile = with_values(
        with_values(_MINIMAL_PROFILE, {"address": NON_US_ADDRESS}),
        {field: "@" * (length + 1) for field, length in max_lengths.items()},
    )
    data = with_person(_full_form(), person, profile)
    validate_max_length(
        data, field_paths(person, max_lengths), nsf_key_person_expanded_generated_v3_3
    )


@pytest.mark.parametrize("person", PEOPLE)
def test_email_must_be_email_address(person, nsf_key_person_expanded_generated_v3_3):
    profile = with_values(_MINIMAL_PROFILE, {"email": "not-an-email"})
    data = with_person(_full_form(), person, profile)
    assert _issues(data, nsf_key_person_expanded_generated_v3_3) == [
        ("format", f"$.{person}.email")
    ]


@pytest.mark.parametrize("person", PEOPLE)
def test_project_role_must_be_listed_role(person, nsf_key_person_expanded_generated_v3_3):
    # A role from the R&R forms, which this form's XSD doesn't list.
    profile = with_values(_MINIMAL_PROFILE, {"project_role": "Faculty"})
    data = with_person(_full_form(), person, profile)
    assert _issues(data, nsf_key_person_expanded_generated_v3_3) == [
        ("enum", f"$.{person}.project_role")
    ]


@pytest.mark.parametrize("person", PEOPLE)
def test_documents_must_be_upload_ids(person, nsf_key_person_expanded_generated_v3_3):
    documents = {field: f"{field}.pdf" for field in _DOCUMENTS}
    data = with_person(_full_form(), person, with_values(_MINIMAL_PROFILE, documents))
    expected = [("format", path) for path in field_paths(person, sorted(documents))]
    assert sorted(_issues(data, nsf_key_person_expanded_generated_v3_3)) == expected


# The second holds nine valid characters, so it passes only an unanchored pattern.
@pytest.mark.parametrize("nsf_id", ["abc", "X000123456789"])
@pytest.mark.parametrize("person", PEOPLE)
def test_nsf_id_must_be_nine_digits_or_capitals(
    person, nsf_id, nsf_key_person_expanded_generated_v3_3
):
    profile = with_values(_MINIMAL_PROFILE, {"nsf_id": nsf_id})
    data = with_person(_full_form(), person, profile)
    assert _issues(data, nsf_key_person_expanded_generated_v3_3) == [
        ("pattern", f"$.{person}.nsf_id")
    ]


def test_organization_uei_is_twelve_characters(nsf_key_person_expanded_generated_v3_3):
    data = _full_form()
    data["senior_key_persons"][0]["organization_uei"] = "TOO-SHORT"
    issues = validate_json_schema_for_form(data, nsf_key_person_expanded_generated_v3_3)
    assert [(issue.type, issue.field) for issue in issues] == [
        ("minLength", "$.senior_key_persons[0].organization_uei")
    ]


# ---------------------------------------------------------------------------
# Conditional field tests
# ---------------------------------------------------------------------------


def test_province_shown_only_outside_us(nsf_key_person_expanded_generated_v3_3):
    rules = ui_rules(nsf_key_person_expanded_generated_v3_3, "province")
    assert len(rules) == len(PEOPLE)
    for rule in rules:
        assert rule["effect"] == "SHOW"
        assert rule["condition"]["scope"].endswith("/properties/address/properties/country")
        assert {"not": {"const": "USA: UNITED STATES"}} in rule["condition"]["schema"]["allOf"]
