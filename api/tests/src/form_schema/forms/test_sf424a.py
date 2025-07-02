import pytest

from src.form_schema.forms.sf424a import SF424a_v1_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form

@pytest.fixture
def minimal_valid_activity_line_item_v1_0():
    return {
        "activity_title": "My full activity",
        "assistance_listing_number": "12.345",
        "budget_summary": {
            "total_budget_amount": "0.00",
        },
        "budget_categories": {
            "total_direct_charge_amount": "0.00",
            "total_amount": "0.00",
        },
        "non_federal_resources": {
            "total_amount": "0.00",
        },
        "federal_fund_estimates": {},
    }

@pytest.fixture
def minimal_valid_json_v1_0(minimal_valid_activity_line_item_v1_0):
    return {
        "activity_line_items": [minimal_valid_activity_line_item_v1_0],
        "confirmation": True
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

def test_sf424a_v1_0_too_many_line_items(full_valid_json_v1_0, full_valid_activity_line_item_v1_0):
    data = full_valid_json_v1_0
    data["activity_line_items"] = [full_valid_activity_line_item_v1_0] * 5
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxItems"
    assert validation_issues[0].message == "The array is too long, expected a maximum length of 4"

# TODO
# Partial
# Zero in list
# Required in various places
# * Total sections versus line item
