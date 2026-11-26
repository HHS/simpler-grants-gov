"""Tests for the Application for Federal Domestic Assistance - Individual generated from
forms/specs.

There is no hand-written form to compare it with, so these check its JSON Schema directly.
"""

import copy

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_max_length, validate_required

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_FULL_FORM = {
    "opportunity": {
        "agency_name": "National Endowment for the Humanities",
        "number": "NEH-FEL-2027",
        "title": "Fellowships",
        "assistance_listing": {"number": "45.160", "title": "Fellowships and Stipends"},
    },
    "application": {"date_received": "2026-11-02"},
    "applicant": {
        "person": {
            "citizenship": {
                "is_us_citizen": False,
                "country": "URY: URUGUAY",
                "alien_registration_number": "A123456789",
                "residency_start_date": "2025-01-15",
            }
        },
        "congressional_district": "MD-007",
    },
    "project": {
        "title": "Community Archives Research",
        "description": "Study and document community archives.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {
                "prefix": "Dr.",
                "first_name": "Alicia",
                "middle_name": "Marie",
                "last_name": "Reyes",
                "suffix": "PhD",
            },
            "address": {
                "street1": "100 Grant Avenue",
                "street2": "Unit 400",
                "city": "Baltimore",
                "county": "Baltimore City",
                "state": "MD: Maryland",
                "zip_code": "21218-1234",
                "country": "USA: UNITED STATES",
            },
            "phone": "4105550100",
            "evening_phone": "4105550101",
            "fax": "4105550199",
            "email": "alicia.reyes@example.org",
        }
    },
    "certification": {
        "agree": True,
        "signature": "Alicia Reyes",
        "date_signed": "2026-11-02",
    },
}

# Only the answers the form requires, from a U.S. citizen outside the U.S.
_MINIMAL_FORM = {
    "opportunity": {
        "agency_name": "National Endowment for the Humanities",
        "number": "NEH-FEL-2027",
        "title": "Fellowships",
    },
    "applicant": {
        "person": {"citizenship": {"is_us_citizen": True}},
        "congressional_district": "00-000",
    },
    "project": {
        "title": "Community Archives Research",
        "description": "Study and document community archives.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {"first_name": "Tom", "last_name": "Okafor"},
            "address": {
                "street1": "456 Rio",
                "city": "Montevideo",
                "country": "URY: URUGUAY",
            },
            "phone": "1234567890",
            "email": "tom.okafor@example.org",
        }
    },
    "certification": {"agree": True},
}


def _full_form() -> dict:
    return copy.deepcopy(_FULL_FORM)


def _set(data: dict, path: str, value) -> None:
    *parents, field = path.split(".")
    for parent in parents:
        data = data[parent]
    data[field] = value


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(sf424_individual_generated_v2_0):
    validate_required(_full_form(), [], sf424_individual_generated_v2_0)


def test_form_without_optional_answers_is_valid(sf424_individual_generated_v2_0):
    validate_required(copy.deepcopy(_MINIMAL_FORM), [], sf424_individual_generated_v2_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_every_section_but_application(sf424_individual_generated_v2_0):
    expected = ["$.opportunity", "$.applicant", "$.project", "$.contacts", "$.certification"]
    validate_required({}, expected, sf424_individual_generated_v2_0)


@pytest.mark.parametrize(
    ("section", "expected"),
    [
        ("opportunity", ["agency_name", "number", "title"]),
        ("applicant", ["person", "congressional_district"]),
        ("project", ["title", "description", "timeline"]),
        ("contacts", ["point_of_contact"]),
        ("certification", ["agree"]),
    ],
)
def test_empty_section_requires_its_fields(section, expected, sf424_individual_generated_v2_0):
    data = {**_full_form(), section: {}}
    validate_required(
        data, [f"$.{section}.{field}" for field in expected], sf424_individual_generated_v2_0
    )


def test_point_of_contact_requires_name_address_phone_and_email(
    sf424_individual_generated_v2_0,
):
    data = _full_form()
    data["contacts"]["point_of_contact"] = {}
    expected = [
        f"$.contacts.point_of_contact.{field}" for field in ("name", "address", "phone", "email")
    ]
    validate_required(data, expected, sf424_individual_generated_v2_0)


def test_name_requires_first_and_last(sf424_individual_generated_v2_0):
    data = _full_form()
    data["contacts"]["point_of_contact"]["name"] = {}
    expected = [
        "$.contacts.point_of_contact.name.first_name",
        "$.contacts.point_of_contact.name.last_name",
    ]
    validate_required(data, expected, sf424_individual_generated_v2_0)


def test_timeline_requires_start_and_end_dates(sf424_individual_generated_v2_0):
    data = _full_form()
    data["project"]["timeline"] = {}
    expected = ["$.project.timeline.start_date", "$.project.timeline.end_date"]
    validate_required(data, expected, sf424_individual_generated_v2_0)


def test_non_citizen_requires_country_and_residency_start_date(sf424_individual_generated_v2_0):
    data = _full_form()
    data["applicant"]["person"]["citizenship"] = {"is_us_citizen": False}
    expected = [
        "$.applicant.person.citizenship.country",
        "$.applicant.person.citizenship.residency_start_date",
    ]
    validate_required(data, expected, sf424_individual_generated_v2_0)


def test_us_address_requires_state_and_zip_code(sf424_individual_generated_v2_0):
    data = _full_form()
    address = data["contacts"]["point_of_contact"]["address"]
    del address["state"]
    del address["zip_code"]
    expected = [
        "$.contacts.point_of_contact.address.state",
        "$.contacts.point_of_contact.address.zip_code",
    ]
    validate_required(data, expected, sf424_individual_generated_v2_0)


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("path", "length"),
    [
        ("applicant.person.citizenship.alien_registration_number", 15),
        ("project.title", 201),
        ("project.description", 1001),
        ("contacts.point_of_contact.name.first_name", 36),
        ("contacts.point_of_contact.name.last_name", 61),
        ("contacts.point_of_contact.address.street1", 56),
        ("contacts.point_of_contact.address.city", 36),
        ("contacts.point_of_contact.phone", 26),
        ("contacts.point_of_contact.evening_phone", 26),
        ("contacts.point_of_contact.fax", 26),
    ],
)
def test_field_rejects_answer_past_max_length(path, length, sf424_individual_generated_v2_0):
    data = _full_form()
    _set(data, path, "a" * length)
    validate_max_length(data, [f"$.{path}"], sf424_individual_generated_v2_0)


def test_us_zip_code_requires_all_nine_digits(sf424_individual_generated_v2_0):
    data = _full_form()
    data["contacts"]["point_of_contact"]["address"]["zip_code"] = "21218"
    assert _issues(data, sf424_individual_generated_v2_0) == [
        ("minLength", "$.contacts.point_of_contact.address.zip_code")
    ]


@pytest.mark.parametrize("district", ["MD-7", "MD007", "md-007", "MD-0071"])
def test_congressional_district_must_match_state_hyphen_district(
    district, sf424_individual_generated_v2_0
):
    data = _full_form()
    data["applicant"]["congressional_district"] = district
    issues = _issues(data, sf424_individual_generated_v2_0)
    assert issues
    assert {field for _, field in issues} == {"$.applicant.congressional_district"}


@pytest.mark.parametrize(
    ("path", "value"),
    [
        ("applicant.person.citizenship.country", "Uruguay"),
        ("contacts.point_of_contact.address.state", "Maryland"),
        ("contacts.point_of_contact.address.country", "United States"),
    ],
)
def test_coded_field_must_be_listed_code(path, value, sf424_individual_generated_v2_0):
    data = _full_form()
    _set(data, path, value)
    assert ("enum", f"$.{path}") in _issues(data, sf424_individual_generated_v2_0)


def test_us_citizenship_must_be_yes_or_no(sf424_individual_generated_v2_0):
    data = _full_form()
    data["applicant"]["person"]["citizenship"]["is_us_citizen"] = "Yes"
    assert ("type", "$.applicant.person.citizenship.is_us_citizen") in _issues(
        data, sf424_individual_generated_v2_0
    )


def test_certification_must_be_agreed(sf424_individual_generated_v2_0):
    data = _full_form()
    data["certification"]["agree"] = False
    assert _issues(data, sf424_individual_generated_v2_0) == [("const", "$.certification.agree")]


def test_email_must_be_valid_address(sf424_individual_generated_v2_0):
    data = _full_form()
    data["contacts"]["point_of_contact"]["email"] = "not-an-email"
    assert _issues(data, sf424_individual_generated_v2_0) == [
        ("format", "$.contacts.point_of_contact.email")
    ]


@pytest.mark.parametrize(
    "path",
    [
        "application.date_received",
        "applicant.person.citizenship.residency_start_date",
        "project.timeline.start_date",
        "project.timeline.end_date",
    ],
)
def test_date_field_rejects_non_date(path, sf424_individual_generated_v2_0):
    data = _full_form()
    _set(data, path, "01/01/2027")
    assert _issues(data, sf424_individual_generated_v2_0) == [("format", f"$.{path}")]
