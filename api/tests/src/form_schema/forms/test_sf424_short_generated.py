"""Tests for the SF-424 Short Organizational generated from forms/specs.

The hand-written form's tests in test_sf424_short.py use its flat field names, so these
check the generated form's JSON Schema at its own paths.
"""

import copy
import json

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_max_length, validate_required

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

ADDRESSES = (
    "applicant.organization.address",
    "contacts.project_director.address",
    "contacts.point_of_contact.address",
)

_US_ADDRESS = {
    "street1": "128 Oak Avenue",
    "street2": "Suite 200",
    "city": "Springfield",
    "county": "Sangamon",
    "state": "IL: Illinois",
    "country": "USA: UNITED STATES",
    "zip_code": "62701-1234",
}

_CONTACT = {
    "name": {
        "prefix": "Dr.",
        "first_name": "Avery",
        "middle_name": "J",
        "last_name": "Patel",
        "suffix": "Jr.",
    },
    "title": "Research Director",
    "address": _US_ADDRESS,
    "phone": "217-555-0101",
    "fax": "217-555-0199",
    "email": "avery.patel@example.org",
}

_FULL_FORM = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "assistance_listing": {"number": "99.999", "title": "Community Research Demonstration"},
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "application": {"date_received": "2027-01-02"},
    "applicant": {
        "organization": {
            "name": "Prairie Community Research Center",
            "uei": "PCRA12345678",
            "ein": "12-3456789",
            "address": _US_ADDRESS,
            "web_address": "https://prairie.example.org",
        },
        "type": {
            "codes": [
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)"
            ]
        },
        "congressional_district": "IL-013",
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "description": "Survey residents and map shaded gathering spaces.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            "name": {"first_name": "Morgan", "last_name": "Chen"},
            "title": "Executive Director",
            "phone": "217-555-0103",
            "fax": "217-555-0198",
            "email": "morgan.chen@example.org",
        },
        "project_director": _CONTACT,
        "point_of_contact": {**_CONTACT, "same_as_project_director": True},
    },
    "certification": {
        "agree": True,
        "signature": "Morgan Chen",
        "date_signed": "2027-01-02",
    },
}

# Only the answers the form requires. Grants.gov fills the opportunity, received date and
# signature, but the opportunity is pre-populated before the applicant sees the form.
_MINIMAL_FORM = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "applicant": {
        "organization": {
            "name": "Maple Community Research Centre",
            "uei": "MCRC12345678",
            "ein": "44-4444444",
            "address": {"street1": "240 Maple Street", "city": "Ottawa", "country": "CAN: CANADA"},
        },
        "type": {"codes": ["W: Non-domestic (non-US) Entity"]},
        "congressional_district": "00-000",
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "description": "Survey residents and map shaded gathering spaces.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            "name": {"first_name": "Morgan", "last_name": "Chen"},
            "title": "Executive Director",
            "phone": "613-555-0103",
            "email": "morgan.chen@example.org",
        },
        "project_director": {
            "name": {"first_name": "Avery", "last_name": "Patel"},
            "title": "Research Director",
            "address": {"street1": "240 Maple Street", "city": "Ottawa", "country": "CAN: CANADA"},
            "phone": "613-555-0101",
            "email": "avery.patel@example.org",
        },
        "point_of_contact": {
            "name": {"first_name": "Jordan", "last_name": "Reyes"},
            "title": "Grants Administrator",
            "address": {"street1": "240 Maple Street", "city": "Ottawa", "country": "CAN: CANADA"},
            "phone": "613-555-0102",
            "email": "jordan.reyes@example.org",
        },
    },
    "certification": {"agree": True},
}


def _full_form() -> dict:
    # Round-trip through JSON so each address and contact is its own copy.
    return json.loads(json.dumps(_FULL_FORM))


def _set(data: dict, path: str, value) -> dict:
    *parents, leaf = path.split(".")
    node = data
    for key in parents:
        node = node[key]
    node[leaf] = value
    return data


def _delete(data: dict, path: str) -> dict:
    *parents, leaf = path.split(".")
    node = data
    for key in parents:
        node = node[key]
    del node[leaf]
    return data


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(sf424_short_generated_v3_0):
    validate_required(_full_form(), [], sf424_short_generated_v3_0)


def test_form_without_optional_answers_is_valid(sf424_short_generated_v3_0):
    validate_required(copy.deepcopy(_MINIMAL_FORM), [], sf424_short_generated_v3_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_each_section(sf424_short_generated_v3_0):
    expected = ["$.opportunity", "$.applicant", "$.project", "$.contacts", "$.certification"]
    validate_required({}, expected, sf424_short_generated_v3_0)


@pytest.mark.parametrize(
    "section,expected",
    [
        ("opportunity", ["agency_name", "number", "title"]),
        ("applicant", ["organization", "type", "congressional_district"]),
        ("project", ["title", "description", "timeline"]),
        ("contacts", ["authorized_representative", "project_director", "point_of_contact"]),
        ("certification", ["agree"]),
    ],
)
def test_empty_section_requires_its_fields(section, expected, sf424_short_generated_v3_0):
    data = _set(_full_form(), section, {})
    validate_required(
        data, [f"$.{section}.{field}" for field in expected], sf424_short_generated_v3_0
    )


@pytest.mark.parametrize(
    "path,expected",
    [
        ("applicant.organization", ["name", "uei", "ein", "address"]),
        ("project.timeline", ["start_date", "end_date"]),
        ("contacts.authorized_representative", ["name", "title", "phone", "email"]),
        ("contacts.project_director", ["name", "title", "address", "phone", "email"]),
        ("contacts.point_of_contact", ["name", "title", "address", "phone", "email"]),
    ],
)
def test_empty_group_requires_its_fields(path, expected, sf424_short_generated_v3_0):
    data = _set(_full_form(), path, {})
    validate_required(data, [f"$.{path}.{field}" for field in expected], sf424_short_generated_v3_0)


def test_point_of_contact_is_required_when_same_as_project_director(
    sf424_short_generated_v3_0,
):
    # Product chose to have the applicant fill in the contact even when it matches (#10820).
    data = _set(_full_form(), "contacts.point_of_contact", {"same_as_project_director": True})
    expected = [
        f"$.contacts.point_of_contact.{field}"
        for field in ("name", "title", "address", "phone", "email")
    ]
    validate_required(data, expected, sf424_short_generated_v3_0)


def test_other_specify_is_required_when_applicant_type_is_other(sf424_short_generated_v3_0):
    data = _set(_full_form(), "applicant.type.codes", ["X: Other (specify)"])
    validate_required(data, ["$.applicant.type.other_specify"], sf424_short_generated_v3_0)


@pytest.mark.parametrize("address", ADDRESSES)
def test_us_address_requires_state_and_zip_code(address, sf424_short_generated_v3_0):
    data = _full_form()
    _delete(data, f"{address}.state")
    _delete(data, f"{address}.zip_code")
    validate_required(
        data, [f"$.{address}.state", f"$.{address}.zip_code"], sf424_short_generated_v3_0
    )


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path,length",
    [
        ("applicant.organization.name", 61),
        ("applicant.organization.web_address", 251),
        ("applicant.type.other_specify", 31),
        ("project.title", 201),
        ("project.description", 1001),
        ("contacts.authorized_representative.title", 46),
        ("contacts.project_director.phone", 26),
        ("contacts.point_of_contact.address.street1", 56),
    ],
)
def test_answer_past_max_length_is_rejected(path, length, sf424_short_generated_v3_0):
    data = _set(_full_form(), path, "a" * length)
    validate_max_length(data, [f"$.{path}"], sf424_short_generated_v3_0)


@pytest.mark.parametrize("address", ADDRESSES)
def test_us_zip_code_needs_all_nine_digits(address, sf424_short_generated_v3_0):
    data = _set(_full_form(), f"{address}.zip_code", "62701")
    assert _issues(data, sf424_short_generated_v3_0) == [("minLength", f"$.{address}.zip_code")]


@pytest.mark.parametrize("address", ADDRESSES)
def test_non_us_zip_code_accepts_any_length(address, sf424_short_generated_v3_0):
    data = _full_form()
    _set(data, address, {"street1": "1 Rue", "city": "Paris", "country": "FRA: FRANCE"})
    _set(data, f"{address}.zip_code", "75")
    validate_required(data, [], sf424_short_generated_v3_0)


@pytest.mark.parametrize("district", ["IL-13", "IL013", "il-013-x", "I-0133"])
def test_congressional_district_needs_state_hyphen_district(district, sf424_short_generated_v3_0):
    data = _set(_full_form(), "applicant.congressional_district", district)
    found = {issue_type for issue_type, _ in _issues(data, sf424_short_generated_v3_0)}
    assert found and found <= {"pattern", "minLength", "maxLength"}


def test_applicant_type_must_be_listed_type(sf424_short_generated_v3_0):
    # The XSD spells option H with a capital S; the hand-written form's lowercase one fails.
    data = _set(
        _full_form(),
        "applicant.type.codes",
        ["H: Public/state Controlled Institution of Higher Education"],
    )
    assert _issues(data, sf424_short_generated_v3_0) == [("enum", "$.applicant.type.codes[0]")]


@pytest.mark.parametrize(
    "codes,issue",
    [
        ([], "minItems"),
        (
            [
                "A: State Government",
                "B: County Government",
                "C: City or Township Government",
                "R: Small Business",
            ],
            "maxItems",
        ),
    ],
)
def test_applicant_type_takes_one_to_three_codes(codes, issue, sf424_short_generated_v3_0):
    data = _set(_full_form(), "applicant.type.codes", codes)
    assert _issues(data, sf424_short_generated_v3_0) == [(issue, "$.applicant.type.codes")]


def test_applicant_type_cannot_repeat_code(sf424_short_generated_v3_0):
    # DAT 5d-2/5d-3: the same code can't be selected twice.
    data = _set(_full_form(), "applicant.type.codes", ["A: State Government"] * 2)
    assert _issues(data, sf424_short_generated_v3_0) == [("uniqueItems", "$.applicant.type.codes")]


def test_certification_must_be_agreed(sf424_short_generated_v3_0):
    data = _set(_full_form(), "certification.agree", False)
    assert _issues(data, sf424_short_generated_v3_0) == [("const", "$.certification.agree")]


def test_email_must_be_valid_address(sf424_short_generated_v3_0):
    data = _set(_full_form(), "contacts.project_director.email", "not-an-email")
    assert _issues(data, sf424_short_generated_v3_0) == [
        ("format", "$.contacts.project_director.email")
    ]
