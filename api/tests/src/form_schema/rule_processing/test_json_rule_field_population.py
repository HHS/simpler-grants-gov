import pytest
from grants_shared.util.datetime_util import get_now_us_eastern_date

from src.form_schema.rule_processing.json_rule_context import JsonRule
from src.form_schema.rule_processing.json_rule_field_population import (
    POST_POPULATION_MAPPER,
    PRE_POPULATION_MAPPER,
    handle_field_population,
)
from tests.src.form_schema.rule_processing.conftest import setup_context


@pytest.mark.parametrize(
    "rule,setup_params,expected_value",
    [
        ({"rule": "opportunity_number"}, {"opportunity_number": "ABC-XYZ"}, "ABC-XYZ"),
        # Opportunity number always gets a value, this should not ever happen
        ({"rule": "opportunity_number"}, {"opportunity_number": None}, "unknown"),
        (
            {"rule": "opportunity_title"},
            {"opportunity_title": "My opportunity title"},
            "My opportunity title",
        ),
        # Opportunity title always gets a value, this should not ever happen
        (
            {"rule": "opportunity_title"},
            {"opportunity_title": None},
            "unknown",
        ),
        ({"rule": "agency_name"}, {"agency_name": "My Research Agency"}, "My Research Agency"),
        # Agency name falls back to agency code if no agency
        ({"rule": "agency_name"}, {"has_agency": False, "agency_code": "XYZ-ABC"}, "XYZ-ABC"),
        # No agency name / code, falls back to unknown
        ({"rule": "agency_name"}, {"has_agency": False, "agency_code": None}, "unknown"),
        # No organization get a generic INDV UEI
        ({"rule": "uei"}, {"has_organization": False}, "00000000INDV"),
        # Having an organization gets the UEI
        ({"rule": "uei"}, {"has_organization": True, "uei": "123456789"}, "123456789"),
        (
            {"rule": "assistance_listing_number"},
            {"has_assistance_listing_number": True, "assistance_listing_number": "00.123"},
            "00.123",
        ),
        (
            {"rule": "assistance_listing_program_title"},
            {
                "has_assistance_listing_number": True,
                "assistance_listing_program_title": "My program title",
            },
            "My program title",
        ),
        ({"rule": "public_competition_id"}, {"public_competition_id": "ABC123456"}, "ABC123456"),
        (
            {"rule": "competition_title"},
            {"competition_title": "Research Competition"},
            "Research Competition",
        ),
    ],
)
def test_handle_field_population_pre_population(
    rule, setup_params, expected_value, enable_factory_create
):
    context = setup_context({}, {"my_field": rule}, **setup_params)
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    assert context.json_data == {"my_field": expected_value}


@pytest.mark.parametrize(
    "rule,setup_params",
    [
        ({"rule": "assistance_listing_number"}, {"has_assistance_listing_number": False}),
        ({"rule": "assistance_listing_program_title"}, {"has_assistance_listing_number": False}),
        ({"rule": "public_competition_id"}, {"public_competition_id": None}),
        ({"rule": "competition_title"}, {"competition_title": None}),
    ],
)
def test_handle_field_population_pre_population_with_null_value(
    rule, setup_params, enable_factory_create
):
    context = setup_context(
        {"my_field": "this-will-be-removed"}, {"my_field": rule}, **setup_params
    )
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    # Because the value is null, we don't populate it, and actually remove the field by default
    assert context.json_data == {}


@pytest.mark.parametrize(
    "rule,json_data,expected_value",
    [
        # Specifying no fields will get the default of 0
        ({"rule": "sum_monetary", "fields": []}, {}, "0.00"),
        # Specifying fields that aren't set will get the default of 0
        ({"rule": "sum_monetary", "fields": ["x", "y", "z"]}, {}, "0.00"),
        # Can sum fields
        ({"rule": "sum_monetary", "fields": ["x", "y"]}, {"x": "1.43", "y": "2.61"}, "4.04"),
        # Can fetch and sum nested fields
        (
            {"rule": "sum_monetary", "fields": ["x.nested_field", "y.other_field.z"]},
            {"x": {"nested_field": "10.23"}, "y": {"other_field": {"z": "4"}}},
            "14.23",
        ),
        # Can fetch from arrays
        (
            {"rule": "sum_monetary", "fields": ["x[*].z", "y"]},
            {"x": [{"z": "10000.11"}, {"z": "200.33"}], "y": "56.70"},
            "10257.14",
        ),
        # Can fetch from relative paths
        (
            {"rule": "sum_monetary", "fields": ["@THIS.x", "@THIS.y"]},
            {"x": "101.01", "y": "0.23"},
            "101.24",
        ),
        # Can handle negative numbers
        (
            {"rule": "sum_monetary", "fields": ["x", "y"]},
            {"x": "10.01", "y": "-21.50"},
            "-11.49",
        ),
        # Values will be quantized
        (
            {"rule": "sum_monetary", "fields": ["x", "y"]},
            {"x": "123.010000", "y": "456.560000"},
            "579.57",
        ),
    ],
)
def test_handle_field_population_pre_population_sum_monetary(
    rule, json_data, expected_value, enable_factory_create
):
    context = setup_context(json_data, {"my_field": rule})
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    assert context.json_data["my_field"] == expected_value


@pytest.mark.parametrize(
    "rule,json_data",
    [
        ({"rule": "sum_monetary", "fields": ["x"]}, {"x": 100}),
        ({"rule": "sum_monetary", "fields": ["x"]}, {"x": {"y": "200.00"}}),
        ({"rule": "sum_monetary", "fields": ["x"]}, {"x": True}),
        ({"rule": "sum_monetary", "fields": ["x"]}, {"x": "hello"}),
    ],
)
def test_handle_field_population_pre_population_sum_monetary_not_a_monetary_amount(
    rule, json_data, enable_factory_create
):
    # Non-monetary amounts will be skipped resulting in 0.00 for all of these scenarios.
    context = setup_context(json_data, {"my_field": rule})
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    assert context.json_data["my_field"] == "0.00"


@pytest.mark.parametrize(
    "rule,json_data,expected_value",
    [
        # Specifying no fields will get the default of 0
        ({"rule": "subtract_monetary", "fields": []}, {}, "0.00"),
        # Specifying fields that aren't set will get the default of 0
        ({"rule": "subtract_monetary", "fields": ["x", "y", "z"]}, {}, "0.00"),
        # Can subtract the second field from the first
        ({"rule": "subtract_monetary", "fields": ["x", "y"]}, {"x": "5.43", "y": "2.61"}, "2.82"),
        # Every subsequent field is subtracted from the first
        (
            {"rule": "subtract_monetary", "fields": ["x", "y", "z"]},
            {"x": "10.00", "y": "2.50", "z": "1.25"},
            "6.25",
        ),
        # A missing first field (minuend) is treated as 0.00
        ({"rule": "subtract_monetary", "fields": ["x", "y"]}, {"y": "5.00"}, "-5.00"),
        # A missing subsequent field (subtrahend) is treated as 0.00
        ({"rule": "subtract_monetary", "fields": ["x", "y"]}, {"x": "5.00"}, "5.00"),
        # Can fetch and subtract nested fields
        (
            {"rule": "subtract_monetary", "fields": ["x.nested_field", "y.other_field.z"]},
            {"x": {"nested_field": "10.23"}, "y": {"other_field": {"z": "4"}}},
            "6.23",
        ),
        # Can fetch from arrays, array values for a single field are summed first
        (
            {"rule": "subtract_monetary", "fields": ["x[*].z", "y"]},
            {"x": [{"z": "10000.11"}, {"z": "200.33"}], "y": "56.70"},
            "10143.74",
        ),
        # Can fetch from relative paths
        (
            {"rule": "subtract_monetary", "fields": ["@THIS.x", "@THIS.y"]},
            {"x": "101.01", "y": "0.23"},
            "100.78",
        ),
        # Result can be negative
        (
            {"rule": "subtract_monetary", "fields": ["x", "y"]},
            {"x": "10.01", "y": "21.50"},
            "-11.49",
        ),
        # Can handle negative inputs (subtracting a negative adds)
        (
            {"rule": "subtract_monetary", "fields": ["x", "y"]},
            {"x": "10.01", "y": "-21.50"},
            "31.51",
        ),
        # Subtracting equal values results in zero
        (
            {"rule": "subtract_monetary", "fields": ["x", "y"]},
            {"x": "250.00", "y": "250.00"},
            "0.00",
        ),
        # Values will be quantized
        (
            {"rule": "subtract_monetary", "fields": ["x", "y"]},
            {"x": "456.560000", "y": "123.010000"},
            "333.55",
        ),
        # Handles the max range of a monetary field
        (
            {"rule": "subtract_monetary", "fields": ["x", "y"]},
            {"x": "999999999999.99", "y": "0.01"},
            "999999999999.98",
        ),
    ],
)
def test_handle_field_population_pre_population_subtract_monetary(
    rule, json_data, expected_value, enable_factory_create
):
    context = setup_context(json_data, {"my_field": rule})
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    assert context.json_data["my_field"] == expected_value


@pytest.mark.parametrize(
    "rule,json_data",
    [
        ({"rule": "subtract_monetary", "fields": ["x"]}, {"x": 100}),
        ({"rule": "subtract_monetary", "fields": ["x"]}, {"x": {"y": "200.00"}}),
        ({"rule": "subtract_monetary", "fields": ["x"]}, {"x": True}),
        ({"rule": "subtract_monetary", "fields": ["x"]}, {"x": "hello"}),
    ],
)
def test_handle_field_population_pre_population_subtract_monetary_not_a_monetary_amount(
    rule, json_data, enable_factory_create
):
    # Non-monetary amounts will be skipped resulting in 0.00 for all of these scenarios.
    context = setup_context(json_data, {"my_field": rule})
    handle_field_population(
        context,
        JsonRule(handler="gg_pre_population", rule=rule, path=["my_field"]),
        PRE_POPULATION_MAPPER,
    )
    assert context.json_data["my_field"] == "0.00"


@pytest.mark.parametrize(
    "rule,setup_params,expected_value",
    [
        ({"rule": "current_date"}, {}, get_now_us_eastern_date().isoformat()),
        ({"rule": "signature"}, {"user_email": "example@mail.com"}, "example@mail.com"),
        ({"rule": "signature"}, {"user_email": None}, "unknown"),
    ],
)
def test_handle_field_population_post_population(
    rule, setup_params, expected_value, enable_factory_create
):
    context = setup_context({}, {"my_field": rule}, **setup_params)
    handle_field_population(
        context,
        JsonRule(handler="gg_post_population", rule=rule, path=["my_field"]),
        POST_POPULATION_MAPPER,
    )
    assert context.json_data == {"my_field": expected_value}
