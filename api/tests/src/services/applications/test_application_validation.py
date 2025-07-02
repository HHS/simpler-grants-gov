from datetime import date

import apiflask
import pytest
from freezegun import freeze_time

from src.api.response import ValidationErrorDetail
from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.application_validation import (
    ApplicationAction,
    get_application_form_errors,
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
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]
    # TODO - add attachment stuff

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
    )
    assert len(validation_errors) == 0
    assert len(error_detail) == 0


def test_validate_form_all_valid_not_started_optional_form(
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
        application=application, competition_form=competition_form_c, application_response={}
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(
        application, ApplicationAction.GET
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
        application, ApplicationAction.GET
    )

    # All forms missing
    assert len(validation_errors) == 2
    for validation_error in validation_errors:
        assert validation_error.message in ["Form form_a is required", "Form form_b is required"]
        assert validation_error.type == ValidationErrorType.MISSING_REQUIRED_FORM
        assert validation_error.field == "form_id"
        assert validation_error.value in [competition_form_a.form_id, competition_form_b.form_id]

    # No error detail because that's only for specific validations
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
