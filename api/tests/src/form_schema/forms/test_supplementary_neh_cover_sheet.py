import pytest

from tests.src.form_schema.forms.conftest import validate_required


@pytest.fixture
def minimal_valid_cover_sheet_v3_0() -> dict:
    return {
        "major_field": "Other: Computer Science",
        "organization_type": "1329: Four-Year College",
        "funding_group": {
            "outright_funds": "1.23",
        },
        "application_info": {
            "additional_funding": False,
            "application_type": "New"
        },
        "primary_project_discipline": "History: Ancient History",
    }

@pytest.fixture
def full_valid_cover_sheet_v3_0() -> dict:
    return {
        "major_field": "Other: Natural Sciences",
        "organization_type": "1329: Four-Year College",
        "funding_group": {
            "outright_funds": "100.00",
            "federal_match": "2",
            "total_from_neh": "102.00",
            "cost_sharing": "55.55",
            "total_project_costs": "157.55",
        },
        "application_info": {
            "additional_funding": True,
            "additional_funding_explanation": "An explanation!",
            "application_type": "Supplement",
            "supplemental_grant_numbers": "ABC-123,XYZ-456"
        },
        "primary_project_discipline": "Interdisciplinary: General",
        "secondary_project_discipline": "Arts: Art History and Criticism",
        "tertiary_project_discipline": "Languages: Romance Languages",
    }

def test_cover_sheet_v3_0_minimal(minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0) -> None:
    validate_required(minimal_valid_cover_sheet_v3_0, [], supplementary_neh_cover_sheet_v3_0)

def test_cover_sheet_v3_0_full(full_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0) -> None:
    validate_required(full_valid_cover_sheet_v3_0, [], supplementary_neh_cover_sheet_v3_0)

def test_cover_sheet_v3_0_empty_json(supplementary_neh_cover_sheet_v3_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.major_field",
        "$.organization_type",
        "$.funding_group",
        "$.application_info",
        "$.primary_project_discipline"
    ]
    validate_required({}, EXPECTED_REQUIRED_FIELDS, supplementary_neh_cover_sheet_v3_0)

def test_cover_sheet_v3_0_empty_nested_json(supplementary_neh_cover_sheet_v3_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.major_field",
        "$.organization_type",
        "$.funding_group.outright_funds",
        "$.funding_group.federal_match",
        "$.application_info.additional_funding",
        "$.application_info.application_type",
        "$.primary_project_discipline"
    ]
    validate_required({"funding_group": {}, "application_info": {}}, EXPECTED_REQUIRED_FIELDS, supplementary_neh_cover_sheet_v3_0)

def test_cover_sheet_v3_0_mutually_required_fields(supplementary_neh_cover_sheet_v3_0):
    # Test that one of outright_funds or federal_match is required
    base_data = {
        "major_field": "Other: Computer Science",
        "organization_type": "1329: Four-Year College",
        "funding_group": {
        },
        "application_info": {
            "additional_funding": False,
            "application_type": "New"
        },
        "primary_project_discipline": "History: Ancient History",
    }
    validate_required(base_data, ["$.funding_group.outright_funds", "$.funding_group.federal_match"], supplementary_neh_cover_sheet_v3_0)

    # Adding one of the two removes all errors
    validate_required(base_data | {"funding_group": {"outright_funds": "1.00"}}, [], supplementary_neh_cover_sheet_v3_0)
    validate_required(base_data | {"funding_group": {"federal_match": "1.00"}}, [], supplementary_neh_cover_sheet_v3_0)
    # Both can be included
    validate_required(base_data | {"funding_group": {"outright_funds": "1.00", "federal_match": "1.00"}}, [], supplementary_neh_cover_sheet_v3_0)

# TODO
# Conditional validation
# Auto-sum
# Field length
# Invalid values
