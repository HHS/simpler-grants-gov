import pytest

from src.form_schema.forms.sf424a import SF424a_v1_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
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
            "applicant_amount": "0.00",
            "state_amount": "0.00",
            "other_amount": "0.00",
            "total_amount": "0.00",
        },
        "federal_fund_estimates": {
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


def test_sf424a_v1_0_minimal_valid_json(minimal_valid_json_v1_0):
    validation_issues = validate_json_schema_for_form(minimal_valid_json_v1_0, SF424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_v1_0_full_valid_json(full_valid_json_v1_0):
    validation_issues = validate_json_schema_for_form(full_valid_json_v1_0, SF424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_v1_0_empty_json():
    validation_issues = validate_json_schema_for_form({}, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = [
        "$.activity_line_items",
        "$.confirmation",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_line_item(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = [{}]
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = ["$.activity_line_items[0].activity_title"]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_no_line_items(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = []
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minItems"
    assert validation_issues[0].message == "[] should be non-empty"
    assert validation_issues[0].field == "$.activity_line_items"


def test_sf424a_v1_0_too_many_line_items(full_valid_json_v1_0, full_valid_activity_line_item_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = [full_valid_activity_line_item_v1_0] * 5
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxItems"
    assert validation_issues[0].message == "The array is too long, expected a maximum length of 4"
    assert validation_issues[0].field == "$.activity_line_items"


def test_sf424a_confirmation_must_be_true(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["confirmation"] = False
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "enum"
    assert validation_issues[0].field == "$.confirmation"
    assert validation_issues[0].message == "False is not one of [True]"


def test_sf424a_allowed_monetary_formats(full_valid_json_v1_0):
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

    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)
    assert len(validation_issues) == 0


def test_sf424a_disallowed_monetary_formats(full_valid_json_v1_0):
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

    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)
    assert len(validation_issues) == 12
    for validation_issue in validation_issues:
        assert validation_issue.type == "pattern"


def test_sf424a_v_1_0_auto_summation_empty_state(
    enable_factory_create, verify_no_warning_error_logs
):
    data = {}
    application_form = setup_application_for_form_validation(
        data,
        json_schema=SF424a_v1_0.form_json_schema,
        rule_schema=SF424a_v1_0.form_rule_schema,
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
        json_schema=SF424a_v1_0.form_json_schema,
        rule_schema=SF424a_v1_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response

    # Add the expected calculated values to the activity line items
    expected_activity_line_item1 = activity_line_item1
    expected_activity_line_item1["budget_summary"]["total_amount"] = "10.00"
    expected_activity_line_item1["budget_categories"]["total_direct_charge_amount"] = "36.00"
    expected_activity_line_item1["budget_categories"]["total_amount"] = "45.00"
    expected_activity_line_item1["non_federal_resources"]["total_amount"] = "6.00"

    expected_activity_line_item2 = activity_line_item2
    expected_activity_line_item2["budget_summary"]["total_amount"] = "76.00"
    expected_activity_line_item2["budget_categories"]["total_direct_charge_amount"] = "11323.00"
    expected_activity_line_item2["budget_categories"]["total_amount"] = "11352.00"
    expected_activity_line_item2["non_federal_resources"]["total_amount"] = "1156.00"

    expected_activity_line_item3 = activity_line_item3
    expected_activity_line_item3["budget_summary"]["total_amount"] = "0.10"
    expected_activity_line_item3["budget_categories"]["total_direct_charge_amount"] = "0.36"
    expected_activity_line_item3["budget_categories"]["total_amount"] = "0.45"
    expected_activity_line_item3["non_federal_resources"]["total_amount"] = "0.06"

    expected_activity_line_item4 = activity_line_item4
    expected_activity_line_item4["budget_summary"]["total_amount"] = "27.03"
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
            "total_amount": "113.13",
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
