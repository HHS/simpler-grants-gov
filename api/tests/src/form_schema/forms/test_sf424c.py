import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation


@pytest.fixture
def minimal_valid_sf424c_v2_0() -> dict:
    # All fields are optional — an empty submission is valid.
    return {}


@pytest.fixture
def one_row_sf424c_v2_0() -> dict:
    return {
        "budget_information": {
            "construction": {
                "total_cost": "500000.00",
                "non_allowable_cost": "50000.00",
                "total_allowable_cost": "450000.00",
            }
        }
    }


@pytest.fixture
def full_valid_sf424c_v2_0() -> dict:
    row = {
        "total_cost": "100000.00",
        "non_allowable_cost": "10000.00",
        "total_allowable_cost": "90000.00",
    }
    calculated_row = {
        "total_cost": "1100000.00",
        "non_allowable_cost": "110000.00",
        "total_allowable_cost": "990000.00",
    }
    return {
        "budget_information": {
            "administrative_and_legal_expenses": row,
            "land_structures_rights_of_way": row,
            "relocation_expenses": row,
            "architectural_engineering_fees": row,
            "other_architectural_engineering_fees": row,
            "project_inspection_fees": row,
            "site_work": row,
            "demolition_and_removal": row,
            "construction": row,
            "equipment": row,
            "miscellaneous": row,
            "subtotal_1": calculated_row,
            "contingencies": row,
            "subtotal_2": calculated_row,
            "project_income": row,
            "total_project_costs": calculated_row,
        },
        "federal_funding": {
            "total_project_costs": "990000.00",
            "federal_percentage_share": 80,
            "federal_funding_share": "792000.00",
        },
    }


def test_sf424c_v2_0_minimal_valid_json(minimal_valid_sf424c_v2_0, sf424c_v2_0):
    """Empty submission is valid — all fields are optional."""
    validation_issues = validate_json_schema_for_form(minimal_valid_sf424c_v2_0, sf424c_v2_0)
    assert len(validation_issues) == 0


def test_sf424c_v2_0_one_row_valid_json(one_row_sf424c_v2_0, sf424c_v2_0):
    """A single partially-filled budget row passes schema validation."""
    validation_issues = validate_json_schema_for_form(one_row_sf424c_v2_0, sf424c_v2_0)
    assert len(validation_issues) == 0


def test_sf424c_v2_0_full_valid_json(full_valid_sf424c_v2_0, sf424c_v2_0):
    """A fully populated form with all rows and federal funding passes schema validation."""
    validation_issues = validate_json_schema_for_form(full_valid_sf424c_v2_0, sf424c_v2_0)
    assert len(validation_issues) == 0


def test_sf424c_v2_0_no_required_fields(sf424c_v2_0):
    """SF-424C has no required fields — an empty dict must pass schema validation."""
    validation_issues = validate_json_schema_for_form({}, sf424c_v2_0)
    assert len(validation_issues) == 0


def test_sf424c_v2_0_negative_monetary_amount(sf424c_v2_0):
    """Negative monetary amounts fail schema validation (caught by pattern constraint on the monetary string format)."""
    data = {
        "budget_information": {
            "construction": {
                "total_cost": "-1.00",
            }
        }
    }
    validation_issues = validate_json_schema_for_form(data, sf424c_v2_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "pattern"
    assert validation_issues[0].field == "$.budget_information.construction.total_cost"


def test_sf424c_v2_0_percentage_out_of_range(sf424c_v2_0):
    """Federal percentage share above 100 fails schema validation with a maximum error."""
    data = {
        "federal_funding": {
            "federal_percentage_share": 101,
        }
    }
    validation_issues = validate_json_schema_for_form(data, sf424c_v2_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maximum"
    assert validation_issues[0].field == "$.federal_funding.federal_percentage_share"


def test_sf424c_v2_0_percentage_negative(sf424c_v2_0):
    """Federal percentage share below 0 fails schema validation with a minimum error."""
    data = {
        "federal_funding": {
            "federal_percentage_share": -1,
        }
    }
    validation_issues = validate_json_schema_for_form(data, sf424c_v2_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minimum"
    assert validation_issues[0].field == "$.federal_funding.federal_percentage_share"


def test_sf424c_v2_0_rules_empty_state(
    enable_factory_create, verify_no_warning_error_logs, sf424c_v2_0
):
    """With no user input, all calculated fields default to '0.00'.

    User-input rows get total_allowable_cost = 0.00 (0 - 0).
    Calculated rows (subtotal_1, subtotal_2, total_project_costs) get all three columns.
    """
    application_form = setup_application_for_form_validation(
        {},
        json_schema=sf424c_v2_0.form_json_schema,
        rule_schema=sf424c_v2_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response

    zero_row = {"total_cost": "0.00", "non_allowable_cost": "0.00", "total_allowable_cost": "0.00"}
    # User-input rows: rules engine writes only total_allowable_cost = total_cost - non_allowable_cost
    user_input_zero = {"total_allowable_cost": "0.00"}
    assert app_json == {
        "budget_information": {
            "administrative_and_legal_expenses": user_input_zero,
            "land_structures_rights_of_way": user_input_zero,
            "relocation_expenses": user_input_zero,
            "architectural_engineering_fees": user_input_zero,
            "other_architectural_engineering_fees": user_input_zero,
            "project_inspection_fees": user_input_zero,
            "site_work": user_input_zero,
            "demolition_and_removal": user_input_zero,
            "construction": user_input_zero,
            "equipment": user_input_zero,
            "miscellaneous": user_input_zero,
            "subtotal_1": zero_row,
            "contingencies": user_input_zero,
            "subtotal_2": zero_row,
            "project_income": user_input_zero,
            "total_project_costs": zero_row,
        },
        "federal_funding": {
            "total_project_costs": "0.00",
            "federal_funding_share": "0.00",
        },
    }


def test_sf424c_v2_0_rules_column_c_calc(
    enable_factory_create, verify_no_warning_error_logs, sf424c_v2_0
):
    """Column C (total_allowable_cost) is auto-calculated as Column A - Column B."""
    data = {
        "budget_information": {
            "construction": {
                "total_cost": "500000.00",
                "non_allowable_cost": "50000.00",
            }
        }
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424c_v2_0.form_json_schema,
        rule_schema=sf424c_v2_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response

    assert app_json["budget_information"]["construction"]["total_allowable_cost"] == "450000.00"


def test_sf424c_v2_0_rules_negative_column_c_blocked(enable_factory_create, sf424c_v2_0):
    """When non_allowable_cost exceeds total_cost, the resulting negative Column C is rejected."""
    data = {
        "budget_information": {
            "construction": {
                "total_cost": "100000.00",
                "non_allowable_cost": "200000.00",
            }
        }
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424c_v2_0.form_json_schema,
        rule_schema=sf424c_v2_0.form_rule_schema,
    )
    validation_errors = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert len(validation_errors) > 0
    error_fields = {e.field for e in validation_errors}
    assert any("total_allowable_cost" in f for f in error_fields)


def test_sf424c_v2_0_rules_calculated_fields_always_populated(
    enable_factory_create, verify_no_warning_error_logs, sf424c_v2_0
):
    """Subtotals and federal funding fields are always populated by the rules engine, even with partial input."""
    data = {
        "budget_information": {
            "construction": {
                "total_cost": "500000.00",
            }
        }
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424c_v2_0.form_json_schema,
        rule_schema=sf424c_v2_0.form_rule_schema,
    )
    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response
    bi = app_json["budget_information"]

    # All three subtotal/total rows must be present and fully populated
    for calc_row in ("subtotal_1", "subtotal_2", "total_project_costs"):
        assert calc_row in bi, f"auto-calculated row '{calc_row}' missing from response"
        for col in ("total_cost", "non_allowable_cost", "total_allowable_cost"):
            assert bi[calc_row][col] is not None, f"{calc_row}.{col} must not be None"

    # Federal funding calculated fields must also be populated
    assert app_json["federal_funding"]["total_project_costs"] is not None
    assert app_json["federal_funding"]["federal_funding_share"] is not None


def test_sf424c_v2_0_rules_subtotals_and_federal_funding(
    enable_factory_create, verify_no_warning_error_logs, sf424c_v2_0
):
    """Verifies the full calculation chain: rows 1-11 sum to subtotal_1, plus contingencies gives subtotal_2, minus project_income gives total_project_costs, and federal_funding_share = total_project_costs * percentage / 100."""
    row = {"total_cost": "100000.00", "non_allowable_cost": "10000.00"}
    data = {
        "budget_information": {
            "administrative_and_legal_expenses": row,
            "land_structures_rights_of_way": row,
            "relocation_expenses": row,
            "architectural_engineering_fees": row,
            "other_architectural_engineering_fees": row,
            "project_inspection_fees": row,
            "site_work": row,
            "demolition_and_removal": row,
            "construction": row,
            "equipment": row,
            "miscellaneous": row,  # 11 rows x 100000 = 1100000, x 10000 = 110000
            "contingencies": {"total_cost": "55000.00", "non_allowable_cost": "5000.00"},
            "project_income": {"total_cost": "10000.00", "non_allowable_cost": "0.00"},
        },
        "federal_funding": {
            "federal_percentage_share": 80,
        },
    }
    application_form = setup_application_for_form_validation(
        data,
        json_schema=sf424c_v2_0.form_json_schema,
        rule_schema=sf424c_v2_0.form_rule_schema,
    )

    validate_application_form(application_form, ApplicationAction.MODIFY)
    app_json = application_form.application_response
    bi = app_json["budget_information"]

    # Row 12 — subtotal_1: sum of rows 1–11
    assert bi["subtotal_1"]["total_cost"] == "1100000.00"
    assert bi["subtotal_1"]["non_allowable_cost"] == "110000.00"
    assert bi["subtotal_1"]["total_allowable_cost"] == "990000.00"

    # Row 14 — subtotal_2: subtotal_1 + contingencies
    assert bi["subtotal_2"]["total_cost"] == "1155000.00"
    assert bi["subtotal_2"]["non_allowable_cost"] == "115000.00"
    assert bi["subtotal_2"]["total_allowable_cost"] == "1040000.00"

    # Row 16 — total_project_costs: subtotal_2 - project_income
    assert bi["total_project_costs"]["total_cost"] == "1145000.00"
    assert bi["total_project_costs"]["non_allowable_cost"] == "115000.00"
    assert bi["total_project_costs"]["total_allowable_cost"] == "1030000.00"

    # Section 17
    assert app_json["federal_funding"]["total_project_costs"] == "1030000.00"
    assert app_json["federal_funding"]["federal_funding_share"] == "824000.00"
