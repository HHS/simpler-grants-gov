import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)


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
            "application_type": "New",
            "primary_project_discipline": "History: Ancient History",
        },
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
            "supplemental_grant_numbers": "ABC-123,XYZ-456",
            "primary_project_discipline": "Interdisciplinary: General",
            "secondary_project_discipline": "Arts: Art History and Criticism",
            "tertiary_project_discipline": "Languages: Romance Languages",
        },
    }


def test_cover_sheet_v3_0_minimal(
    minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
) -> None:
    validate_required(minimal_valid_cover_sheet_v3_0, [], supplementary_neh_cover_sheet_v3_0)


def test_cover_sheet_v3_0_full(
    full_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
) -> None:
    validate_required(full_valid_cover_sheet_v3_0, [], supplementary_neh_cover_sheet_v3_0)


def test_cover_sheet_v3_0_empty_json(supplementary_neh_cover_sheet_v3_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.major_field",
        "$.organization_type",
        "$.funding_group",
        "$.application_info",
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
        "$.application_info.primary_project_discipline",
    ]
    validate_required(
        {"funding_group": {}, "application_info": {}},
        EXPECTED_REQUIRED_FIELDS,
        supplementary_neh_cover_sheet_v3_0,
    )


def test_cover_sheet_v3_0_mutually_required_fields(supplementary_neh_cover_sheet_v3_0):
    # Test that one of outright_funds or federal_match is required
    base_data = {
        "major_field": "Other: Computer Science",
        "organization_type": "1329: Four-Year College",
        "funding_group": {},
        "application_info": {
            "additional_funding": False,
            "application_type": "New",
            "primary_project_discipline": "History: Ancient History",
        },
    }
    validate_required(
        base_data,
        ["$.funding_group.outright_funds", "$.funding_group.federal_match"],
        supplementary_neh_cover_sheet_v3_0,
    )

    # Adding one of the two removes all errors
    validate_required(
        base_data | {"funding_group": {"outright_funds": "1.00"}},
        [],
        supplementary_neh_cover_sheet_v3_0,
    )
    validate_required(
        base_data | {"funding_group": {"federal_match": "1.00"}},
        [],
        supplementary_neh_cover_sheet_v3_0,
    )
    # Both can be included
    validate_required(
        base_data | {"funding_group": {"outright_funds": "1.00", "federal_match": "1.00"}},
        [],
        supplementary_neh_cover_sheet_v3_0,
    )


def test_cover_sheet_v3_0_conditional_fields(
    minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
):
    data = minimal_valid_cover_sheet_v3_0
    data["application_info"]["additional_funding"] = True
    data["application_info"]["application_type"] = "Supplement"

    validate_required(
        data,
        [
            "$.application_info.additional_funding_explanation",
            "$.application_info.supplemental_grant_numbers",
        ],
        supplementary_neh_cover_sheet_v3_0,
    )


def test_cover_sheet_v3_0_min_length(
    minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
):
    data = minimal_valid_cover_sheet_v3_0
    data["application_info"]["additional_funding_explanation"] = ""
    data["application_info"]["supplemental_grant_numbers"] = ""

    validate_min_length(
        data,
        [
            "$.application_info.additional_funding_explanation",
            "$.application_info.supplemental_grant_numbers",
        ],
        supplementary_neh_cover_sheet_v3_0,
    )


def test_cover_sheet_v3_0_max_length(
    minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
):
    data = minimal_valid_cover_sheet_v3_0
    data["application_info"]["additional_funding_explanation"] = "A" * 51
    data["application_info"]["supplemental_grant_numbers"] = "B" * 51

    validate_max_length(
        data,
        [
            "$.application_info.additional_funding_explanation",
            "$.application_info.supplemental_grant_numbers",
        ],
        supplementary_neh_cover_sheet_v3_0,
    )


@pytest.mark.parametrize(
    "value,expected_error_field",
    [
        ({"major_field": "not-a-valid-value"}, "$.major_field"),
        (
            {"application_info": {"primary_project_discipline": "words"}},
            "$.application_info.primary_project_discipline",
        ),
        (
            {"application_info": {"secondary_project_discipline": "xyz123"}},
            "$.application_info.secondary_project_discipline",
        ),
        (
            {
                "application_info": {
                    "tertiary_project_discipline": "Arts: But not really a category"
                }
            },
            "$.application_info.tertiary_project_discipline",
        ),
        # Each of these are values in the field of study list, but not in the project discipline list
        (
            {"application_info": {"primary_project_discipline": "Other: Education"}},
            "$.application_info.primary_project_discipline",
        ),
        (
            {"application_info": {"secondary_project_discipline": "Other: Mathematics"}},
            "$.application_info.secondary_project_discipline",
        ),
        (
            {"application_info": {"tertiary_project_discipline": "Other: Statistics"}},
            "$.application_info.tertiary_project_discipline",
        ),
    ],
)
def test_cover_sheet_v3_0_invalid_enum_values(
    value, expected_error_field, minimal_valid_cover_sheet_v3_0, supplementary_neh_cover_sheet_v3_0
):
    # Deep merge for nested application_info updates
    data = minimal_valid_cover_sheet_v3_0.copy()
    if "application_info" in value:
        data["application_info"] = data["application_info"].copy()
        data["application_info"].update(value["application_info"])
    else:
        data.update(value)

    validation_issues = validate_json_schema_for_form(data, supplementary_neh_cover_sheet_v3_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].field == expected_error_field
    assert validation_issues[0].type == "enum"


@pytest.mark.parametrize(
    "input_values,expected_total_from_neh,expected_total_project_costs",
    [
        ({}, "0.00", "0.00"),
        ({"outright_funds": "1.00"}, "1.00", "1.00"),
        ({"federal_match": "2.55"}, "2.55", "2.55"),
        ({"cost_sharing": "3.33"}, "0.00", "3.33"),
        (
            {"outright_funds": "1.00", "federal_match": "2.55", "cost_sharing": "3.33"},
            "3.55",
            "6.88",
        ),
    ],
)
def test_cover_sheet_v3_0_auto_sum(
    enable_factory_create,
    input_values,
    expected_total_from_neh,
    expected_total_project_costs,
    minimal_valid_cover_sheet_v3_0,
    supplementary_neh_cover_sheet_v3_0,
):
    data = minimal_valid_cover_sheet_v3_0
    data["funding_group"] = input_values

    application_form = setup_application_for_form_validation(
        data,
        json_schema=supplementary_neh_cover_sheet_v3_0.form_json_schema,
        rule_schema=supplementary_neh_cover_sheet_v3_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    assert (
        application_form.application_response["funding_group"]["total_from_neh"]
        == expected_total_from_neh
    )
    assert (
        application_form.application_response["funding_group"]["total_project_costs"]
        == expected_total_project_costs
    )
