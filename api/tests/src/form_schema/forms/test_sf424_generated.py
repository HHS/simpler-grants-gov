"""Tests for the SF-424 generated from forms/specs.

The generated form groups its answers by concept, so the hand-written form's tests in
test_sf424.py send data it doesn't accept. These check its JSON Schema with nested answers.
"""

import copy
import uuid

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_max_length, validate_required

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

AMOUNTS = ("federal", "applicant", "state", "local", "other", "program_income")
DISTRICTS = ("applicant", "project")

_MINIMAL_FORM = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "application": {
        "submission_type": "Application",
        "application_type": "New",
        "state_review": {"status": "c. Program is not covered by E.O. 12372."},
    },
    "applicant": {
        "organization": {
            "name": "Prairie Community Research Center",
            "ein": "12-3456789",
            "uei": "PCRA12345678",
            "address": {
                "street1": "128 Oak Avenue",
                "city": "Springfield",
                "state": "IL: Illinois",
                "country": "USA: UNITED STATES",
                "zip_code": "62701-1234",
            },
        },
        "type": {
            "codes": [
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)"
            ]
        },
        "congressional_district": "IL-013",
        "delinquent_federal_debt": {"answer": False},
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "congressional_district": "IL-013",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {"first_name": "Jordan", "last_name": "Reyes"},
            "phone": "2175550102",
            "email": "jordan.reyes@example.org",
        },
        "authorized_representative": {
            "name": {"first_name": "Morgan", "last_name": "Chen"},
            "title": "Executive Director",
            "phone": "2175550103",
            "email": "morgan.chen@example.org",
        },
    },
    "budget": {
        "funding_sources": {
            "federal": "25000.00",
            "applicant": "5000.00",
            "state": "0.00",
            "local": "0.00",
            "other": "0.00",
            "program_income": "0.00",
        }
    },
    "certification": {"agree": True},
}


def _minimal_form() -> dict:
    return copy.deepcopy(_MINIMAL_FORM)


def _full_form() -> dict:
    data = _minimal_form()
    data["opportunity"] |= {
        "assistance_listing": {"number": "99.999", "title": "Community Research Demonstration"},
        "competition": {"number": "COMP-01", "title": "Main Competition"},
    }
    data["application"] |= {
        "application_type": "Revision",
        "revision": {"type": "E: Other (specify)", "other_specify": "Scope change"},
        "date_received": "2026-11-05",
        "applicant_id": "APP-1",
        "federal_entity_identifier": "FED-1",
        "federal_award_identifier": "AWARD-1",
        "state": {"received_date": "2026-11-06", "application_id": "STATE-1"},
        "state_review": {
            "status": (
                "a. This application was made available to the State under the Executive "
                "Order 12372 Process for review on"
            ),
            "date": "2026-10-01",
        },
    }
    data["applicant"]["organization"] |= {"department": "Research", "division": "Climate"}
    data["applicant"]["organization"]["address"] |= {"street2": "Suite 4", "county": "Sangamon"}
    data["applicant"]["type"] = {
        "codes": [
            "H: Public/State Controlled Institution of Higher Education",
            "X: Other (specify)",
        ],
        "other_specify": "Consortium",
    }
    data["applicant"]["delinquent_federal_debt"] = {
        "answer": True,
        "explanation": str(uuid.uuid4()),
    }
    data["project"] |= {
        "additional_titles": [str(uuid.uuid4())],
        "areas_affected": str(uuid.uuid4()),
        "additional_congressional_districts": str(uuid.uuid4()),
    }
    data["contacts"]["point_of_contact"] |= {
        "title": "Grants Administrator",
        "organization": {"name": "Prairie Partners"},
        "fax": "2175550109",
    }
    data["contacts"]["authorized_representative"]["fax"] = "2175550110"
    data["budget"]["funding_sources"]["total"] = "30000.00"
    data["certification"] |= {"signature": "Morgan Chen", "date_signed": "2026-11-05"}
    return data


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return sorted((issue.type, issue.field) for issue in validate_json_schema_for_form(data, form))


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(sf424_generated_v4_0):
    assert _issues(_full_form(), sf424_generated_v4_0) == []


def test_form_without_optional_answers_is_valid(sf424_generated_v4_0):
    assert _issues(_minimal_form(), sf424_generated_v4_0) == []


def test_form_example_is_valid(sf424_generated_v4_0):
    for example in sf424_generated_v4_0.form_json_schema["examples"]:
        assert _issues(example, sf424_generated_v4_0) == []


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_every_section(sf424_generated_v4_0):
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
    validate_required({}, expected, sf424_generated_v4_0)


@pytest.mark.parametrize(
    ("section", "expected"),
    [
        ("opportunity", ["agency_name", "number", "title"]),
        ("application", ["submission_type", "application_type", "state_review"]),
        (
            "applicant",
            ["organization", "type", "congressional_district", "delinquent_federal_debt"],
        ),
        ("project", ["title", "congressional_district", "timeline"]),
        ("contacts", ["point_of_contact", "authorized_representative"]),
        ("budget", ["funding_sources"]),
        ("certification", ["agree"]),
    ],
)
def test_empty_section_requires_its_fields(section, expected, sf424_generated_v4_0):
    data = {**_minimal_form(), section: {}}
    validate_required(data, [f"$.{section}.{field}" for field in expected], sf424_generated_v4_0)


def test_funding_sources_require_every_amount_but_total(sf424_generated_v4_0):
    data = _minimal_form()
    data["budget"]["funding_sources"] = {}
    expected = [f"$.budget.funding_sources.{amount}" for amount in AMOUNTS]
    validate_required(data, expected, sf424_generated_v4_0)


@pytest.mark.parametrize("contact", ["point_of_contact", "authorized_representative"])
def test_contact_name_requires_first_and_last(contact, sf424_generated_v4_0):
    data = _minimal_form()
    data["contacts"][contact]["name"] = {}
    expected = [f"$.contacts.{contact}.name.first_name", f"$.contacts.{contact}.name.last_name"]
    validate_required(data, expected, sf424_generated_v4_0)


# ---------------------------------------------------------------------------
# Conditional rule tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("application_type", "expected"),
    [
        ("Revision", ["$.application.revision", "$.application.federal_award_identifier"]),
        ("Continuation", ["$.application.federal_award_identifier"]),
    ],
)
def test_application_type_requires_award_details(application_type, expected, sf424_generated_v4_0):
    data = _minimal_form()
    data["application"]["application_type"] = application_type
    validate_required(data, expected, sf424_generated_v4_0)


@pytest.mark.parametrize(
    ("path", "answer", "expected"),
    [
        (
            ("application", "revision"),
            {"type": "E: Other (specify)"},
            "$.application.revision.other_specify",
        ),
        (
            ("applicant", "type"),
            {"codes": ["X: Other (specify)"]},
            "$.applicant.type.other_specify",
        ),
        (
            ("applicant", "delinquent_federal_debt"),
            {"answer": True},
            "$.applicant.delinquent_federal_debt.explanation",
        ),
        (
            ("application", "state_review"),
            {
                "status": (
                    "a. This application was made available to the State under the Executive "
                    "Order 12372 Process for review on"
                )
            },
            "$.application.state_review.date",
        ),
    ],
)
def test_answer_requires_its_follow_up(path, answer, expected, sf424_generated_v4_0):
    data = _minimal_form()
    if path == ("application", "revision"):
        data["application"] |= {"application_type": "Revision", "federal_award_identifier": "A"}
    data[path[0]][path[1]] = answer
    validate_required(data, [expected], sf424_generated_v4_0)


def test_us_address_requires_zip_plus_four(sf424_generated_v4_0):
    data = _minimal_form()
    data["applicant"]["organization"]["address"]["zip_code"] = "62701"
    assert _issues(data, sf424_generated_v4_0) == [
        ("minLength", "$.applicant.organization.address.zip_code")
    ]


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("path", "length"),
    [
        (("application", "revision", "other_specify"), 22),
        (("application", "state", "application_id"), 31),
        (("applicant", "organization", "department"), 31),
        (("applicant", "organization", "division"), 31),
        (("applicant", "type", "other_specify"), 31),
        (("project", "title"), 201),
        (("contacts", "authorized_representative", "title"), 46),
    ],
)
def test_field_rejects_answer_past_max_length(path, length, sf424_generated_v4_0):
    data = _full_form()
    *parents, field = path
    node = data
    for step in parents:
        node = node[step]
    node[field] = "a" * length
    validate_max_length(data, ["$." + ".".join(path)], sf424_generated_v4_0)


@pytest.mark.parametrize("amount", ["-1.00", "1,000", "10.5", "1234567890123"])
@pytest.mark.parametrize("source", AMOUNTS)
def test_amount_must_be_budget_amount(source, amount, sf424_generated_v4_0):
    data = _minimal_form()
    data["budget"]["funding_sources"][source] = amount
    assert _issues(data, sf424_generated_v4_0) == [
        ("pattern", f"$.budget.funding_sources.{source}")
    ]


@pytest.mark.parametrize("district", ["IL-13", "IL013", "il-013"])
@pytest.mark.parametrize("section", DISTRICTS)
def test_congressional_district_must_match_dat_format(section, district, sf424_generated_v4_0):
    data = _minimal_form()
    data[section]["congressional_district"] = district
    assert ("pattern", f"$.{section}.congressional_district") in _issues(data, sf424_generated_v4_0)


@pytest.mark.parametrize("district", ["MD-all", "US-all", "00-000"])
@pytest.mark.parametrize("section", DISTRICTS)
def test_congressional_district_accepts_dat_examples(section, district, sf424_generated_v4_0):
    data = _minimal_form()
    data[section]["congressional_district"] = district
    assert _issues(data, sf424_generated_v4_0) == []


def test_certification_must_be_agreed(sf424_generated_v4_0):
    data = _minimal_form()
    data["certification"]["agree"] = False
    assert _issues(data, sf424_generated_v4_0) == [("const", "$.certification.agree")]


def test_applicant_type_offers_xsd_spelling_of_public_state(sf424_generated_v4_0):
    data = _minimal_form()
    data["applicant"]["type"]["codes"] = [
        "H: Public/state Controlled Institution of Higher Education"
    ]
    assert _issues(data, sf424_generated_v4_0) == [("enum", "$.applicant.type.codes[0]")]


def test_applicant_type_cannot_repeat_code(sf424_generated_v4_0):
    # DAT 09-1/09-2: the same code can't be selected twice.
    data = _minimal_form()
    data["applicant"]["type"]["codes"] = ["A: State Government"] * 2
    assert _issues(data, sf424_generated_v4_0) == [("uniqueItems", "$.applicant.type.codes")]
