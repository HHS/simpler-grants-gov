import logging

import freezegun
import pytest

from src.api.response import ValidationErrorDetail
from src.form_schema.rule_processing.json_rule_processor import process_rule_schema_for_context
from src.validation.validation_constants import ValidationErrorType
from tests.src.form_schema.rule_processing.conftest import setup_context

ARRAY_RULE_SCHEMA = {
    "my_array_field": {
        "gg_type": "array",
        "nested_field": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["@THIS.x", "@THIS.y", "@THIS.z"],
            }
        },
    },
    "x": {"gg_pre_population": {"rule": "sum_monetary", "fields": ["my_array_field[*].x"]}},
    "y": {"gg_pre_population": {"rule": "sum_monetary", "fields": ["my_array_field[*].y"]}},
    "z": {"gg_pre_population": {"rule": "sum_monetary", "fields": ["my_array_field[*].z"]}},
    "total_field": {
        "gg_pre_population": {
            "rule": "sum_monetary",
            "fields": ["my_array_field[*].nested_field"],
            "order": 2,
        }
    },
}


@freezegun.freeze_time("2023-02-20 12:00:00", tz_offset=0)
def test_process_rule_schema_flat(enable_factory_create):
    rule_schema = {
        # Pre populated
        "opp_number_field": {
            "gg_pre_population": {"rule": "opportunity_number"},
        },
        "opp_title_field": {"gg_pre_population": {"rule": "opportunity_title"}},
        "agency_name_field": {"gg_pre_population": {"rule": "agency_name"}},
        "uei_field": {"gg_pre_population": {"rule": "uei"}},
        "assistance_listing_number_field": {
            "gg_pre_population": {"rule": "assistance_listing_number"}
        },
        "assistance_listing_program_title_field": {
            "gg_pre_population": {"rule": "assistance_listing_program_title"}
        },
        "public_competition_id_field": {"gg_pre_population": {"rule": "public_competition_id"}},
        "competition_title_field": {"gg_pre_population": {"rule": "competition_title"}},
        # Post populated
        "date_field": {"gg_post_population": {"rule": "current_date"}},
        "signature_field": {"gg_post_population": {"rule": "signature"}},
        # Validation
        "attachment_id_field": {"gg_validation": {"rule": "attachment"}},
        "attachment_id_list_field": {"gg_validation": {"rule": "attachment"}},
        "missing_attachment_id_field": {"gg_validation": {"rule": "attachment"}},
        "missing_attachment_id_list_field": {"gg_validation": {"rule": "attachment"}},
    }

    context = setup_context(
        {
            "existing_field": "bob",
            "another_existing_field": "smith",
            "date_field": "2020-01-01",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
            "attachment_id_field": "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "attachment_id_list_field": [
                "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
                "b27b22d0-0dfe-4e85-a509-045e6a447824",
            ],
            "missing_attachment_id_list_field": [
                "464ac16b-adcc-41d8-aac1-0b0875b8de80",
                "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
                "1d532d43-ac3f-4b28-bdaa-b5afa04640c1",
            ],
        },
        rule_schema=rule_schema,
        opportunity_number="123-ABC-XYZ",
        opportunity_title="Research into advanced research techniques",
        agency_name="Advanced Research Agency",
        user_email="mynewmail@example.com",
        attachment_ids=[
            "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "b27b22d0-0dfe-4e85-a509-045e6a447824",
        ],
        # Add a deleted attachment, it won't be seen by the validator
        # so will be seen as missing
        deleted_attachment_ids=["1d532d43-ac3f-4b28-bdaa-b5afa04640c1"],
        has_organization=True,
        uei="UEI12345",
        has_assistance_listing_number=True,
        assistance_listing_number="12.345",
        assistance_listing_program_title="My example program title",
        public_competition_id="4567",
        competition_title="My competition title",
    )

    process_rule_schema_for_context(context)

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {
        "existing_field": "bob",
        "another_existing_field": "smith",
        "date_field": "2020-01-01",
        "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        "attachment_id_field": "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
        "attachment_id_list_field": [
            "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "b27b22d0-0dfe-4e85-a509-045e6a447824",
        ],
        "missing_attachment_id_list_field": [
            "464ac16b-adcc-41d8-aac1-0b0875b8de80",
            "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "1d532d43-ac3f-4b28-bdaa-b5afa04640c1",
        ],
    }
    # The json data is modified with the new fields populated
    assert context.json_data == {
        "existing_field": "bob",
        "another_existing_field": "smith",
        "opp_number_field": "123-ABC-XYZ",
        "opp_title_field": "Research into advanced research techniques",
        "agency_name_field": "Advanced Research Agency",
        "date_field": "2023-02-20",
        "signature_field": "mynewmail@example.com",
        "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        "attachment_id_field": "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
        "attachment_id_list_field": [
            "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "b27b22d0-0dfe-4e85-a509-045e6a447824",
        ],
        "missing_attachment_id_list_field": [
            "464ac16b-adcc-41d8-aac1-0b0875b8de80",
            "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
            "1d532d43-ac3f-4b28-bdaa-b5afa04640c1",
        ],
        "uei_field": "UEI12345",
        "assistance_listing_number_field": "12.345",
        "assistance_listing_program_title_field": "My example program title",
        "public_competition_id_field": "4567",
        "competition_title_field": "My competition title",
    }

    assert len(context.validation_issues) == 3
    assert context.validation_issues == [
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.missing_attachment_id_field",
            value="2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        ),
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.missing_attachment_id_list_field[0]",
            value="464ac16b-adcc-41d8-aac1-0b0875b8de80",
        ),
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.missing_attachment_id_list_field[2]",
            value="1d532d43-ac3f-4b28-bdaa-b5afa04640c1",
        ),
    ]


@freezegun.freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_process_rule_schema_nested(enable_factory_create):

    rule_schema = {
        "opp_number_field": {
            "gg_pre_population": {"rule": "opportunity_number"},
        },
        "nested": {
            "opp_title_field": {"gg_pre_population": {"rule": "opportunity_title"}},
            "missing_attachment_id_field": {"gg_validation": {"rule": "attachment"}},
            "attachment_id_list_field": {"gg_validation": {"rule": "attachment"}},
            "missing_attachment_id_list_field": {"gg_validation": {"rule": "attachment"}},
            "inner_nested": {
                "agency_name_field": {"gg_pre_population": {"rule": "agency_name"}},
                "date_field": {"gg_post_population": {"rule": "current_date"}},
            },
        },
        "signature_field": {"gg_post_population": {"rule": "signature"}},
        "attachment_id_field": {"gg_validation": {"rule": "attachment"}},
    }

    context = setup_context(
        {
            "existing_field": "bob",
            "opp_number_field": "something else",
            "nested": {
                "another_nested_field": "X",
                "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
                "attachment_id_list_field": [
                    "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                    "ff94643c-e032-4b7e-8c19-228d9d771a50",
                ],
                "missing_attachment_id_list_field": [
                    "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                    "0c19062d-4115-4c9e-89d8-57c49e9f3770",
                    "e11d9e8b-959d-4898-b9d0-9a91496876b3",
                ],
            },
            "attachment_id_field": "9f71990c-1914-4e93-85d1-f2af3c7c1455",
        },
        rule_schema=rule_schema,
        opportunity_number="ABC-XYZ-123",
        opportunity_title="My opportunity title",
        agency_name="My example agency",
        user_email="mymail@example.com",
        attachment_ids=[
            "9f71990c-1914-4e93-85d1-f2af3c7c1455",
            "ff94643c-e032-4b7e-8c19-228d9d771a50",
        ],
    )

    process_rule_schema_for_context(context)

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {
        "existing_field": "bob",
        "opp_number_field": "something else",
        "nested": {
            "another_nested_field": "X",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
            "attachment_id_list_field": [
                "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                "ff94643c-e032-4b7e-8c19-228d9d771a50",
            ],
            "missing_attachment_id_list_field": [
                "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                "0c19062d-4115-4c9e-89d8-57c49e9f3770",
                "e11d9e8b-959d-4898-b9d0-9a91496876b3",
            ],
        },
        "attachment_id_field": "9f71990c-1914-4e93-85d1-f2af3c7c1455",
    }
    # The json data is modified with the new fields populated
    assert context.json_data == {
        "existing_field": "bob",
        "opp_number_field": "ABC-XYZ-123",
        "nested": {
            "opp_title_field": "My opportunity title",
            "another_nested_field": "X",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
            "attachment_id_list_field": [
                "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                "ff94643c-e032-4b7e-8c19-228d9d771a50",
            ],
            "missing_attachment_id_list_field": [
                "9f71990c-1914-4e93-85d1-f2af3c7c1455",
                "0c19062d-4115-4c9e-89d8-57c49e9f3770",
                "e11d9e8b-959d-4898-b9d0-9a91496876b3",
            ],
            "inner_nested": {"agency_name_field": "My example agency", "date_field": "2025-01-15"},
        },
        "signature_field": "mymail@example.com",
        "attachment_id_field": "9f71990c-1914-4e93-85d1-f2af3c7c1455",
    }

    assert len(context.validation_issues) == 3
    assert context.validation_issues == [
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.nested.missing_attachment_id_field",
            value="2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        ),
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.nested.missing_attachment_id_list_field[1]",
            value="0c19062d-4115-4c9e-89d8-57c49e9f3770",
        ),
        ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.nested.missing_attachment_id_list_field[2]",
            value="e11d9e8b-959d-4898-b9d0-9a91496876b3",
        ),
    ]


@pytest.mark.parametrize(
    "json_data,expected_result",
    [
        # Empty input JSON
        ({}, {"x": "0.00", "y": "0.00", "z": "0.00", "total_field": "0.00"}),
        # Empty array field is basically same as empty JSON
        (
            {"my_array_field": []},
            {"my_array_field": [], "x": "0.00", "y": "0.00", "z": "0.00", "total_field": "0.00"},
        ),
        # Several empty objects in array get a 0 total added
        (
            {"my_array_field": [{}, {}, {}]},
            {
                "my_array_field": [
                    {"nested_field": "0.00"},
                    {"nested_field": "0.00"},
                    {"nested_field": "0.00"},
                ],
                "x": "0.00",
                "y": "0.00",
                "z": "0.00",
                "total_field": "0.00",
            },
        ),
        # Mostly populated JSON
        (
            {
                "my_array_field": [
                    {"x": "1.00", "y": "2.00", "z": "3.00"},
                    {"x": "2.33"},
                    {"y": "4.10", "z": "1.11"},
                ]
            },
            {
                "my_array_field": [
                    {"x": "1.00", "y": "2.00", "z": "3.00", "nested_field": "6.00"},
                    {"x": "2.33", "nested_field": "2.33"},
                    {"y": "4.10", "z": "1.11", "nested_field": "5.21"},
                ],
                "x": "3.33",
                "y": "6.10",
                "z": "4.11",
                "total_field": "13.54",
            },
        ),
    ],
)
def test_process_rule_schema_with_arrays(enable_factory_create, json_data, expected_result):

    context = setup_context(json_data, rule_schema=ARRAY_RULE_SCHEMA)

    process_rule_schema_for_context(context)
    assert context.json_data == expected_result


def test_process_null_rule_schema(enable_factory_create):
    # Null rule schema means nothing will get processed
    context = setup_context({}, None)
    process_rule_schema_for_context(context)

    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []
    assert context.rules == []


@pytest.mark.parametrize(
    "do_pre_population, do_post_population, do_field_validation",
    [
        (True, False, False),
        (False, True, False),
        (False, False, True),
        (True, False, True),
        (False, False, False),
    ],
)
def test_configurations(
    enable_factory_create, do_pre_population, do_post_population, do_field_validation
):
    rule_schema = {
        "opp_number_field": {"gg_pre_population": {"rule": "opportunity_number"}},
        "signature_field": {"gg_post_population": {"rule": "signature"}},
        "missing_attachment_id_field": {"gg_validation": {"rule": "attachment"}},
    }

    context = setup_context(
        {
            "opp_number_field": "original value",
            "signature_field": "original value",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        },
        rule_schema=rule_schema,
        opportunity_number="CHANGED-OPP-NUMBER",
        user_email="CHANGED@example.com",
        attachment_ids=[],
        do_pre_population=do_pre_population,
        do_post_population=do_post_population,
        do_field_validation=do_field_validation,
    )

    process_rule_schema_for_context(context)

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {
        "opp_number_field": "original value",
        "signature_field": "original value",
        "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
    }

    expected_json_data = {
        "opp_number_field": "original value",
        "signature_field": "original value",
        "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
    }
    if do_pre_population:
        expected_json_data["opp_number_field"] = "CHANGED-OPP-NUMBER"
    if do_post_population:
        expected_json_data["signature_field"] = "CHANGED@example.com"

    # The json data is modified with the new fields populated
    assert context.json_data == expected_json_data

    if do_field_validation:
        assert len(context.validation_issues) == 1
        assert context.validation_issues[0] == ValidationErrorDetail(
            type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
            message="Field references application_attachment_id not on the application",
            field="$.missing_attachment_id_field",
            value="2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        )
    else:
        assert len(context.validation_issues) == 0


def test_bad_rule_schema_no_rule(enable_factory_create, caplog):
    rule_schema = {"my_field": {"gg_pre_population": {}}}
    context = setup_context({}, rule_schema=rule_schema)
    process_rule_schema_for_context(context)

    # Verify nothing was changed
    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []

    # Verify we logged a warning for a bad rule
    assert "Rule code is null for configuration" in caplog.messages


def test_bad_rule_schema_rule_not_configured(enable_factory_create, caplog):
    rule_schema = {"my_field": {"gg_post_population": {"rule": "not-a-real-rule"}}}
    context = setup_context({}, rule_schema=rule_schema)
    process_rule_schema_for_context(context)

    # Verify nothing was changed
    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []

    # Verify we logged a warning for a bad rule
    assert "Rule code does not have a defined mapper" in caplog.messages


def test_bad_rule_schema_at_top_level_population(enable_factory_create, caplog):
    rule_schema = {"gg_post_population": {"rule": "current_date"}}
    context = setup_context({}, rule_schema=rule_schema)
    process_rule_schema_for_context(context)

    # Verify nothing was changed
    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []

    # Verify we logged a warning for a bad rule
    assert "Failed to handle field population" in caplog.messages


def test_bad_rule_schema_at_top_level_validation(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    rule_schema = {"gg_validation": {"rule": "attachment"}}
    context = setup_context({}, rule_schema=rule_schema)
    process_rule_schema_for_context(context)

    # Verify nothing was changed / no issues added
    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []

    # Verify we logged a message for an unexpected type
    assert "Unexpected type found when validating attachment ID: dict" in caplog.messages
