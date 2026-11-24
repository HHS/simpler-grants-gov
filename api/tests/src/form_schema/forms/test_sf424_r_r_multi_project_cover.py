"""Tests for the SF-424 R&R Multi-Project Cover generated from forms/specs.

There is no hand-written form to compare it with, so these check its JSON Schema directly.
Every element of the XSD is optional, so the form requires nothing.
"""

import copy

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _address(street: str) -> dict:
    return {
        "street1": street,
        "city": "Boston",
        "state": "MA: Massachusetts",
        "zip_code": "02108-1234",
        "country": "USA: UNITED STATES",
    }


def _contact(first: str, last: str, email: str) -> dict:
    return {
        "name": {"first_name": first, "last_name": last},
        "organization": {"name": "Willow Research Institute"},
        "address": _address("24 Orchard Street"),
        "phone": "6175550101",
        "email": email,
    }


# A component of a multi-project application, with only the answers it needs.
_COMPONENT_FORM = {
    "application": {"submission_type": "Application", "application_type": "New"},
    "project": {"title": "Core B: Canopy Imaging", "timeline": {"start_date": "2027-01-01"}},
    "contacts": {
        "project_director": {"name": {"last_name": "Tran"}, "email": "avery.tran@example.org"}
    },
    "budget": {"funding_sources": {"federal": "250000.00"}},
}

# Every question answered, including each conditional answer.
_FULL_FORM = {
    "opportunity": {
        "agency_name": "Example Research Agency",
        "assistance_listing": {"number": "93.123", "title": "Community Research"},
    },
    "application": {
        "submission_type": "Change/Corrected Application",
        "date_submitted": "2026-11-05",
        "applicant_id": "APP-123",
        "state": {"received_date": "2026-11-03", "application_id": "MA-2026-01"},
        "federal_identifier": "R01EX123456",
        "agency_routing_number": "ROUTE-1",
        "previous_tracking_id": "GRANT12345678",
        "application_type": "Revision",
        "revision": {"type": "E", "other_specify": "Change of scope"},
        "other_agencies": {"submitted": True, "explanation": "Example Foundation"},
        "state_review": {"status": "Y: Yes", "date": "2026-11-02"},
    },
    "applicant": {
        "organization": {
            "name": "Willow Research Institute",
            "uei": "A1B2C3D4E5F6",
            "ein": "12-3456789",
            "department": "Sponsored Research",
            "division": "Research Operations",
            "address": _address("10 Orchard Street"),
        },
        "type": {
            "code": "R: Small Business",
            "small_business": {"women_owned": True, "socially_disadvantaged": False},
        },
        "congressional_district": "MA-007",
    },
    "project": {
        "title": "Measuring the Effects of Urban Tree Canopy",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            **_contact("Jordan", "Santos", "jordan.santos@example.org"),
            "name": {
                "prefix": "Ms.",
                "first_name": "Jordan",
                "middle_name": "A",
                "last_name": "Santos",
                "suffix": "Jr.",
            },
            "title": "Director of Sponsored Programs",
            "fax": "6175550199",
        },
        "project_director": {
            **_contact("Avery", "Tran", "avery.tran@example.org"),
            "title": "Principal Investigator",
            "organization": {
                "name": "Willow Research Institute",
                "department": "Urban Ecology",
                "division": "Research",
            },
        },
        "point_of_contact": {
            "name": {"first_name": "Quinn", "last_name": "Bennett"},
            "title": "Grants Manager",
            "address": _address("15 Orchard Street"),
            "phone": "6175550100",
            "fax": "6175550198",
            "email": "quinn.bennett@example.org",
        },
    },
    "budget": {
        "funding_sources": {
            "federal": "100000.29",
            "non_federal": "1.15",
            "total": "100001.44",
            "program_income": "0.00",
        }
    },
    "certification": {
        "agree": True,
        "signature": "Jordan Santos",
        "date_signed": "2026-11-05",
    },
    "attachments": {
        "cover_letter": "a6a5c2d5-6f0c-4b6f-8d1e-1c2b3a4d5e6f",
        "pre_application": "b7b6d3e6-7a1d-4c7a-9e2f-2d3c4b5e6f7a",
        "lobbying_disclosure": "c8c7e4f7-8b2e-4d8b-8f3a-3e4d5c6f7a8b",
    },
}


def _full_form() -> dict:
    return copy.deepcopy(_FULL_FORM)


def _set(data: dict, path: tuple[str, ...], value) -> dict:
    parent = data
    for key in path[:-1]:
        parent = parent.setdefault(key, {})
    parent[path[-1]] = value
    return data


def _unset(data: dict, path: tuple[str, ...]) -> dict:
    parent = data
    for key in path[:-1]:
        parent = parent[key]
    del parent[path[-1]]
    return data


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "data",
    [{}, _COMPONENT_FORM, _FULL_FORM],
    ids=["empty", "component", "full"],
)
def test_example_form_is_valid(data, sf424_r_r_multi_project_cover_generated_v4_0):
    validate_required(copy.deepcopy(data), [], sf424_r_r_multi_project_cover_generated_v4_0)


# ---------------------------------------------------------------------------
# Optional field tests
# ---------------------------------------------------------------------------


# Every answer R&R requires, from the section down to the leaf.
@pytest.mark.parametrize(
    "path",
    [
        ("opportunity",),
        ("opportunity", "agency_name"),
        ("application", "submission_type"),
        ("application", "application_type"),
        ("application", "other_agencies", "submitted"),
        ("application", "state_review", "status"),
        ("applicant", "organization", "name"),
        ("applicant", "organization", "uei"),
        ("applicant", "organization", "ein"),
        ("applicant", "organization", "address", "street1"),
        ("applicant", "organization", "address", "city"),
        ("applicant", "organization", "address", "country"),
        ("applicant", "type", "code"),
        ("applicant", "congressional_district"),
        ("project", "title"),
        ("project", "timeline", "start_date"),
        ("project", "timeline", "end_date"),
        ("contacts", "authorized_representative", "name", "first_name"),
        ("contacts", "authorized_representative", "title"),
        ("contacts", "authorized_representative", "organization", "name"),
        ("contacts", "authorized_representative", "phone"),
        ("contacts", "authorized_representative", "email"),
        ("contacts", "project_director"),
        ("contacts", "point_of_contact", "name", "last_name"),
        ("contacts", "point_of_contact", "address"),
        ("budget", "funding_sources", "federal"),
        ("budget", "funding_sources", "total"),
        ("certification", "agree"),
        ("attachments",),
    ],
)
def test_form_without_answer_is_valid(path, sf424_r_r_multi_project_cover_generated_v4_0):
    data = _unset(_full_form(), path)
    validate_required(data, [], sf424_r_r_multi_project_cover_generated_v4_0)


# R&R requires each follow-up; this form drops those rules.
@pytest.mark.parametrize(
    "follow_up",
    [
        ("application", "federal_identifier"),
        ("application", "previous_tracking_id"),
        ("application", "revision", "other_specify"),
        ("application", "other_agencies", "explanation"),
        ("application", "state_review", "date"),
    ],
)
def test_answer_without_follow_up_is_valid(follow_up, sf424_r_r_multi_project_cover_generated_v4_0):
    data = _unset(_full_form(), follow_up)
    validate_required(data, [], sf424_r_r_multi_project_cover_generated_v4_0)


def test_other_applicant_type_without_explanation_is_valid(
    sf424_r_r_multi_project_cover_generated_v4_0,
):
    data = _set(_full_form(), ("applicant", "type"), {"code": "X: Other (specify)"})
    validate_required(data, [], sf424_r_r_multi_project_cover_generated_v4_0)


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path,length",
    [
        (("application", "applicant_id"), 31),
        (("application", "agency_routing_number"), 76),
        (("application", "previous_tracking_id"), 16),
        (("application", "revision", "other_specify"), 46),
        (("application", "other_agencies", "explanation"), 21),
        (("applicant", "type", "other_specify"), 51),
        (("project", "title"), 201),
        (("contacts", "point_of_contact", "fax"), 26),
        (("contacts", "project_director", "organization", "department"), 101),
    ],
)
def test_answer_rejects_value_past_max_length(
    path, length, sf424_r_r_multi_project_cover_generated_v4_0
):
    data = _set(_full_form(), path, "a" * length)
    validate_max_length(data, ["$." + ".".join(path)], sf424_r_r_multi_project_cover_generated_v4_0)


def test_previous_tracking_id_rejects_value_under_min_length(
    sf424_r_r_multi_project_cover_generated_v4_0,
):
    data = _set(_full_form(), ("application", "previous_tracking_id"), "GRANT1234567")
    validate_min_length(
        data, ["$.application.previous_tracking_id"], sf424_r_r_multi_project_cover_generated_v4_0
    )


@pytest.mark.parametrize("district", ["MA-07", "MA007", "ma-007"])
def test_congressional_district_rejects_malformed_value(
    district, sf424_r_r_multi_project_cover_generated_v4_0
):
    data = _set(_full_form(), ("applicant", "congressional_district"), district)
    issues = _issues(data, sf424_r_r_multi_project_cover_generated_v4_0)
    assert issues
    assert {field for _, field in issues} == {"$.applicant.congressional_district"}


@pytest.mark.parametrize("amount", ["1,000", "1000.5", "12345678901234"])
def test_funding_amount_rejects_malformed_value(
    amount, sf424_r_r_multi_project_cover_generated_v4_0
):
    data = _set(_full_form(), ("budget", "funding_sources", "federal"), amount)
    assert _issues(data, sf424_r_r_multi_project_cover_generated_v4_0) == [
        ("pattern", "$.budget.funding_sources.federal")
    ]


@pytest.mark.parametrize(
    "path,answer",
    [
        (("application", "submission_type"), "Correction"),
        (("application", "application_type"), "Supplement"),
        (("application", "revision", "type"), "F"),
        (("application", "state_review", "status"), "No"),
        (("applicant", "type", "code"), "Z: Unknown"),
    ],
)
def test_choice_rejects_unlisted_answer(path, answer, sf424_r_r_multi_project_cover_generated_v4_0):
    data = _set(_full_form(), path, answer)
    assert _issues(data, sf424_r_r_multi_project_cover_generated_v4_0) == [
        ("enum", "$." + ".".join(path))
    ]


def test_certification_rejects_unchecked_agreement(sf424_r_r_multi_project_cover_generated_v4_0):
    data = _set(_full_form(), ("certification", "agree"), False)
    assert _issues(data, sf424_r_r_multi_project_cover_generated_v4_0) == [
        ("const", "$.certification.agree")
    ]


def test_us_zip_code_requires_zip_plus_four(sf424_r_r_multi_project_cover_generated_v4_0):
    data = _set(_full_form(), ("applicant", "organization", "address", "zip_code"), "02108")
    issues = _issues(data, sf424_r_r_multi_project_cover_generated_v4_0)
    assert issues
    assert {field for _, field in issues} == {"$.applicant.organization.address.zip_code"}


@pytest.mark.parametrize(
    "address",
    [
        {"zip_code": "02108"},
        {"zip_code": "K1A 0B1", "country": "CAN: CANADA"},
    ],
    ids=["no-country", "non-us"],
)
def test_short_zip_code_is_valid_without_us_country(
    address, sf424_r_r_multi_project_cover_generated_v4_0
):
    data = _set(_full_form(), ("applicant", "organization", "address"), address)
    validate_required(data, [], sf424_r_r_multi_project_cover_generated_v4_0)
