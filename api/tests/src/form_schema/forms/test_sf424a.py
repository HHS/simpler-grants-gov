import pytest

from src.form_schema.forms.sf424a import SF424a_v1_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


@pytest.fixture
def minimal_valid_activity_line_item_v1_0():
    return {
        "activity_title": "My full activity",
        "assistance_listing_number": "12.345",
        "budget_summary": {
            "total_amount": "0.00",
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
        "total_budget_summary": {
            "federal_estimated_unobligated_amount": "0.00",
            "non_federal_estimated_unobligated_amount": "0.00",
            "federal_new_or_revised_amount": "0.00",
            "non_federal_new_or_revised_amount": "0.00",
            "total_amount": "0.00",
        },
        "total_budget_categories": {
            "total_direct_charge_amount": "0.00",
            "total_amount": "0.00",
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
                "total_amount": "0.00",
            },
        },
        "total_federal_fund_estimates": {
            "first_year_amount": "0.00",
            "second_year_amount": "0.00",
            "third_year_amount": "0.00",
            "fourth_year_amount": "0.00",
        },
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
        "$.total_budget_summary",
        "$.total_budget_categories",
        "$.total_non_federal_resources",
        "$.forecasted_cash_needs",
        "$.total_federal_fund_estimates",
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

    EXPECTED_REQUIRED_FIELDS = [
        "$.activity_line_items[0].activity_title",
        "$.activity_line_items[0].assistance_listing_number",
        "$.activity_line_items[0].budget_summary",
        "$.activity_line_items[0].budget_categories",
        "$.activity_line_items[0].non_federal_resources",
        "$.activity_line_items[0].federal_fund_estimates",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_line_item_budget_summary(
    full_valid_json_v1_0, minimal_valid_activity_line_item_v1_0
):
    line_item_data = minimal_valid_activity_line_item_v1_0
    line_item_data["budget_summary"] = {}

    data = full_valid_json_v1_0
    data["activity_line_items"] = [line_item_data]
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = ["$.activity_line_items[0].budget_summary.total_amount"]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_line_item_budget_categories(
    full_valid_json_v1_0, minimal_valid_activity_line_item_v1_0
):
    line_item_data = minimal_valid_activity_line_item_v1_0
    line_item_data["budget_categories"] = {}

    data = full_valid_json_v1_0
    data["activity_line_items"] = [line_item_data]
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = [
        "$.activity_line_items[0].budget_categories.total_direct_charge_amount",
        "$.activity_line_items[0].budget_categories.total_amount",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_line_item_non_federal_resources(
    full_valid_json_v1_0, minimal_valid_activity_line_item_v1_0
):
    line_item_data = minimal_valid_activity_line_item_v1_0
    line_item_data["non_federal_resources"] = {}

    data = full_valid_json_v1_0
    data["activity_line_items"] = [line_item_data]
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = ["$.activity_line_items[0].non_federal_resources.total_amount"]

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


def test_sf424a_v1_0_empty_totals(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["total_budget_summary"] = {}
    data["total_budget_categories"] = {}
    data["total_non_federal_resources"] = {}
    data["forecasted_cash_needs"] = {}
    data["total_federal_fund_estimates"] = {}
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = [
        "$.total_budget_summary.federal_estimated_unobligated_amount",
        "$.total_budget_summary.non_federal_estimated_unobligated_amount",
        "$.total_budget_summary.federal_new_or_revised_amount",
        "$.total_budget_summary.non_federal_new_or_revised_amount",
        "$.total_budget_summary.total_amount",
        "$.total_budget_categories.total_direct_charge_amount",
        "$.total_budget_categories.total_amount",
        "$.total_non_federal_resources.applicant_amount",
        "$.total_non_federal_resources.state_amount",
        "$.total_non_federal_resources.other_amount",
        "$.total_non_federal_resources.total_amount",
        "$.forecasted_cash_needs.federal_forecasted_cash_needs",
        "$.forecasted_cash_needs.non_federal_forecasted_cash_needs",
        "$.forecasted_cash_needs.total_forecasted_cash_needs",
        "$.total_federal_fund_estimates.first_year_amount",
        "$.total_federal_fund_estimates.second_year_amount",
        "$.total_federal_fund_estimates.third_year_amount",
        "$.total_federal_fund_estimates.fourth_year_amount",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424a_v1_0_empty_forecasted_cash_needs(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["forecasted_cash_needs"] = {
        "federal_forecasted_cash_needs": {},
        "non_federal_forecasted_cash_needs": {},
        "total_forecasted_cash_needs": {},
    }
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    EXPECTED_REQUIRED_FIELDS = [
        "$.forecasted_cash_needs.federal_forecasted_cash_needs.total_amount",
        "$.forecasted_cash_needs.non_federal_forecasted_cash_needs.total_amount",
        "$.forecasted_cash_needs.total_forecasted_cash_needs.total_amount",
    ]

    assert len(validation_issues) == len(EXPECTED_REQUIRED_FIELDS)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in EXPECTED_REQUIRED_FIELDS


def test_sf424_confirmation_must_be_true(full_valid_json_v1_0):
    data = full_valid_json_v1_0
    data["confirmation"] = False
    validation_issues = validate_json_schema_for_form(data, SF424a_v1_0)

    assert len(validation_issues) == 1
    assert validation_issues[0].type == "enum"
    assert validation_issues[0].field == "$.confirmation"
    assert validation_issues[0].message == "False is not one of [True]"
