from datetime import date

import apiflask
import pytest
from freezegun import freeze_time

from src.api.response import ValidationErrorDetail
from src.constants.lookup_constants import ApplicationStatus, CompetitionOpenToApplicant
from src.services.applications.application_validation import (
    ApplicationAction,
    get_application_form_errors,
    validate_application_form,
    validate_application_in_progress,
    validate_competition_open,
)
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OrganizationFactory,
)

VALID_FORM_A_RESPONSE = {"str_a": "text", "obj_a": {"int_a": 4}}

VALID_FORM_B_RESPONSE = {"str_b": "text", "bool_b": True}

VALID_FORM_C_RESPONSE = {"str_c": "text"}


@pytest.fixture
def form_a():
    return FormFactory.build(
        form_name="form_a",
        form_json_schema={
            "type": "object",
            "required": ["str_a", "obj_a"],
            "properties": {
                "str_a": {"type": "string"},
                "obj_a": {
                    "type": "object",
                    "required": ["int_a"],
                    "properties": {
                        "int_a": {"type": "integer"},
                    },
                },
            },
        },
    )


@pytest.fixture
def form_b():
    return FormFactory.build(
        form_name="form_b",
        form_json_schema={
            "type": "object",
            "required": ["str_b"],
            "properties": {
                "str_b": {"type": "string"},
                "bool_b": {"type": "boolean"},
            },
        },
    )


@pytest.fixture
def form_c():
    return FormFactory.build(
        form_name="form_c",
        form_json_schema={
            "type": "object",
            "required": ["str_c"],
            "properties": {"str_c": {"type": "string"}},
        },
    )


@pytest.fixture
def competition(form_a, form_b, form_c):
    comp = CompetitionFactory.build(competition_forms=[])

    # Build doesn't quite connect things for you, so attach the competition forms like this
    # Form A & B are required, C is not
    comp.competition_forms = [
        CompetitionFormFactory.build(competition=comp, form=form_a, is_required=True),
        CompetitionFormFactory.build(competition=comp, form=form_b, is_required=True),
        CompetitionFormFactory.build(competition=comp, form=form_c, is_required=False),
    ]

    return comp


@pytest.fixture
def competition_form_a(competition, form_a):
    return next(filter(lambda c: c.form_id == form_a.form_id, competition.competition_forms), None)


@pytest.fixture
def competition_form_b(competition, form_b):
    return next(filter(lambda c: c.form_id == form_b.form_id, competition.competition_forms), None)


@pytest.fixture
def competition_form_c(competition, form_c):
    return next(filter(lambda c: c.form_id == form_c.form_id, competition.competition_forms), None)


def test_validate_form_all_valid(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response=VALID_FORM_C_RESPONSE,
        is_included_in_submission=True,
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]
    # TODO - add attachment stuff

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )
    assert len(validation_errors) == 0
    assert len(error_detail) == 0


def test_validate_form_all_valid_not_started_optional_form_in_submit(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response={},
        is_included_in_submission=False,
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )
    assert len(validation_errors) == 0
    assert len(error_detail) == 0


def test_validate_forms_missing_all_forms(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    # Add no forms, which will complain about all of them
    application = ApplicationFactory.build(competition=competition, application_forms=[])

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )

    # All forms missing
    assert len(validation_errors) == 3
    for validation_error in validation_errors:
        assert validation_error.message in [
            "Form form_a is missing",
            "Form form_b is missing",
            "Form form_c is missing",
        ]
        assert validation_error.type == ValidationErrorType.MISSING_APPLICATION_FORM
        assert validation_error.field == "form_id"
        assert validation_error.value in [
            competition_form_a.form_id,
            competition_form_b.form_id,
            competition_form_c.form_id,
        ]

    # No error detail because that's only for specific validations
    assert len(error_detail) == 0


def test_validate_forms_not_started_all_forms(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    # Add the forms, but start none of them
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response={},
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response={},
    )
    application_form_c = ApplicationFormFactory.build(
        application=application, competition_form=competition_form_c, application_response={}
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # With the new validation logic:
    # - Required forms (A & B) generate APPLICATION_FORM_VALIDATION errors due to JSON schema validation
    # - Non-required form (C) with empty response and is_included_in_submission=None generates MISSING_INCLUDED_IN_SUBMISSION error
    assert len(validation_errors) == 3

    # Check for APPLICATION_FORM_VALIDATION errors for required forms A and B
    app_form_validation_errors = [
        error
        for error in validation_errors
        if error.type == ValidationErrorType.APPLICATION_FORM_VALIDATION
    ]
    assert len(app_form_validation_errors) == 2

    # Should have one MISSING_INCLUDED_IN_SUBMISSION error for the non-required form
    missing_inclusion_errors = [
        error
        for error in validation_errors
        if error.type == ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
    ]
    assert len(missing_inclusion_errors) == 1

    # Should have error details for forms A and B due to JSON schema validation failures
    assert len(error_detail) == 2


def test_validate_forms_optional_form_with_content_missing_inclusion_flag(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    # Test that optional forms with content require is_included_in_submission to be set
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    # Optional form C has content but is_included_in_submission is None
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response={"str_c": "some content"},
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have 1 MISSING_INCLUDED_IN_SUBMISSION error for the optional form with content
    assert len(validation_errors) == 1
    assert validation_errors[0].type == ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
    assert (
        validation_errors[0].message
        == "is_included_in_submission must be set on all non-required forms"
    )

    # No error details since the forms with content are valid
    assert len(error_detail) == 0


def test_validate_forms_invalid_responses(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response={"str_a": {}, "obj_a": {}},
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response={"str_b": "text", "bool_b": "hello"},
    )
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response={"str_c": False},
        is_included_in_submission=True,  # Set to True so JSON schema validation runs for non-required form
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    app_form_ids = [app_form.application_form_id for app_form in application.application_forms]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )

    assert len(validation_errors) == 3
    for validation_error in validation_errors:
        assert validation_error.message == "The application form has outstanding errors."
        assert validation_error.type == ValidationErrorType.APPLICATION_FORM_VALIDATION
        assert validation_error.field == "application_form_id"
        assert validation_error.value in app_form_ids

    assert len(error_detail) == 3

    form_a_validation_issues = error_detail[str(application_form_a.application_form_id)]
    assert set(form_a_validation_issues) == {
        ValidationErrorDetail(type="type", message="{} is not of type 'string'", field="$.str_a"),
        ValidationErrorDetail(
            type="required", message="'int_a' is a required property", field="$.obj_a.int_a"
        ),
    }

    form_b_validation_issues = error_detail[str(application_form_b.application_form_id)]
    assert set(form_b_validation_issues) == {
        ValidationErrorDetail(
            type="type", message="'hello' is not of type 'boolean'", field="$.bool_b"
        )
    }

    form_c_validation_issues = error_detail[str(application_form_c.application_form_id)]
    assert set(form_c_validation_issues) == {
        ValidationErrorDetail(type="type", message="False is not of type 'string'", field="$.str_c")
    }


# Tests for validate_application_in_progress
def test_validate_application_in_progress_success(enable_factory_create, db_session):
    """Test that validating an application in IN_PROGRESS state succeeds."""
    application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)

    # Should not raise any exception
    validate_application_in_progress(application, ApplicationAction.SUBMIT)


@pytest.mark.parametrize(
    "status",
    [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED],
)
def test_validate_application_in_progress_failure(enable_factory_create, db_session, status):
    """Test that validating an application not in IN_PROGRESS state raises an error."""
    application = ApplicationFactory.create(application_status=status)

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        validate_application_in_progress(application, ApplicationAction.SUBMIT)

    assert excinfo.value.status_code == 403
    assert (
        excinfo.value.message == f"Cannot submit application. It is currently in status: {status}"
    )
    assert (
        excinfo.value.extra_data["validation_issues"][0].type == ValidationErrorType.NOT_IN_PROGRESS
    )


@pytest.mark.parametrize(
    "opening_date,closing_date,grace_period",
    [
        (None, None, None),
        (date(2020, 1, 1), date(2030, 1, 1), None),
        # On opening date
        (date(2025, 1, 15), date(2030, 1, 1), None),
        # On closing date
        (date(2025, 1, 1), date(2025, 1, 15), None),
        # On closing date with grace period
        (date(2025, 1, 1), date(2025, 1, 5), 10),
    ],
)
@freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_validate_competition_open_happy(opening_date, closing_date, grace_period):
    competition = CompetitionFactory.build(
        opening_date=opening_date, closing_date=closing_date, grace_period=grace_period
    )

    try:
        validate_competition_open(competition, ApplicationAction.SUBMIT)
    except Exception:
        pytest.fail("An unexpected exception occurred")


@pytest.mark.parametrize(
    "opening_date,closing_date,grace_period",
    [
        # Closed already
        (date(2020, 1, 1), date(2025, 1, 14), None),
        # Not yet open
        (date(2025, 1, 16), date(2025, 1, 25), None),
    ],
)
@freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_validate_competition_open_error(opening_date, closing_date, grace_period):
    competition = CompetitionFactory.build(
        opening_date=opening_date, closing_date=closing_date, grace_period=grace_period
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        validate_competition_open(competition, ApplicationAction.SUBMIT)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "Cannot submit application - competition is not open"
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.COMPETITION_NOT_OPEN
    )


# Tests for validate_application_form is_included_in_submission logic
def test_validate_application_form_required_form_ignores_is_included_in_submission(form_a):
    """Test that required forms ignore is_included_in_submission and always run validation"""
    competition = CompetitionFactory.build(competition_forms=[])
    competition_form = CompetitionFormFactory.build(
        competition=competition, form=form_a, is_required=True
    )
    competition.competition_forms = [competition_form]

    application = ApplicationFactory.build(competition=competition)

    # Test with is_included_in_submission = None
    application_form = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form,
        application_response={
            "str_a": 123,
            "obj_a": {"int_a": 4},
        },  # str_a should be string, not integer
        is_included_in_submission=None,
    )

    validation_errors = validate_application_form(application_form, ApplicationAction.GET)

    # Should have JSON schema validation error (type error for str_a)
    assert len(validation_errors) == 1
    assert validation_errors[0].type == "type"
    assert "$.str_a" in validation_errors[0].field

    # Test with is_included_in_submission = False (should still validate for required forms)
    application_form.is_included_in_submission = False
    validation_errors = validate_application_form(application_form, ApplicationAction.GET)

    # Should still have JSON schema validation error
    assert len(validation_errors) == 1
    assert validation_errors[0].type == "type"


def test_validate_application_form_non_required_form_null_is_included_in_submission(form_c):
    """Test that non-required forms with null is_included_in_submission get validation error but no JSON schema validation"""
    competition = CompetitionFactory.build(competition_forms=[])
    competition_form = CompetitionFormFactory.build(
        competition=competition, form=form_c, is_required=False
    )
    competition.competition_forms = [competition_form]

    application = ApplicationFactory.build(competition=competition)
    application_form = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form,
        application_response={"str_c": 123},  # Invalid type - should be string, not number
        is_included_in_submission=None,
    )

    validation_errors = validate_application_form(application_form, ApplicationAction.SUBMIT)

    # Should have exactly one validation error for missing is_included_in_submission
    assert len(validation_errors) == 1
    assert validation_errors[0].type == ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
    assert validation_errors[0].field == "is_included_in_submission"
    assert validation_errors[0].value is application_form.application_form_id
    assert (
        validation_errors[0].message
        == "is_included_in_submission must be set on all non-required forms"
    )


def test_validate_application_form_non_required_form_false_is_included_in_submission(form_c):
    """Test that non-required forms with is_included_in_submission=False skip JSON schema validation"""
    competition = CompetitionFactory.build(competition_forms=[])
    competition_form = CompetitionFormFactory.build(
        competition=competition, form=form_c, is_required=False
    )
    competition.competition_forms = [competition_form]

    application = ApplicationFactory.build(competition=competition)
    application_form = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form,
        application_response={"str_c": 123},  # Invalid type - should be string, not number
        is_included_in_submission=False,
    )

    validation_errors = validate_application_form(application_form, ApplicationAction.SUBMIT)

    # Should have no validation errors because JSON schema validation is skipped
    assert len(validation_errors) == 0


def test_validate_application_form_non_required_form_true_is_included_in_submission(form_c):
    """Test that non-required forms with is_included_in_submission=True run JSON schema validation"""
    competition = CompetitionFactory.build(competition_forms=[])
    competition_form = CompetitionFormFactory.build(
        competition=competition, form=form_c, is_required=False
    )
    competition.competition_forms = [competition_form]

    application = ApplicationFactory.build(competition=competition)
    application_form = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form,
        application_response={"str_c": 123},  # Invalid type - should be string, not number
        is_included_in_submission=True,
    )

    validation_errors = validate_application_form(application_form, ApplicationAction.GET)

    # Should have JSON schema validation error
    assert len(validation_errors) == 1
    assert validation_errors[0].type == "type"
    assert "$.str_c" in validation_errors[0].field


def test_validate_application_form_non_required_form_valid_response_true_is_included_in_submission(
    form_c,
):
    """Test that non-required forms with valid response and is_included_in_submission=True pass validation"""
    competition = CompetitionFactory.build(competition_forms=[])
    competition_form = CompetitionFormFactory.build(
        competition=competition, form=form_c, is_required=False
    )
    competition.competition_forms = [competition_form]

    application = ApplicationFactory.build(competition=competition)
    application_form = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form,
        application_response=VALID_FORM_C_RESPONSE,  # Valid response
        is_included_in_submission=True,
    )

    validation_errors = validate_application_form(application_form, ApplicationAction.GET)

    # Should have no validation errors
    assert len(validation_errors) == 0


def test_get_application_form_errors_with_is_included_in_submission_validation(
    competition, competition_form_a, competition_form_b, competition_form_c
):
    """Test that get_application_form_errors includes is_included_in_submission validation errors"""
    application = ApplicationFactory.build(competition=competition, application_forms=[])

    # Form A (required) - valid
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
        is_included_in_submission=None,  # Should be ignored for required forms
    )

    # Form B (required) - invalid response
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response={"str_b": 123},  # Invalid type
        is_included_in_submission=False,  # Should be ignored for required forms
    )

    # Form C (non-required) - null is_included_in_submission
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response={"str_c": 123},  # Invalid type, but should be ignored
        is_included_in_submission=None,
    )

    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have 2 validation errors:
    # 1. Form B has validation issues (JSON schema validation ran despite is_included_in_submission=False because it's required)
    # 2. Form C has is_included_in_submission validation issue
    assert len(validation_errors) == 2

    # Check that we have the right types of errors
    error_types = [error.type for error in validation_errors]
    assert ValidationErrorType.APPLICATION_FORM_VALIDATION in error_types
    assert ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION in error_types

    # Check error details - only Form B should have an entry since Form C's error is not wrapped
    assert len(error_detail) == 1

    # Form B should have JSON schema validation error
    form_b_errors = error_detail[str(application_form_b.application_form_id)]
    assert len(form_b_errors) == 1
    assert form_b_errors[0].type == "type"

    # Form C's MISSING_INCLUDED_IN_SUBMISSION error is returned directly, not in error_detail


@pytest.mark.parametrize(
    "is_included_in_submission,application_action,has_valid_json,expect_included_in_submission_error,expect_validation_issue",
    [
        ### Submit cases
        # Included in submission, Submit, valid JSON - no issues
        (True, ApplicationAction.SUBMIT, True, False, False),
        # Included in submission, Submit, bad JSON - JSON error
        (True, ApplicationAction.SUBMIT, False, False, True),
        # Not included in submission, Submit, valid JSON - no issues
        (False, ApplicationAction.SUBMIT, True, False, False),
        # Not included in submission, Submit, bad JSON - no issues
        (False, ApplicationAction.SUBMIT, False, False, False),
        # None included in submission, Submit, valid JSON - missing included in submission error
        (None, ApplicationAction.SUBMIT, True, True, False),
        # None included in submission, Submit, bad JSON - missing included in submission error
        (None, ApplicationAction.SUBMIT, False, True, False),
        ### Non-submit cases (these all just run validation as normal)
        # Included in submission, not submit, valid JSON - no issues
        (True, ApplicationAction.GET, True, False, False),
        # Included in submission, not submit, bad JSON - JSON error
        (True, ApplicationAction.MODIFY, False, False, True),
        # Not included in submission, not submit, valid JSON - no issues
        (False, ApplicationAction.MODIFY, True, False, False),
        # Not included in submission, not submit, bad JSON - JSON error
        (False, ApplicationAction.GET, False, False, True),
        # None included in submission, not submit, valid JSON - no issues
        (None, ApplicationAction.GET, True, False, False),
        # None included in submission, not submit, bad JSON - JSON error
        (None, ApplicationAction.MODIFY, False, False, True),
    ],
)
def test_validate_is_included_in_submission_behavior(
    competition,
    competition_form_c,
    is_included_in_submission,
    application_action,
    has_valid_json,
    expect_included_in_submission_error,
    expect_validation_issue,
):
    application = ApplicationFactory.build(competition=competition, application_forms=[])

    application_response = VALID_FORM_C_RESPONSE if has_valid_json else {"str_c": 123}

    # Form C (non-required) - has invalid response but null is_included_in_submission
    application_form_c = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_c,
        application_response=application_response,
        is_included_in_submission=is_included_in_submission,
    )
    application.application_forms = [application_form_c]

    validation_errors, error_detail = get_application_form_errors(application, application_action)

    if expect_included_in_submission_error:
        validation_error = next(
            v
            for v in validation_errors
            if v.type == ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
        )
        assert validation_error.field == "is_included_in_submission"
    else:
        for validation_error in validation_errors:
            assert validation_error.type != ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION

    if expect_validation_issue:
        validation_error = next(
            v
            for v in validation_errors
            if v.type == ValidationErrorType.APPLICATION_FORM_VALIDATION
        )
        assert validation_error.field == "application_form_id"
        assert validation_error.value == application_form_c.application_form_id
    else:
        for validation_error in validation_errors:
            assert validation_error.type != ValidationErrorType.APPLICATION_FORM_VALIDATION


@freeze_time("2023-02-20 12:00:00", tz_offset=0)
def test_validate_application_form_submit_post_population(enable_factory_create):
    """Test that post-population occurs and updates application_response during submit action"""
    # Create a form with post-population rules
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {
                "signature_field": {"type": "string"},
                "date_field": {"type": "string"},
                "existing_field": {"type": "string"},
            },
        },
        form_rule_schema={
            "signature_field": {"gg_post_population": {"rule": "signature"}},
            "date_field": {"gg_post_population": {"rule": "current_date"}},
        },
    )

    # Create application and form
    application = ApplicationFactory.create()
    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
        is_required=True,
    )

    # Create application form with initial data (no signature or date fields)
    original_response = {"existing_field": "existing_value"}
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response=original_response.copy(),
    )

    # Validate with SUBMIT action (should trigger post-population)
    validation_errors = validate_application_form(application_form, ApplicationAction.SUBMIT)

    # Verify no validation errors
    assert len(validation_errors) == 0

    # Verify post-population occurred and updated the application_response
    assert "signature_field" in application_form.application_response
    assert "date_field" in application_form.application_response
    assert application_form.application_response["existing_field"] == "existing_value"

    # Verify the signature is populated (defaults to "unknown" since no user in this context)
    assert application_form.application_response["signature_field"] == "unknown"

    # Verify the date is populated with the current date
    assert application_form.application_response["date_field"] == "2023-02-20"


def test_validate_application_form_get_no_post_population(enable_factory_create):
    """Test that post-population does NOT occur during GET action"""
    # Create a form with post-population rules
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {
                "signature_field": {"type": "string"},
                "date_field": {"type": "string"},
                "existing_field": {"type": "string"},
            },
        },
        form_rule_schema={
            "signature_field": {"gg_post_population": {"rule": "signature"}},
            "date_field": {"gg_post_population": {"rule": "current_date"}},
        },
    )

    # Create application and form
    application = ApplicationFactory.create()
    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with initial data (no signature or date fields)
    original_response = {"existing_field": "existing_value"}
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response=original_response.copy(),
    )

    # Validate with GET action (should NOT trigger post-population)
    validation_errors = validate_application_form(application_form, ApplicationAction.GET)

    # Verify no validation errors
    assert len(validation_errors) == 0

    # Verify post-population did NOT occur - application_response should remain unchanged
    assert application_form.application_response == original_response
    assert "signature_field" not in application_form.application_response
    assert "date_field" not in application_form.application_response


def test_validate_application_form_modify_no_post_population(enable_factory_create):
    """Test that post-population does NOT occur during MODIFY action"""
    # Create a form with post-population rules
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {
                "signature_field": {"type": "string"},
                "date_field": {"type": "string"},
                "existing_field": {"type": "string"},
            },
        },
        form_rule_schema={
            "signature_field": {"gg_post_population": {"rule": "signature"}},
            "date_field": {"gg_post_population": {"rule": "current_date"}},
        },
    )

    # Create application and form
    application = ApplicationFactory.create()
    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with initial data (no signature or date fields)
    original_response = {"existing_field": "existing_value"}
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response=original_response.copy(),
    )

    # Validate with MODIFY action (should NOT trigger post-population)
    validation_errors = validate_application_form(application_form, ApplicationAction.MODIFY)

    # Verify no validation errors
    assert len(validation_errors) == 0

    # Verify post-population did NOT occur - application_response should remain unchanged
    assert application_form.application_response == original_response
    assert "signature_field" not in application_form.application_response
    assert "date_field" not in application_form.application_response


# Tests for organization required validation
def test_validate_application_organization_required_missing_get(
    competition, competition_form_a, competition_form_b
):
    """Test that GET endpoint returns a warning when organization is required but missing"""
    # Set competition to only allow organization applications
    competition.open_to_applicants = {CompetitionOpenToApplicant.ORGANIZATION}

    # Create application without organization
    application = ApplicationFactory.build(
        competition=competition, organization_id=None, application_forms=[]
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )

    # Should have 1 validation error for missing organization
    assert len(validation_errors) == 1
    assert validation_errors[0].type == ValidationErrorType.ORGANIZATION_REQUIRED
    assert validation_errors[0].message == "Application requires organization in order to submit"
    assert validation_errors[0].value is None


def test_validate_application_organization_required_present_get(
    competition, competition_form_a, competition_form_b
):
    """Test that GET endpoint passes when organization is required and present"""
    # Set competition to only allow organization applications
    competition.open_to_applicants = {CompetitionOpenToApplicant.ORGANIZATION}

    # Create organization
    organization = OrganizationFactory.build()

    # Create application with organization
    application = ApplicationFactory.build(
        competition=competition,
        organization_id=organization.organization_id,
        organization=organization,
        application_forms=[],
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )

    # Should have no validation errors
    assert len(validation_errors) == 0


def test_validate_application_organization_required_missing_submit(
    competition, competition_form_a, competition_form_b
):
    """Test that SUBMIT endpoint returns error when organization is required but missing"""
    # Set competition to only allow organization applications
    competition.open_to_applicants = {CompetitionOpenToApplicant.ORGANIZATION}

    # Create application without organization
    application = ApplicationFactory.build(
        competition=competition, organization_id=None, application_forms=[]
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have 1 validation error for missing organization
    assert len(validation_errors) == 1
    assert validation_errors[0].type == ValidationErrorType.ORGANIZATION_REQUIRED
    assert validation_errors[0].message == "Application requires organization in order to submit"
    assert validation_errors[0].value is None


def test_validate_application_organization_required_present_submit(
    competition, competition_form_a, competition_form_b
):
    """Test that SUBMIT endpoint passes when organization is required and present"""
    # Set competition to only allow organization applications
    competition.open_to_applicants = {CompetitionOpenToApplicant.ORGANIZATION}

    # Create organization
    organization = OrganizationFactory.build()

    # Create application with organization
    application = ApplicationFactory.build(
        competition=competition,
        organization_id=organization.organization_id,
        organization=organization,
        application_forms=[],
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have no validation errors
    assert len(validation_errors) == 0


def test_validate_application_organization_not_required_individual_allowed(
    competition, competition_form_a, competition_form_b
):
    """Test that validation passes when individual applications are allowed (no organization)"""
    # Set competition to allow individual applications (with or without organization)
    competition.open_to_applicants = {CompetitionOpenToApplicant.INDIVIDUAL}

    # Create application without organization
    application = ApplicationFactory.build(
        competition=competition, organization_id=None, application_forms=[]
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have no validation errors
    assert len(validation_errors) == 0


def test_validate_application_organization_both_allowed_no_org(
    competition, competition_form_a, competition_form_b
):
    """Test that validation passes when both individual and organization are allowed (no organization)"""
    # Set competition to allow both individual and organization applications
    competition.open_to_applicants = {
        CompetitionOpenToApplicant.INDIVIDUAL,
        CompetitionOpenToApplicant.ORGANIZATION,
    }

    # Create application without organization
    application = ApplicationFactory.build(
        competition=competition, organization_id=None, application_forms=[]
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have no validation errors
    assert len(validation_errors) == 0


def test_validate_application_organization_both_allowed_with_org(
    competition, competition_form_a, competition_form_b
):
    """Test that validation passes when both individual and organization are allowed (with organization)"""
    # Set competition to allow both individual and organization applications
    competition.open_to_applicants = {
        CompetitionOpenToApplicant.INDIVIDUAL,
        CompetitionOpenToApplicant.ORGANIZATION,
    }

    # Create organization
    organization = OrganizationFactory.build()

    # Create application with organization
    application = ApplicationFactory.build(
        competition=competition,
        organization_id=organization.organization_id,
        organization=organization,
        application_forms=[],
    )
    application_form_a = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_a,
        application_response=VALID_FORM_A_RESPONSE,
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        competition_form=competition_form_b,
        application_response=VALID_FORM_B_RESPONSE,
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.SUBMIT
    )

    # Should have no validation errors
    assert len(validation_errors) == 0
