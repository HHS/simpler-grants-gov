from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.lib.data_factories import setup_application_for_form_validation


@pytest.fixture
def activity_line_item1():
    return {
        "activity_title": "Line1",
        "assistance_listing_number": "12.345",
        "budget_summary": {
            "federal_estimated_unobligated_amount": "1.00",
            "non_federal_estimated_unobligated_amount": "2.00",
            "federal_new_or_revised_amount": "3.00",
            "non_federal_new_or_revised_amount": "4.00",
            "total_amount": "10.00",
        },
        "budget_categories": {
            "personnel_amount": "1.00",
            "fringe_benefits_amount": "2.00",
            "travel_amount": "3.00",
            "equipment_amount": "4.00",
            "supplies_amount": "5.00",
            "contractual_amount": "6.00",
            "construction_amount": "7.00",
            "other_amount": "8.00",
            "total_indirect_charge_amount": "9.00",
            "program_income_amount": "10.00",
        },
        "non_federal_resources": {
            "applicant_amount": "1.00",
            "state_amount": "2.00",
            "other_amount": "3.00",
        },
        "federal_fund_estimates": {
            "first_year_amount": "1.00",
            "second_year_amount": "2.00",
            "third_year_amount": "3.00",
            "fourth_year_amount": "4.00",
        },
    }


@pytest.fixture
def activity_line_item2():
    return {
        "activity_title": "Line2",
        "assistance_listing_number": "12.345",
        "budget_summary": {
            "federal_estimated_unobligated_amount": "10.00",
            "non_federal_estimated_unobligated_amount": "-12.00",
            "federal_new_or_revised_amount": "35.00",
            "non_federal_new_or_revised_amount": "43.00",
            "total_amount": "76.00",
        },
        "budget_categories": {
            "personnel_amount": "100.00",
            "fringe_benefits_amount": "22.00",
            "travel_amount": "35.00",
            "equipment_amount": "74.00",
            "supplies_amount": "85.00",
            "contractual_amount": "1006.00",
            "construction_amount": "-7.00",
            "other_amount": "10008.00",
            "total_indirect_charge_amount": "29.00",
            "program_income_amount": "-10000.00",
        },
        "non_federal_resources": {
            "applicant_amount": "331.00",
            "state_amount": "52.00",
            "other_amount": "773.00",
        },
        "federal_fund_estimates": {
            "first_year_amount": "61.00",
            "second_year_amount": "72.00",
            "third_year_amount": "63.00",
            "fourth_year_amount": "447.00",
        },
    }


@pytest.fixture
def activity_line_item3():
    return {
        "activity_title": "Line3",
        "budget_summary": {
            "federal_estimated_unobligated_amount": "0.01",
            "non_federal_estimated_unobligated_amount": "0.02",
            "federal_new_or_revised_amount": "0.03",
            "non_federal_new_or_revised_amount": "0.04",
            "total_amount": "0.10",
        },
        "budget_categories": {
            "personnel_amount": "0.01",
            "fringe_benefits_amount": "0.02",
            "travel_amount": "0.03",
            "equipment_amount": "0.04",
            "supplies_amount": "0.05",
            "contractual_amount": "0.06",
            "construction_amount": "0.07",
            "other_amount": "0.08",
            "total_indirect_charge_amount": "0.09",
            "program_income_amount": "0.10",
        },
        "non_federal_resources": {
            "applicant_amount": "0.01",
            "state_amount": "0.02",
            "other_amount": "0.03",
        },
        "federal_fund_estimates": {
            "first_year_amount": "0.01",
            "second_year_amount": "0.02",
            "third_year_amount": "0.03",
            "fourth_year_amount": "0.04",
        },
    }


@pytest.fixture
def activity_line_item4():
    # This one only has a handful of values populated
    # Missing values will be treated as 0
    return {
        "activity_title": "Line4",
        "budget_summary": {
            "federal_estimated_unobligated_amount": "14.01",
            "federal_new_or_revised_amount": "13.02",
        },
        "budget_categories": {
            "personnel_amount": "12.03",
            "travel_amount": "11.04",
            "equipment_amount": "10.05",
        },
        "non_federal_resources": {
            "applicant_amount": "9.06",
        },
        "federal_fund_estimates": {
            "first_year_amount": "8.07",
            "second_year_amount": "7.08",
            "fourth_year_amount": "6.09",
        },
    }


@pytest.fixture
def minimal_valid_activity_line_item_v1_0():
    return {"activity_title": "My full activity"}


@pytest.fixture
def minimal_valid_json_v1_0(minimal_valid_activity_line_item_v1_0):
    return {
        "activity_line_items": [minimal_valid_activity_line_item_v1_0],
        "confirmation": True,
    }


@pytest.fixture
def full_valid_activity_line_item_v1_0():
    return {
        "activity_title": "My full activity",
        "assistance_listing_number": "12.345",
        "budget_summary": {
            "federal_estimated_unobligated_amount": "0.00",
            "non_federal_estimated_unobligated_amount": "0.00",
            "federal_new_or_revised_amount": "0.00",
            "non_federal_new_or_revised_amount": "0.00",
            "total_amount": "0.00",
        },
        "budget_categories": {
            "personnel_amount": "0.00",
            "fringe_benefits_amount": "0.00",
            "travel_amount": "0.00",
            "equipment_amount": "0.00",
            "supplies_amount": "0.00",
            "contractual_amount": "0.00",
            "construction_amount": "0.00",
            "other_amount": "0.00",
            "total_direct_charge_amount": "0.00",
            "total_indirect_charge_amount": "0.00",
            "total_amount": "0.00",
            "program_income_amount": "0.00",
        },
        "non_federal_resources": {
            "grant_program": "My full activity",
            "applicant_amount": "0.00",
            "state_amount": "0.00",
            "other_amount": "0.00",
            "total_amount": "0.00",
        },
        "federal_fund_estimates": {
            "grant_program": "My full activity",
            "first_year_amount": "0.00",
            "second_year_amount": "0.00",
            "third_year_amount": "0.00",
            "fourth_year_amount": "0.00",
        },
    }


@pytest.fixture
def full_valid_json_v1_0(full_valid_activity_line_item_v1_0):
    return {
        "activity_line_items": [full_valid_activity_line_item_v1_0],
        "total_budget_summary": {
            "federal_estimated_unobligated_amount": "0.00",
            "non_federal_estimated_unobligated_amount": "0.00",
            "federal_new_or_revised_amount": "0.00",
            "non_federal_new_or_revised_amount": "0.00",
            "total_amount": "0.00",
        },
        "total_budget_categories": {
            "personnel_amount": "0.00",
            "fringe_benefits_amount": "0.00",
            "travel_amount": "0.00",
            "equipment_amount": "0.00",
            "supplies_amount": "0.00",
            "contractual_amount": "0.00",
            "construction_amount": "0.00",
            "other_amount": "0.00",
            "total_direct_charge_amount": "0.00",
            "total_indirect_charge_amount": "0.00",
            "total_amount": "0.00",
            "program_income_amount": "0.00",
        },
        "total_non_federal_resources": {
            "applicant_amount": "0.00",
            "state_amount": "0.00",
            "other_amount": "0.00",
            "total_amount": "0.00",
        },
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": {
                "first_quarter_amount": "0.00",
                "second_quarter_amount": "0.00",
                "third_quarter_amount": "0.00",
                "fourth_quarter_amount": "0.00",
                "total_amount": "0.00",
            },
            "non_federal_forecasted_cash_needs": {
                "first_quarter_amount": "0.00",
                "second_quarter_amount": "0.00",
                "third_quarter_amount": "0.00",
                "fourth_quarter_amount": "0.00",
                "total_amount": "0.00",
            },
            "total_forecasted_cash_needs": {
                "first_quarter_amount": "0.00",
                "second_quarter_amount": "0.00",
                "third_quarter_amount": "0.00",
                "fourth_quarter_amount": "0.00",
                "total_amount": "0.00",
            },
        },
        "total_federal_fund_estimates": {
            "first_year_amount": "0.00",
            "second_year_amount": "0.00",
            "third_year_amount": "0.00",
            "fourth_year_amount": "0.00",
        },
        "direct_charges_explanation": "",
        "indirect_charges_explanation": "",
        "remarks": "",
        "confirmation": True,
    }


def test_sf424a_v1_0_minimal_valid_json(minimal_valid_json_v1_0, sf424a_v1_0):
    validation_issues = validate_json_schema_for_form(minimal_valid_json_v1_0, sf424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_v1_0_full_valid_json(full_valid_json_v1_0, sf424a_v1_0):
    validation_issues = validate_json_schema_for_form(full_valid_json_v1_0, sf424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_v1_0_empty_json(sf424a_v1_0):
    validation_issues = validate_json_schema_for_form({}, sf424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = [
        "$.activity_line_items",
        "$.confirmation",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_line_item(full_valid_json_v1_0, sf424a_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = [{}]
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = ["$.activity_line_items[0].activity_title"]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_row_1_always_required(sf424a_v1_0):
    """Row 1 activity_title is required even when only later rows hold data."""
    data = {
        "activity_line_items": [
            {},
            {"activity_title": "Line2", "budget_summary": {"total_amount": "5.00"}},
        ],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "required"
    assert validation_issues[0].field == "$.activity_line_items[0].activity_title"


def test_sf424a_v1_0_empty_rows_2_4_not_required(sf424a_v1_0):
    """Rows 2-4 without any data do not require activity_title."""
    data = {
        "activity_line_items": [{"activity_title": "Line1"}, {}, {}, {}],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_v1_0_row_required_when_section_a_data_entered(sf424a_v1_0):
    """Row 3 Section A data with an empty Column A errors as required (ticket example)."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {},
            {"budget_summary": {"federal_new_or_revised_amount": "10.00"}},
        ],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "required"
    assert validation_issues[0].field == "$.activity_line_items[2].activity_title"

    # Providing the title clears the error
    data["activity_line_items"][2]["activity_title"] = "Line3"
    assert len(validate_json_schema_for_form(data, sf424a_v1_0)) == 0


def test_sf424a_v1_0_row_required_when_section_b_data_entered(sf424a_v1_0):
    """Row 3 Section B user-entered data with an empty Column A errors as required."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {},
            {
                "budget_categories": {
                    "personnel_amount": "5.00",
                    "total_direct_charge_amount": "5.00",
                    "total_amount": "5.00",
                }
            },
        ],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "required"
    assert validation_issues[0].field == "$.activity_line_items[2].activity_title"


def test_sf424a_v1_0_row_not_required_with_only_autopopulated_totals(sf424a_v1_0):
    """Auto-populated Section B totals alone do not make activity_title required."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {"budget_categories": {"total_direct_charge_amount": "0.00", "total_amount": "0.00"}},
            {"budget_categories": {"total_direct_charge_amount": "0.00", "total_amount": "0.00"}},
        ],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)
    assert len(validation_issues) == 0


@pytest.mark.parametrize(
    "section,data",
    [
        ("non_federal_resources", {"applicant_amount": "5.00", "total_amount": "5.00"}),
        ("non_federal_resources", {"grant_program": "", "state_amount": "5.00"}),
        ("federal_fund_estimates", {"first_year_amount": "5.00"}),
    ],
)
def test_sf424a_v1_0_row_not_required_with_only_section_c_or_e_data(sf424a_v1_0, section, data):
    """Sections C and E have their own optional Column A, so their data alone does not
    make activity_title required. A blank Column A goes out as "N/A" in the XML."""
    data = {
        "activity_line_items": [{"activity_title": "Line1"}, {section: data}],
        "confirmation": True,
    }
    assert validate_json_schema_for_form(data, sf424a_v1_0) == []


def test_sf424a_v1_0_row_not_required_with_only_section_c_total(sf424a_v1_0):
    """The auto-calculated Section C row total alone does not make activity_title required."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {"non_federal_resources": {"total_amount": "0.00"}},
        ],
        "confirmation": True,
    }
    assert validate_json_schema_for_form(data, sf424a_v1_0) == []


def test_sf424a_v1_0_row_required_when_assistance_listing_number_entered(sf424a_v1_0):
    """Section A Column B on its own counts as Section A data for the row."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {"assistance_listing_number": "93.001"},
        ],
        "confirmation": True,
    }
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert [(i.field, i.type) for i in validation_issues] == [
        ("$.activity_line_items[1].activity_title", "required")
    ]


def test_sf424a_v1_0_no_line_items(full_valid_json_v1_0, sf424a_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = []
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minItems"
    assert validation_issues[0].message == "[] should be non-empty"
    assert validation_issues[0].field == "$.activity_line_items"


def test_sf424a_v1_0_too_many_line_items(
    full_valid_json_v1_0, full_valid_activity_line_item_v1_0, sf424a_v1_0
):
    data = full_valid_json_v1_0
    data["activity_line_items"] = [full_valid_activity_line_item_v1_0] * 5
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxItems"
    assert validation_issues[0].message == "The array is too long, expected a maximum length of 4"
    assert validation_issues[0].field == "$.activity_line_items"


def test_sf424a_confirmation_must_be_true(full_valid_json_v1_0, sf424a_v1_0):
    data = full_valid_json_v1_0
    data["confirmation"] = False
    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "enum"
    assert validation_issues[0].field == "$.confirmation"
    assert validation_issues[0].message == "False is not one of [True]"


def test_sf424a_allowed_monetary_formats(full_valid_json_v1_0, sf424a_v1_0):
    """Test the regex for the monetary formats"""
    data = full_valid_json_v1_0
    # All of these are valid formats
    data["total_budget_categories"] = {
        "personnel_amount": "10000000.00",
        "fringe_benefits_amount": "-10.00",
        "travel_amount": "-43560",
        "equipment_amount": "0",
        "supplies_amount": "999.99",
        "contractual_amount": "-1.01",
        "construction_amount": "-100000000.00",
        "other_amount": "3",
        "total_direct_charge_amount": "0.00",
        "total_indirect_charge_amount": "123456789.10",
        "total_amount": "9999.99",
        "program_income_amount": "4243244.23",
    }

    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_disallowed_monetary_formats(full_valid_json_v1_0, sf424a_v1_0):
    """Test the regex for the monetary formats"""
    data = full_valid_json_v1_0
    # All of these are valid formats
    data["total_budget_categories"] = {
        "personnel_amount": "1-0.00",
        "fringe_benefits_amount": "1-1",
        "travel_amount": "hello",
        "equipment_amount": "1.1",
        "supplies_amount": "-1.2",
        "contractual_amount": "10000.000",
        "construction_amount": "-1000.0000",
        "other_amount": "+12",
        "total_direct_charge_amount": "!@!@$!#",
        "total_indirect_charge_amount": "1e12",
        "total_amount": "3.",
        "program_income_amount": "4.x",
    }

    validation_issues = validate_json_schema_for_form(data, sf424a_v1_0)
    assert len(validation_issues) == 12
    for validation_issue in validation_issues:
        assert validation_issue.type == "pattern"


def test_sf424a_v_1_0_auto_summation_empty_state(
    enable_factory_create, verify_no_warning_error_logs, sf424a_v1_0
):
    data = {}
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response
    # Nearly every monetary field outside of the activity line items
    # gets pre-populated as 0.00
    assert app_json == {
        "total_budget_summary": {
            "federal_estimated_unobligated_amount": "0.00",
            "non_federal_estimated_unobligated_amount": "0.00",
            "federal_new_or_revised_amount": "0.00",
            "non_federal_new_or_revised_amount": "0.00",
            "total_amount": "0.00",
        },
        "total_budget_categories": {
            "personnel_amount": "0.00",
            "fringe_benefits_amount": "0.00",
            "travel_amount": "0.00",
            "equipment_amount": "0.00",
            "supplies_amount": "0.00",
            "contractual_amount": "0.00",
            "construction_amount": "0.00",
            "other_amount": "0.00",
            "total_direct_charge_amount": "0.00",
            "total_indirect_charge_amount": "0.00",
            "total_amount": "0.00",
            "program_income_amount": "0.00",
        },
        "total_non_federal_resources": {
            "applicant_amount": "0.00",
            "state_amount": "0.00",
            "other_amount": "0.00",
            "total_amount": "0.00",
        },
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": {
                "total_amount": "0.00",
            },
            "non_federal_forecasted_cash_needs": {
                "total_amount": "0.00",
            },
            "total_forecasted_cash_needs": {
                "first_quarter_amount": "0.00",
                "second_quarter_amount": "0.00",
                "third_quarter_amount": "0.00",
                "fourth_quarter_amount": "0.00",
                "total_amount": "0.00",
            },
        },
        "total_federal_fund_estimates": {
            "first_year_amount": "0.00",
            "second_year_amount": "0.00",
            "third_year_amount": "0.00",
            "fourth_year_amount": "0.00",
        },
    }


def test_sf424a_v_1_0_auto_summation_full_data(
    enable_factory_create,
    activity_line_item1,
    activity_line_item2,
    activity_line_item3,
    activity_line_item4,
    verify_no_warning_error_logs,
    sf424a_v1_0,
):
    data = {
        "activity_line_items": [
            activity_line_item1,
            activity_line_item2,
            activity_line_item3,
            activity_line_item4,
        ],
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": {
                "first_quarter_amount": "12.25",
                "second_quarter_amount": "78.15",
                "third_quarter_amount": "45.35",
                "fourth_quarter_amount": "3.50",
            },
            "non_federal_forecasted_cash_needs": {
                "first_quarter_amount": "67.34",
                "second_quarter_amount": "33.33",
                "third_quarter_amount": "29.33",
                "fourth_quarter_amount": "71.33",
            },
        },
        "confirmation": True,
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response

    # Add the expected calculated values to the activity line items
    expected_activity_line_item1 = activity_line_item1
    expected_activity_line_item1["budget_categories"]["total_direct_charge_amount"] = "36.00"
    expected_activity_line_item1["budget_categories"]["total_amount"] = "45.00"
    expected_activity_line_item1["non_federal_resources"]["total_amount"] = "6.00"

    expected_activity_line_item2 = activity_line_item2
    expected_activity_line_item2["budget_categories"]["total_direct_charge_amount"] = "11323.00"
    expected_activity_line_item2["budget_categories"]["total_amount"] = "11352.00"
    expected_activity_line_item2["non_federal_resources"]["total_amount"] = "1156.00"

    expected_activity_line_item3 = activity_line_item3
    expected_activity_line_item3["budget_categories"]["total_direct_charge_amount"] = "0.36"
    expected_activity_line_item3["budget_categories"]["total_amount"] = "0.45"
    expected_activity_line_item3["non_federal_resources"]["total_amount"] = "0.06"

    expected_activity_line_item4 = activity_line_item4
    expected_activity_line_item4["budget_categories"]["total_direct_charge_amount"] = "33.12"
    expected_activity_line_item4["budget_categories"]["total_amount"] = "33.12"
    expected_activity_line_item4["non_federal_resources"]["total_amount"] = "9.06"

    assert app_json == {
        "activity_line_items": [
            expected_activity_line_item1,
            expected_activity_line_item2,
            expected_activity_line_item3,
            expected_activity_line_item4,
        ],
        "total_budget_summary": {
            "federal_estimated_unobligated_amount": "25.02",
            "non_federal_estimated_unobligated_amount": "-9.98",
            "federal_new_or_revised_amount": "51.05",
            "non_federal_new_or_revised_amount": "47.04",
            "total_amount": "86.10",
        },
        "total_budget_categories": {
            "personnel_amount": "113.04",
            "fringe_benefits_amount": "24.02",
            "travel_amount": "49.07",
            "equipment_amount": "88.09",
            "supplies_amount": "90.05",
            "contractual_amount": "1012.06",
            "construction_amount": "0.07",
            "other_amount": "10016.08",
            "total_direct_charge_amount": "11392.48",
            "total_indirect_charge_amount": "38.09",
            "total_amount": "11430.57",
            "program_income_amount": "-9989.90",
        },
        "total_non_federal_resources": {
            "applicant_amount": "341.07",
            "state_amount": "54.02",
            "other_amount": "776.03",
            "total_amount": "1171.12",
        },
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": {
                "first_quarter_amount": "12.25",
                "second_quarter_amount": "78.15",
                "third_quarter_amount": "45.35",
                "fourth_quarter_amount": "3.50",
                "total_amount": "139.25",
            },
            "non_federal_forecasted_cash_needs": {
                "first_quarter_amount": "67.34",
                "second_quarter_amount": "33.33",
                "third_quarter_amount": "29.33",
                "fourth_quarter_amount": "71.33",
                "total_amount": "201.33",
            },
            "total_forecasted_cash_needs": {
                "first_quarter_amount": "79.59",
                "second_quarter_amount": "111.48",
                "third_quarter_amount": "74.68",
                "fourth_quarter_amount": "74.83",
                "total_amount": "340.58",
            },
        },
        "total_federal_fund_estimates": {
            "first_year_amount": "70.08",
            "second_year_amount": "81.10",
            "third_year_amount": "66.03",
            "fourth_year_amount": "457.13",
        },
        "confirmation": True,
    }


def test_sf424a_v_1_0_conditional_required_end_to_end(enable_factory_create, sf424a_v1_0):
    """Through pre-population, empty rows stay optional and Section A data forces Column A."""
    data = {
        "activity_line_items": [
            {"activity_title": "Line1"},
            {},
            {"budget_summary": {"federal_new_or_revised_amount": "10.00"}},
            {},
        ],
        "confirmation": True,
    }
    app = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )

    validation_issues = validate_application_form(app, ApplicationAction.MODIFY)

    # Pre-population injects budget_categories totals into every row, but only row 3
    # (which has Section A data and no Column A value) is flagged as required.
    required_issues = [i for i in validation_issues if i.type == "required"]
    assert len(required_issues) == 1
    assert required_issues[0].field == "$.activity_line_items[2].activity_title"


def test_sf424a_v_1_0_total_budget_summary_sums_column_g(enable_factory_create, sf424a_v1_0):
    """Row 5 Column G should sum Column G (rows 1-4), not Row 5 Columns C-F."""
    data = {
        "activity_line_items": [
            {
                "budget_summary": {
                    "federal_estimated_unobligated_amount": "1.00",
                    "non_federal_estimated_unobligated_amount": "2.00",
                    "federal_new_or_revised_amount": "3.00",
                    "non_federal_new_or_revised_amount": "4.00",
                    "total_amount": "10.00",
                }
            },
            {
                "budget_summary": {
                    "federal_estimated_unobligated_amount": "10.00",
                    "non_federal_estimated_unobligated_amount": "20.00",
                    "federal_new_or_revised_amount": "30.00",
                    "non_federal_new_or_revised_amount": "40.00",
                    "total_amount": "40.00",
                }
            },
        ],
        "confirmation": True,
    }

    app = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )

    validate_application_form(app, ApplicationAction.MODIFY)
    app_json = app.application_response

    # Individual row G values are preserved unchanged
    assert app_json["activity_line_items"][0]["budget_summary"]["total_amount"] == "10.00"
    assert app_json["activity_line_items"][1]["budget_summary"]["total_amount"] == "40.00"

    # Row 5 G = sum of Column G rows 1-4 (10 + 40 = 50), NOT sum of C-F (1+2+3+4 + 10+20+30+40 = 110)
    assert app_json["total_budget_summary"]["total_amount"] == "50.00"


def test_sf424a_v_1_0_total_budget_summary_column_g_differs_from_cf_sum(
    enable_factory_create, sf424a_v1_0
):
    """For supplemental grants Column G per row is NOT the sum of C-F; Row 5 G must still sum Column G."""
    data = {
        "activity_line_items": [
            {
                "budget_summary": {
                    "federal_estimated_unobligated_amount": "0.00",
                    "non_federal_estimated_unobligated_amount": "0.00",
                    "federal_new_or_revised_amount": "0.00",
                    "non_federal_new_or_revised_amount": "0.00",
                    "total_amount": "999999.00",  # user-entered value unrelated to C-F
                }
            }
        ],
        "confirmation": True,
    }

    app = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )

    validate_application_form(app, ApplicationAction.MODIFY)
    app_json = app.application_response

    # Row 5 G = sum of Column G rows 1-4, which is 999999.00 (not 0.00 from C-F)
    assert app_json["total_budget_summary"]["total_amount"] == "999999.00"


def test_sf424a_v_1_0_saved_form_generates_valid_xml(
    enable_factory_create, verify_no_warning_error_logs, sf424a_v1_0
):
    """Runs the real save path (pre-population fills in the totals, including "0.00" on rows
    left empty) and then generates the XML, the way a submission does.

    Two rows are filled in with whole dollar amounts and Section C is only used on row 1,
    leaving its Column A blank. Section D is left empty, and so are rows 3-4, as the UI
    sends them."""
    row = {
        "assistance_listing_number": "93.001",
        "budget_summary": {"federal_new_or_revised_amount": "11"},
        "budget_categories": {"personnel_amount": "11", "travel_amount": "4"},
        "federal_fund_estimates": {"grant_program": "Funds", "first_year_amount": "11"},
    }
    data = {
        "activity_line_items": [
            row
            | {
                "activity_title": "Activity 1",
                "non_federal_resources": {"applicant_amount": "11"},
            },
            row | {"activity_title": "Activity 2"},
            {},
            {},
        ],
        "confirmation": True,
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424a_v1_0.form_json_schema,
        rule_schema=sf424a_v1_0.form_rule_schema,
    )
    assert validate_application_form(application_form, ApplicationAction.MODIFY) == []

    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_form.application_response,
            transform_config=FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success, response.error_message
    xml_data = response.xml_data

    xsd_dir = (Path(__file__).parents[4] / "src/services/xml_generation/xsds").resolve()
    result = XSDValidator(xsd_dir).validate_xml_for_form(xml_data, "SF424A-V1.0")
    assert result["valid"], result["error_message"]

    ns = {"SF424A": "http://apply.grants.gov/forms/SF424A-V1.0"}
    title_attr = f"{{{ns['SF424A']}}}activityTitle"
    root = lxml_etree.fromstring(xml_data.encode("utf-8"))

    def titles(path: str) -> list[str | None]:
        return [item.get(title_attr) for item in root.findall(path, ns)]

    # Empty rows 3-4 are left out of every section, even though they got "0.00" totals
    assert titles("SF424A:BudgetSummary/SF424A:SummaryLineItem") == ["Activity 1", "Activity 2"]
    assert titles("SF424A:BudgetCategories/SF424A:CategorySet") == ["Activity 1", "Activity 2"]
    # Section C has its own Column A: blank with amounts gives "N/A". Row 2 has nothing in
    # Section C, so like legacy it's an empty line item with the Section A title
    assert titles("SF424A:NonFederalResources/SF424A:ResourceLineItem") == ["N/A", "Activity 2"]
    assert len(root.findall("SF424A:NonFederalResources/SF424A:ResourceLineItem", ns)[1]) == 0
    # Nothing entered in Section D, so it's left out instead of a block of "0.00" totals
    assert root.find("SF424A:BudgetForecastedCashNeeds", ns) is None
    assert titles("SF424A:FederalFundsNeeded/SF424A:FundsLineItem") == ["Funds", "Funds"]
    # Column B goes out as CFDANumber
    assert [
        element.text for element in root.findall(".//SF424A:SummaryLineItem/SF424A:CFDANumber", ns)
    ] == ["93.001", "93.001"]
    # Whole dollar amounts and calculated totals are written with 2 decimals
    category_set = root.find("SF424A:BudgetCategories/SF424A:CategorySet", ns)
    assert category_set.findtext("SF424A:BudgetPersonnelRequestedAmount", namespaces=ns) == "11.00"
    assert category_set.findtext("SF424A:BudgetTotalAmount", namespaces=ns) == "15.00"
