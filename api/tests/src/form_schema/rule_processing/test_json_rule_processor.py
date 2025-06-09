import freezegun
import pytest

from src.api.response import ValidationErrorDetail
from src.form_schema.rule_processing.json_rule_context import JsonRuleConfig
from src.form_schema.rule_processing.json_rule_processor import (
    JsonRuleContext,
    process_rule_schema_for_context,
)
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    LinkExternalUserFactory,
    OpportunityFactory,
)


def setup_context(
    json_data: dict,
    rule_schema: dict | None,
    # These are various params that be set in the application
    # if the value is None, we'll just leave it to the factory to set.
    opportunity_number: str | None = None,
    opportunity_title: str | None = None,
    agency_name: str | None = None,
    user_email: str | None = None,
    attachment_ids: list[str] | None = None,
    # Configurational params
    do_pre_population: bool = True,
    do_post_population: bool = True,
    do_field_validation: bool = True,
):
    agency_params = {}
    if agency_name is not None:
        agency_params["agency_name"] = agency_name
    agency = AgencyFactory.create(**agency_params)

    opp_params = {"agency_code": agency.agency_code}
    if opportunity_number is not None:
        opp_params["opportunity_number"] = opportunity_number
    if opportunity_title is not None:
        opp_params["opportunity_title"] = opportunity_title

    opportunity = OpportunityFactory.create(**opp_params)
    competition = CompetitionFactory.create(opportunity=opportunity, competition_forms=[])
    form = FormFactory.create(form_rule_schema=rule_schema)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(competition=competition)
    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response=json_data
    )

    if attachment_ids is not None:
        for attachment_id in attachment_ids:
            ApplicationAttachmentFactory.create(
                application_attachment_id=attachment_id, application=application
            )

    if user_email is not None:
        link_user = LinkExternalUserFactory.create(email=user_email)
        ApplicationUserFactory.create(application=application, user=link_user.user)

    return JsonRuleContext(
        application_form,
        JsonRuleConfig(
            do_pre_population=do_pre_population,
            do_post_population=do_post_population,
            do_field_validation=do_field_validation,
        ),
    )


@freezegun.freeze_time("2023-02-20 12:00:00", tz_offset=0)
def test_process_rule_schema_flat(enable_factory_create):
    rule_schema = {
        "opp_number_field": {
            "gg_pre_population": {"rule": "opportunity_number"},
        },
        "opp_title_field": {"gg_pre_population": {"rule": "opportunity_title"}},
        "agency_name_field": {"gg_pre_population": {"rule": "agency_name"}},
        "date_field": {"gg_post_population": {"rule": "current_date"}},
        "signature_field": {"gg_post_population": {"rule": "signature"}},
        "attachment_id_field": {"gg_validation": {"rule": "attachment"}},
        "missing_attachment_id_field": {"gg_validation": {"rule": "attachment"}},
    }

    context = setup_context(
        {
            "existing_field": "bob",
            "another_existing_field": "smith",
            "date_field": "2020-01-01",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
            "attachment_id_field": "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
        },
        rule_schema=rule_schema,
        opportunity_number="123-ABC-XYZ",
        opportunity_title="Research into advanced research techniques",
        agency_name="Advanced Research Agency",
        user_email="mynewmail@example.com",
        attachment_ids=["d97253ea-d512-4aa8-b3dc-bf75834e1e90"],
    )

    process_rule_schema_for_context(context)

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {
        "existing_field": "bob",
        "another_existing_field": "smith",
        "date_field": "2020-01-01",
        "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
        "attachment_id_field": "d97253ea-d512-4aa8-b3dc-bf75834e1e90",
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
    }

    assert len(context.validation_issues) == 1
    assert context.validation_issues[0] == ValidationErrorDetail(
        type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
        message="Field references application_attachment_id not on the application",
        field="$.missing_attachment_id_field",
        value="2d0f9c59-8af4-4d08-8443-63bf5f888a15",
    )


@freezegun.freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_process_rule_schema_nested(enable_factory_create):

    rule_schema = {
        "opp_number_field": {
            "gg_pre_population": {"rule": "opportunity_number"},
        },
        "nested": {
            "opp_title_field": {"gg_pre_population": {"rule": "opportunity_title"}},
            "missing_attachment_id_field": {"gg_validation": {"rule": "attachment"}},
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
            },
            "attachment_id_field": "9f71990c-1914-4e93-85d1-f2af3c7c1455",
        },
        rule_schema=rule_schema,
        opportunity_number="ABC-XYZ-123",
        opportunity_title="My opportunity title",
        agency_name="My example agency",
        user_email="mymail@example.com",
        attachment_ids=["9f71990c-1914-4e93-85d1-f2af3c7c1455"],
    )

    process_rule_schema_for_context(context)

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {
        "existing_field": "bob",
        "opp_number_field": "something else",
        "nested": {
            "another_nested_field": "X",
            "missing_attachment_id_field": "2d0f9c59-8af4-4d08-8443-63bf5f888a15",
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
            "inner_nested": {"agency_name_field": "My example agency", "date_field": "2025-01-15"},
        },
        "signature_field": "mymail@example.com",
        "attachment_id_field": "9f71990c-1914-4e93-85d1-f2af3c7c1455",
    }

    assert len(context.validation_issues) == 1
    assert context.validation_issues[0] == ValidationErrorDetail(
        type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
        message="Field references application_attachment_id not on the application",
        field="$.nested.missing_attachment_id_field",
        value="2d0f9c59-8af4-4d08-8443-63bf5f888a15",
    )


def test_process_null_rule_schema(enable_factory_create):
    # Null rule schema means nothing will get processed
    context = setup_context({}, None)
    process_rule_schema_for_context(context)

    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []


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
    rule_schema = {"gg_validation": {"rule": "attachment"}}
    context = setup_context({}, rule_schema=rule_schema)
    process_rule_schema_for_context(context)

    # Verify nothing was changed / no issues added
    assert context.application_form.application_response == {}
    assert context.json_data == {}
    assert context.validation_issues == []

    # This ends up not logging any warnings+
    assert [] == caplog.messages
