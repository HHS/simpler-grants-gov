"""Tests for the Application for Federal Assistance (SF 424 R&R) generated from forms/specs.

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

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

CONTACTS = ("authorized_representative", "project_director", "point_of_contact")


def _address(street: str) -> dict:
    return {
        "street1": street,
        "city": "Boston",
        "state": "MA: Massachusetts",
        "zip_code": "02108-1234",
        "country": "USA: UNITED STATES",
    }


def _contact(first: str, last: str) -> dict:
    return {
        "name": {"first_name": first, "last_name": last},
        "organization": {"name": "Willow Research Institute"},
        "address": _address("24 Orchard Street"),
        "phone": "6175550101",
    }


# Only the answers the form requires, with the agency name and UEI pre-populated.
_MINIMAL_FORM = {
    "opportunity": {"agency_name": "Example Research Agency"},
    "application": {
        "submission_type": "Application",
        "application_type": "New",
        "other_agencies": {"submitted": False},
        "state_review": {"status": "Program is not covered by E.O. 12372"},
    },
    "applicant": {
        "organization": {
            "name": "Willow Research Institute",
            "uei": "A1B2C3D4E5F6",
            "ein": "12-3456789",
            "address": _address("10 Orchard Street"),
        },
        "type": {
            "code": (
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)"
            )
        },
        "congressional_district": "MA-007",
    },
    "project": {
        "title": "Measuring the Effects of Urban Tree Canopy",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            **_contact("Jordan", "Santos"),
            "title": "Director of Sponsored Programs",
            "email": "jordan.santos@example.org",
        },
        "project_director": {**_contact("Avery", "Tran"), "email": "avery.tran@example.org"},
        "point_of_contact": {
            "name": {"first_name": "Quinn", "last_name": "Bennett"},
            "address": _address("15 Orchard Street"),
            "phone": "6175550100",
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
    "certification": {"agree": True},
}

# Every question answered, including each conditional answer.
_FULL_FORM = {
    **_MINIMAL_FORM,
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
        **_MINIMAL_FORM["applicant"],
        "organization": {
            **_MINIMAL_FORM["applicant"]["organization"],
            "department": "Sponsored Research",
            "division": "Research Operations",
        },
        "type": {
            "code": "R: Small Business",
            "small_business": {"women_owned": True, "socially_disadvantaged": False},
        },
    },
    "contacts": {
        "authorized_representative": {
            **_MINIMAL_FORM["contacts"]["authorized_representative"],
            "name": {
                "prefix": "Ms.",
                "first_name": "Jordan",
                "middle_name": "A",
                "last_name": "Santos",
                "suffix": "Jr.",
            },
            "fax": "6175550199",
        },
        "project_director": {
            **_MINIMAL_FORM["contacts"]["project_director"],
            "title": "Principal Investigator",
            "organization": {
                "name": "Willow Research Institute",
                "department": "Urban Ecology",
                "division": "Research",
            },
        },
        "point_of_contact": {
            **_MINIMAL_FORM["contacts"]["point_of_contact"],
            "title": "Grants Manager",
            "fax": "6175550198",
            "email": "quinn.bennett@example.org",
        },
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


def _minimal_form() -> dict:
    return copy.deepcopy(_MINIMAL_FORM)


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(sf424_r_r_generated_v5_0):
    validate_required(_full_form(), [], sf424_r_r_generated_v5_0)


def test_form_without_optional_answers_is_valid(sf424_r_r_generated_v5_0):
    validate_required(_minimal_form(), [], sf424_r_r_generated_v5_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_every_section(sf424_r_r_generated_v5_0):
    expected = [
        f"$.{section}"
        for section in (
            "opportunity",
            "application",
            "applicant",
            "project",
            "contacts",
            "budget",
            "certification",
        )
    ]
    validate_required({}, expected, sf424_r_r_generated_v5_0)


@pytest.mark.parametrize(
    "section,expected",
    [
        ("opportunity", ["agency_name"]),
        (
            "application",
            ["submission_type", "application_type", "other_agencies", "state_review"],
        ),
        (
            "applicant",
            ["organization", "type", "congressional_district"],
        ),
        ("project", ["title", "timeline"]),
        ("contacts", list(CONTACTS)),
        ("budget", ["funding_sources"]),
        ("certification", ["agree"]),
    ],
)
def test_empty_section_requires_its_answers(section, expected, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data[section] = {}
    validate_required(
        data, [f"$.{section}.{field}" for field in expected], sf424_r_r_generated_v5_0
    )


def test_organization_requires_name_uei_ein_and_address(sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["applicant"]["organization"] = {}
    expected = [f"$.applicant.organization.{field}" for field in ("name", "uei", "ein", "address")]
    validate_required(data, expected, sf424_r_r_generated_v5_0)


def test_funding_sources_require_every_amount(sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["budget"]["funding_sources"] = {}
    expected = [
        f"$.budget.funding_sources.{field}"
        for field in ("federal", "non_federal", "total", "program_income")
    ]
    validate_required(data, expected, sf424_r_r_generated_v5_0)


@pytest.mark.parametrize(
    "contact,expected",
    [
        (
            "authorized_representative",
            ["name", "title", "organization", "address", "phone", "email"],
        ),
        ("project_director", ["name", "organization", "address", "phone", "email"]),
        ("point_of_contact", ["name", "address", "phone"]),
    ],
)
def test_empty_contact_requires_its_answers(contact, expected, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["contacts"][contact] = {}
    validate_required(
        data, [f"$.contacts.{contact}.{field}" for field in expected], sf424_r_r_generated_v5_0
    )


@pytest.mark.parametrize("contact", CONTACTS)
def test_contact_name_requires_first_and_last(contact, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["contacts"][contact]["name"] = {}
    expected = [f"$.contacts.{contact}.name.first_name", f"$.contacts.{contact}.name.last_name"]
    validate_required(data, expected, sf424_r_r_generated_v5_0)


# ---------------------------------------------------------------------------
# Conditional rule tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("application_type", ["Renewal", "Continuation", "Revision"])
def test_federal_identifier_is_required_for_prior_award(application_type, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["application"]["application_type"] = application_type
    validate_required(data, ["$.application.federal_identifier"], sf424_r_r_generated_v5_0)


@pytest.mark.parametrize("application_type", ["New", "Resubmission"])
def test_federal_identifier_is_optional_without_prior_award(
    application_type, sf424_r_r_generated_v5_0
):
    data = _minimal_form()
    data["application"]["application_type"] = application_type
    validate_required(data, [], sf424_r_r_generated_v5_0)


@pytest.mark.parametrize(
    "path,answer,required",
    [
        (
            ("application", "submission_type"),
            "Change/Corrected Application",
            "$.application.previous_tracking_id",
        ),
        (
            ("application", "other_agencies", "submitted"),
            True,
            "$.application.other_agencies.explanation",
        ),
        (("application", "state_review", "status"), "Y: Yes", "$.application.state_review.date"),
        (("applicant", "type", "code"), "X: Other (specify)", "$.applicant.type.other_specify"),
    ],
)
def test_answer_requires_its_follow_up(path, answer, required, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    parent = data
    for key in path[:-1]:
        parent = parent[key]
    parent[path[-1]] = answer
    validate_required(data, [required], sf424_r_r_generated_v5_0)


def test_other_revision_requires_explanation(sf424_r_r_generated_v5_0):
    data = _full_form()
    data["application"]["revision"] = {"type": "E"}
    validate_required(data, ["$.application.revision.other_specify"], sf424_r_r_generated_v5_0)


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path,length",
    [
        (("application", "agency_routing_number"), 76),
        (("application", "previous_tracking_id"), 16),
        (("application", "revision", "other_specify"), 46),
        (("application", "other_agencies", "explanation"), 21),
        (("project", "title"), 201),
        (("contacts", "point_of_contact", "fax"), 26),
    ],
)
def test_answer_rejects_value_past_max_length(path, length, sf424_r_r_generated_v5_0):
    data = _full_form()
    parent = data
    for key in path[:-1]:
        parent = parent[key]
    parent[path[-1]] = "a" * length
    validate_max_length(data, ["$." + ".".join(path)], sf424_r_r_generated_v5_0)


def test_previous_tracking_id_rejects_value_under_min_length(sf424_r_r_generated_v5_0):
    data = _full_form()
    data["application"]["previous_tracking_id"] = "GRANT1234567"
    validate_min_length(data, ["$.application.previous_tracking_id"], sf424_r_r_generated_v5_0)


@pytest.mark.parametrize("district", ["MA-07", "MA007", "ma-007"])
def test_congressional_district_rejects_malformed_value(district, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["applicant"]["congressional_district"] = district
    issues = _issues(data, sf424_r_r_generated_v5_0)
    assert issues
    assert {field for _, field in issues} == {"$.applicant.congressional_district"}


@pytest.mark.parametrize("amount", ["1,000", "1000.5", "12345678901234"])
def test_funding_amount_rejects_malformed_value(amount, sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["budget"]["funding_sources"]["federal"] = amount
    assert _issues(data, sf424_r_r_generated_v5_0) == [
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
def test_choice_rejects_unlisted_answer(path, answer, sf424_r_r_generated_v5_0):
    data = _full_form()
    parent = data
    for key in path[:-1]:
        parent = parent[key]
    parent[path[-1]] = answer
    assert _issues(data, sf424_r_r_generated_v5_0) == [("enum", "$." + ".".join(path))]


def test_certification_must_be_agreed(sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["certification"]["agree"] = False
    assert _issues(data, sf424_r_r_generated_v5_0) == [("const", "$.certification.agree")]


def test_zip_code_requires_zip_plus_four(sf424_r_r_generated_v5_0):
    data = _minimal_form()
    data["applicant"]["organization"]["address"]["zip_code"] = "02108"
    issues = _issues(data, sf424_r_r_generated_v5_0)
    assert issues
    assert {field for _, field in issues} == {"$.applicant.organization.address.zip_code"}
