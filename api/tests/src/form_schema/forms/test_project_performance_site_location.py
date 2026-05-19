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

_FULL_US_SITE = {
    "submitting_as_individual": False,
    "organization_name": "Example University",
    "uei": "ABCDEFGHIJ12",
    "street1": "123 Research Blvd",
    "street2": "Building 4",
    "city": "Science City",
    "county": "Grant County",
    "state": "CA: California",
    "country": "USA: UNITED STATES",
    "zip_code": "90210-1234",
    "congressional_district": "CA-033",
}

_FULL_INTL_SITE = {
    "submitting_as_individual": False,
    "organization_name": "International Research Institute",
    "uei": "ZZZZZZZZZZ99",
    "street1": "10 Rue de la Paix",
    "street2": "Suite 200",
    "city": "Paris",
    "province": "Île-de-France",
    "country": "FRA: FRANCE",
}

_INDIVIDUAL_US_SITE = {
    "submitting_as_individual": True,
    "street1": "456 Main St",
    "city": "Springfield",
    "country": "USA: UNITED STATES",
    "zip_code": "12345-6789",
    "congressional_district": "IL-013",
    "state": "IL: Illinois",
}

_INDIVIDUAL_INTL_SITE = {
    "submitting_as_individual": True,
    "street1": "1 High Street",
    "city": "London",
    "country": "GBR: UNITED KINGDOM",
}


@pytest.fixture
def full_valid_us(project_performance_site_location_v4_0):
    """Full valid form with a US primary site and one additional US site."""
    return {
        "primary_site": _FULL_US_SITE,
        "additional_sites": [_FULL_US_SITE],
    }


@pytest.fixture
def full_valid_intl(project_performance_site_location_v4_0):
    """Full valid form with an international primary site."""
    return {
        "primary_site": _FULL_INTL_SITE,
    }


@pytest.fixture
def individual_submitter(project_performance_site_location_v4_0):
    """Valid form where applicant submits as an individual (no org name required)."""
    return {
        "primary_site": _INDIVIDUAL_US_SITE,
    }


# ---------------------------------------------------------------------------
# Valid form tests
# ---------------------------------------------------------------------------


def test_full_valid_us(full_valid_us, project_performance_site_location_v4_0):
    validate_required(full_valid_us, [], project_performance_site_location_v4_0)


def test_full_valid_intl(full_valid_intl, project_performance_site_location_v4_0):
    validate_required(full_valid_intl, [], project_performance_site_location_v4_0)


def test_individual_submitter_valid(individual_submitter, project_performance_site_location_v4_0):
    validate_required(individual_submitter, [], project_performance_site_location_v4_0)


def test_minimal_valid_intl(project_performance_site_location_v4_0):
    """Minimal valid form: international primary site, no optional fields."""
    data = {
        "primary_site": _INDIVIDUAL_INTL_SITE,
    }
    validate_required(data, [], project_performance_site_location_v4_0)


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


def test_empty_form_missing_primary_site(project_performance_site_location_v4_0):
    """Top-level primary_site is always required."""
    validate_required({}, ["$.primary_site"], project_performance_site_location_v4_0)


def test_empty_primary_site_missing_required_fields(project_performance_site_location_v4_0):
    """Empty primary_site object triggers required errors for street1, city, country,
    and organization_name (since submitting_as_individual is absent/false)."""
    data = {"primary_site": {}}
    expected = [
        "$.primary_site.street1",
        "$.primary_site.city",
        "$.primary_site.country",
        "$.primary_site.organization_name",
    ]
    validate_required(data, expected, project_performance_site_location_v4_0)


def test_us_primary_site_missing_state_zip_district(project_performance_site_location_v4_0):
    """US primary site without state, zip_code, congressional_district triggers errors."""
    data = {
        "primary_site": {
            "organization_name": "Test Org",
            "street1": "123 Main St",
            "city": "Springfield",
            "country": "USA: UNITED STATES",
        }
    }
    expected = [
        "$.primary_site.state",
        "$.primary_site.zip_code",
        "$.primary_site.congressional_district",
    ]
    validate_required(data, expected, project_performance_site_location_v4_0)


def test_org_name_not_required_when_individual(project_performance_site_location_v4_0):
    """When submitting_as_individual is True, organization_name is not required."""
    data = {
        "primary_site": {
            "submitting_as_individual": True,
            "street1": "123 Main St",
            "city": "Springfield",
            "country": "GBR: UNITED KINGDOM",
        }
    }
    validate_required(data, [], project_performance_site_location_v4_0)


def test_org_name_required_when_not_individual(project_performance_site_location_v4_0):
    """When submitting_as_individual is False, organization_name is required."""
    data = {
        "primary_site": {
            "submitting_as_individual": False,
            "street1": "123 Main St",
            "city": "Springfield",
            "country": "GBR: UNITED KINGDOM",
        }
    }
    validate_required(data, ["$.primary_site.organization_name"], project_performance_site_location_v4_0)


def test_additional_site_missing_required_fields(project_performance_site_location_v4_0):
    """Empty additional site object triggers required errors for street1, city, country."""
    data = {
        "primary_site": _INDIVIDUAL_INTL_SITE,
        "additional_sites": [{}],
    }
    expected = [
        "$.additional_sites[0].street1",
        "$.additional_sites[0].city",
        "$.additional_sites[0].country",
    ]
    validate_required(data, expected, project_performance_site_location_v4_0)


def test_us_additional_site_missing_state_zip_district(project_performance_site_location_v4_0):
    """US additional site without state, zip_code, congressional_district triggers errors."""
    data = {
        "primary_site": _INDIVIDUAL_INTL_SITE,
        "additional_sites": [
            {
                "street1": "789 Oak Ave",
                "city": "Austin",
                "country": "USA: UNITED STATES",
            }
        ],
    }
    expected = [
        "$.additional_sites[0].state",
        "$.additional_sites[0].zip_code",
        "$.additional_sites[0].congressional_district",
    ]
    validate_required(data, expected, project_performance_site_location_v4_0)


# ---------------------------------------------------------------------------
# Min/max length tests
# ---------------------------------------------------------------------------


def test_min_length_violations(project_performance_site_location_v4_0):
    """Empty string values for string fields trigger minLength errors."""
    data = {
        "primary_site": {
            "submitting_as_individual": True,
            "organization_name": "",
            "street1": "",
            "street2": "",
            "city": "",
            "county": "",
            "state": "",
            "province": "",
            "country": "",
            "zip_code": "",
        }
    }
    expected = [
        "$.primary_site.organization_name",
        "$.primary_site.street1",
        "$.primary_site.street2",
        "$.primary_site.city",
        "$.primary_site.county",
        "$.primary_site.state",
        "$.primary_site.province",
        "$.primary_site.country",
        "$.primary_site.zip_code",
    ]
    validate_min_length(data, expected, project_performance_site_location_v4_0)


def test_max_length_violations(project_performance_site_location_v4_0):
    """Values exceeding maxLength trigger maxLength errors."""
    data = {
        "primary_site": {
            "submitting_as_individual": True,
            "organization_name": "A" * 61,
            "uei": "B" * 13,
            "street1": "C" * 56,
            "street2": "D" * 56,
            "city": "E" * 36,
            "county": "F" * 31,
            "state": "G" * 56,
            "province": "H" * 31,
            "country": "I" * 50,
            "zip_code": "J" * 31,
            # congressional_district is excluded here: a too-long value also fails the
            # pattern constraint, which would produce a second error type for the same field.
        }
    }
    expected = [
        "$.primary_site.organization_name",
        "$.primary_site.uei",
        "$.primary_site.street1",
        "$.primary_site.street2",
        "$.primary_site.city",
        "$.primary_site.county",
        "$.primary_site.state",
        "$.primary_site.province",
        "$.primary_site.country",
        "$.primary_site.zip_code",
    ]
    validate_max_length(data, expected, project_performance_site_location_v4_0)


def test_congressional_district_min_length(project_performance_site_location_v4_0):
    """Congressional district shorter than 6 chars fails minLength."""
    data = {
        "primary_site": {
            "submitting_as_individual": True,
            "street1": "123 Main",
            "city": "DC",
            "country": "USA: UNITED STATES",
            "state": "DC: District of Columbia",
            "zip_code": "20001-0001",
            "congressional_district": "CA",  # too short, also fails pattern
        }
    }
    issues = validate_json_schema_for_form(data, project_performance_site_location_v4_0)
    types = {i.type for i in issues}
    fields = {i.field for i in issues}
    assert "$.primary_site.congressional_district" in fields
    assert "minLength" in types


def test_congressional_district_pattern(project_performance_site_location_v4_0):
    """Congressional district without a hyphen at position 3 fails pattern validation."""
    data = {
        "primary_site": {
            "submitting_as_individual": True,
            "street1": "123 Main",
            "city": "DC",
            "country": "USA: UNITED STATES",
            "state": "DC: District of Columbia",
            "zip_code": "20001-0001",
            "congressional_district": "CA0005",  # 6 chars but no hyphen
        }
    }
    issues = validate_json_schema_for_form(data, project_performance_site_location_v4_0)
    types = {i.type for i in issues}
    fields = {i.field for i in issues}
    assert "$.primary_site.congressional_district" in fields
    assert "pattern" in types
