"""Tests for the SF424 Mandatory Form generated from forms/specs.

There is no hand-written form to compare it with, so these check its JSON Schema directly.
"""

import copy

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from tests.src.form_schema.forms.conftest import validate_max_length, validate_required

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

ATTACHMENT_IDS = [
    "00000000-0000-4000-8000-000000007121",
    "00000000-0000-4000-8000-000000007122",
    "00000000-0000-4000-8000-000000007123",
]

_FULL_FORM = {
    "opportunity": {
        "agency_name": "Department of Education",
        "assistance_listing": {"number": "84.027", "title": "Synthetic Education Program"},
    },
    "application": {
        "submission_type": "Other",
        "submission_type_other": "Formula grant request",
        "frequency": {"code": "Other", "other": "Semiannual"},
        "consolidated_request": {
            "answer": True,
            "explanation": "Consolidated submission for two community programs.",
        },
        "version": "Initial",
        "date_received": "2026-11-03",
        "applicant_id": "APPLICANT-01",
        "federal_entity_identifier": "ENTITY-01",
        "federal_award_identifier": "AWARD-01",
        "state": {"received_date": "2026-10-29", "application_id": "STATE-01"},
        "state_review": {"status": "StateReviewAvailable", "date": "2026-10-28"},
    },
    "applicant": {
        "organization": {
            "name": "Example Community Organization",
            "uei": "AAAAAAAAAAAA",
            "ein": "12-3456789",
            "address": {
                "street1": "100 Grant Avenue",
                "street2": "Suite 400",
                "city": "Baltimore",
                "county": "Baltimore City",
                "state": "MD: Maryland",
                "country": "USA: UNITED STATES",
                "zip_code": "21218-1234",
            },
            "department": "Community Programs",
            "division": "Education",
        },
        "type": {
            "code": "X: Other (specify)",
            "other_specify": "Community partnership",
            "additional_description": "Educational community organization",
        },
        "congressional_district": "MD-007",
        "delinquent_federal_debt": {"answer": True, "explanation": "Payment plan in place."},
    },
    "project": {
        "title": "Community Learning Program",
        "areas_affected": "Baltimore City",
        "congressional_district": "MD-007",
        "additional_congressional_districts": ATTACHMENT_IDS[0],
    },
    "contacts": {
        "authorized_representative": {
            "name": {
                "prefix": "Ms.",
                "first_name": "Priya",
                "middle_name": "K",
                "last_name": "Patel",
                "suffix": "Jr.",
            },
            "title": "Executive Director",
            "organization": {"name": "Example Community Organization"},
            "phone": "4105550101",
            "fax": "4105550198",
            "email": "priya.patel@example.org",
        },
        "point_of_contact": {
            "name": {"prefix": "Dr.", "first_name": "Alicia", "last_name": "Reyes"},
            "title": "Program Director",
            "organization": {"name": "Example Community Organization"},
            "phone": "4105550100",
            "fax": "4105550199",
            "email": "alicia.reyes@example.org",
        },
    },
    "budget": {
        "funding_sources": {"federal": "12345.67", "match": "0"},
        "funding_period": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "certification": {
        "agree": True,
        "signature": "Priya Patel",
        "date_signed": "2026-11-03",
    },
    "attachments": {"additional": ATTACHMENT_IDS[1:]},
}

# Only the answers the form requires.
_MINIMAL_FORM = {
    "opportunity": {"agency_name": "Department of Education"},
    "application": {
        "submission_type": "Application",
        "frequency": {"code": "Annual"},
        "version": "Initial",
        "state_review": {"status": "StateReviewNotNeeded"},
    },
    "applicant": {
        "organization": {
            "name": "Example Community Organization",
            "uei": "AAAAAAAAAAAA",
            "ein": "12-3456789",
            "address": {
                "street1": "100 Grant Avenue",
                "city": "Baltimore",
                "state": "MD: Maryland",
                "country": "USA: UNITED STATES",
                "zip_code": "21218-1234",
            },
        },
        "type": {"code": "A: State Government"},
        "congressional_district": "MD-007",
        "delinquent_federal_debt": {"answer": False},
    },
    "project": {"title": "Community Learning Program"},
    "contacts": {
        "authorized_representative": {
            "name": {"first_name": "Priya", "last_name": "Patel"},
            "title": "Executive Director",
            "phone": "4105550101",
            "email": "priya.patel@example.org",
        },
        "point_of_contact": {
            "name": {"first_name": "Alicia", "last_name": "Reyes"},
            "phone": "4105550100",
            "email": "alicia.reyes@example.org",
        },
    },
    "budget": {
        "funding_sources": {"federal": "0"},
        "funding_period": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "certification": {"agree": True},
}


def _full_form() -> dict:
    return copy.deepcopy(_FULL_FORM)


def _issues(data: dict, form) -> list[tuple[str, str]]:
    return [(issue.type, issue.field) for issue in validate_json_schema_for_form(data, form)]


def _set(data: dict, path: str, value) -> dict:
    """Set the answer at a dotted `path` in `data`, or remove it when `value` is None."""
    *parents, leaf = path.split(".")
    node = data
    for part in parents:
        node = node[part]
    if value is None:
        node.pop(leaf, None)
    else:
        node[leaf] = value
    return data


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_form_is_valid(sf424_mandatory_generated_v3_0):
    validate_required(_full_form(), [], sf424_mandatory_generated_v3_0)


def test_form_without_optional_answers_is_valid(sf424_mandatory_generated_v3_0):
    validate_required(copy.deepcopy(_MINIMAL_FORM), [], sf424_mandatory_generated_v3_0)


def test_applicant_outside_us_needs_no_state_or_zip_code(sf424_mandatory_generated_v3_0):
    data = _full_form()
    data["applicant"]["organization"]["address"] = {
        "street1": "25 King's Parade",
        "city": "Cambridge",
        "province": "Cambridgeshire",
        "country": "GBR: UNITED KINGDOM",
    }
    data["applicant"]["congressional_district"] = "00-000"
    assert _issues(data, sf424_mandatory_generated_v3_0) == []


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_requires_each_section(sf424_mandatory_generated_v3_0):
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
    validate_required({}, expected, sf424_mandatory_generated_v3_0)


@pytest.mark.parametrize(
    "section,expected",
    [
        ("opportunity", ["agency_name"]),
        ("application", ["submission_type", "frequency", "version", "state_review"]),
        (
            "applicant",
            ["organization", "type", "congressional_district", "delinquent_federal_debt"],
        ),
        ("project", ["title"]),
        ("contacts", ["authorized_representative", "point_of_contact"]),
        ("budget", ["funding_sources", "funding_period"]),
        ("certification", ["agree"]),
    ],
)
def test_empty_section_requires_its_answers(section, expected, sf424_mandatory_generated_v3_0):
    data = {**_full_form(), section: {}}
    validate_required(data, [f"$.{section}.{f}" for f in expected], sf424_mandatory_generated_v3_0)


@pytest.mark.parametrize(
    "path,expected",
    [
        ("application.frequency", ["code"]),
        ("application.state_review", ["status"]),
        ("applicant.organization", ["name", "uei", "ein", "address"]),
        ("applicant.type", ["code"]),
        ("applicant.delinquent_federal_debt", ["answer"]),
        ("contacts.authorized_representative", ["name", "title", "phone", "email"]),
        ("contacts.point_of_contact", ["name", "phone", "email"]),
        ("contacts.authorized_representative.name", ["first_name", "last_name"]),
        ("contacts.point_of_contact.name", ["first_name", "last_name"]),
        ("budget.funding_sources", ["federal"]),
        ("budget.funding_period", ["start_date", "end_date"]),
    ],
)
def test_empty_group_requires_its_answers(path, expected, sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), path, {})
    validate_required(data, [f"$.{path}.{f}" for f in expected], sf424_mandatory_generated_v3_0)


def test_us_address_requires_state_and_zip_code(sf424_mandatory_generated_v3_0):
    data = _full_form()
    address = data["applicant"]["organization"]["address"]
    del address["state"], address["zip_code"]
    prefix = "$.applicant.organization.address"
    validate_required(
        data, [f"{prefix}.state", f"{prefix}.zip_code"], sf424_mandatory_generated_v3_0
    )


# ---------------------------------------------------------------------------
# Conditional rule tests
# ---------------------------------------------------------------------------

# Each follow-up answer the form requires only when its question takes a given answer.
CONDITIONAL_FOLLOW_UPS = [
    ("application.submission_type_other", "application.submission_type", "Other"),
    ("application.frequency.other", "application.frequency.code", "Other"),
    (
        "application.consolidated_request.explanation",
        "application.consolidated_request.answer",
        True,
    ),
    ("application.state_review.date", "application.state_review.status", "StateReviewAvailable"),
    ("applicant.type.other_specify", "applicant.type.code", "X: Other (specify)"),
    (
        "applicant.delinquent_federal_debt.explanation",
        "applicant.delinquent_federal_debt.answer",
        True,
    ),
]


@pytest.mark.parametrize("follow_up,question,answer", CONDITIONAL_FOLLOW_UPS)
def test_follow_up_is_required_after_triggering_answer(
    follow_up, question, answer, sf424_mandatory_generated_v3_0
):
    data = _set(_set(_full_form(), question, answer), follow_up, None)
    validate_required(data, [f"$.{follow_up}"], sf424_mandatory_generated_v3_0)


@pytest.mark.parametrize(
    "follow_up,question,answer",
    [
        ("application.submission_type_other", "application.submission_type", "Plan"),
        ("application.frequency.other", "application.frequency.code", "Quarterly"),
        (
            "application.consolidated_request.explanation",
            "application.consolidated_request.answer",
            False,
        ),
        (
            "application.state_review.date",
            "application.state_review.status",
            "StateReviewNotSelected",
        ),
        ("applicant.type.other_specify", "applicant.type.code", "B: County Government"),
        (
            "applicant.delinquent_federal_debt.explanation",
            "applicant.delinquent_federal_debt.answer",
            False,
        ),
    ],
)
def test_follow_up_is_optional_after_other_answers(
    follow_up, question, answer, sf424_mandatory_generated_v3_0
):
    data = _set(_set(_full_form(), question, answer), follow_up, None)
    assert _issues(data, sf424_mandatory_generated_v3_0) == []


# ---------------------------------------------------------------------------
# Field value tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path,length",
    [
        ("application.submission_type_other", 51),
        ("application.frequency.other", 51),
        ("application.consolidated_request.explanation", 4001),
        ("applicant.organization.department", 31),
        ("applicant.organization.division", 31),
        ("applicant.type.other_specify", 51),
        ("applicant.type.additional_description", 51),
        ("applicant.delinquent_federal_debt.explanation", 4001),
        ("project.title", 251),
        ("project.areas_affected", 251),
        ("contacts.authorized_representative.title", 46),
        ("contacts.point_of_contact.organization.name", 61),
    ],
)
def test_answer_past_max_length_is_rejected(path, length, sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), path, "a" * length)
    validate_max_length(data, [f"$.{path}"], sf424_mandatory_generated_v3_0)


@pytest.mark.parametrize(
    "path,value",
    [
        ("application.submission_type", "Grant"),
        ("application.frequency.code", "Monthly"),
        ("application.version", "Amendment"),
        ("application.state_review.status", "Available"),
        ("applicant.type.code", "Other"),
    ],
)
def test_answer_outside_listed_choices_is_rejected(path, value, sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), path, value)
    assert _issues(data, sf424_mandatory_generated_v3_0) == [("enum", f"$.{path}")]


@pytest.mark.parametrize(
    "path", ["applicant.congressional_district", "project.congressional_district"]
)
@pytest.mark.parametrize("district", ["MD_007", "MD 007", "md-007"])
def test_congressional_district_must_match_state_and_number(
    path, district, sf424_mandatory_generated_v3_0
):
    data = _set(_full_form(), path, district)
    assert ("pattern", f"$.{path}") in _issues(data, sf424_mandatory_generated_v3_0)


@pytest.mark.parametrize("path", ["budget.funding_sources.federal", "budget.funding_sources.match"])
@pytest.mark.parametrize("amount", ["12,345", "12345.6", "-5", "1234567890123"])
def test_funding_amount_must_be_budget_amount(path, amount, sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), path, amount)
    assert _issues(data, sf424_mandatory_generated_v3_0) == [("pattern", f"$.{path}")]


def test_us_zip_code_needs_all_nine_digits(sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), "applicant.organization.address.zip_code", "21218")
    assert _issues(data, sf424_mandatory_generated_v3_0) == [
        ("minLength", "$.applicant.organization.address.zip_code")
    ]


def test_certification_must_be_agreed(sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), "certification.agree", False)
    assert _issues(data, sf424_mandatory_generated_v3_0) == [("const", "$.certification.agree")]


@pytest.mark.parametrize(
    "path",
    ["application.consolidated_request.answer", "applicant.delinquent_federal_debt.answer"],
)
def test_yes_no_answer_must_be_boolean(path, sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), path, "Yes")
    assert ("type", f"$.{path}") in _issues(data, sf424_mandatory_generated_v3_0)


def test_more_than_100_additional_attachments_are_rejected(sf424_mandatory_generated_v3_0):
    data = _set(_full_form(), "attachments.additional", [ATTACHMENT_IDS[1]] * 101)
    assert _issues(data, sf424_mandatory_generated_v3_0) == [
        ("maxItems", "$.attachments.additional")
    ]
