import pytest

from src.api.response import ValidationErrorDetail
from src.services.applications.application_validation import get_application_form_errors
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
def competition(form_a, form_b):
    comp = CompetitionFactory.build(competition_forms=[])

    # Build doesn't quite connect things for you, so attach the competition forms like this
    # Form A & B are required, C is not
    comp.competition_forms = [
        CompetitionFormFactory.build(competition=comp, form=form_a, is_required=True),
        CompetitionFormFactory.build(competition=comp, form=form_b, is_required=True),
        CompetitionFormFactory.build(competition=comp, form=form_b, is_required=False),
    ]

    return comp


def test_validate_form_all_valid(competition, form_a, form_b, form_c):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application, form=form_a, application_response=VALID_FORM_A_RESPONSE
    )
    application_form_b = ApplicationFormFactory.build(
        application=application, form=form_b, application_response=VALID_FORM_B_RESPONSE
    )
    application_form_c = ApplicationFormFactory.build(
        application=application, form=form_c, application_response=VALID_FORM_C_RESPONSE
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    validation_errors, error_detail = get_application_form_errors(application)
    assert len(validation_errors) == 0
    assert len(error_detail) == 0


def test_validate_form_all_valid_missing_optional_form(competition, form_a, form_b, form_c):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application, form=form_a, application_response=VALID_FORM_A_RESPONSE
    )
    application_form_b = ApplicationFormFactory.build(
        application=application, form=form_b, application_response=VALID_FORM_B_RESPONSE
    )
    application.application_forms = [application_form_a, application_form_b]

    validation_errors, error_detail = get_application_form_errors(application)
    assert len(validation_errors) == 0
    assert len(error_detail) == 0


def test_validate_forms_missing_required_forms(competition, form_a, form_b):
    # Add no forms, A & B are both required
    application = ApplicationFactory.build(competition=competition, application_forms=[])

    validation_errors, error_detail = get_application_form_errors(application)

    # Two required forms
    assert len(validation_errors) == 2
    for validation_error in validation_errors:
        assert validation_error.message in ["Form form_a is required", "Form form_b is required"]
        assert validation_error.type == ValidationErrorType.MISSING_REQUIRED_FORM
        assert validation_error.field == "form_id"
        assert validation_error.value in [form_a.form_id, form_b.form_id]

    # No error detail because that's only for specific validations
    assert len(error_detail) == 0


def test_validate_forms_invalid_responses(competition, form_a, form_b, form_c):
    application = ApplicationFactory.build(competition=competition, application_forms=[])
    application_form_a = ApplicationFormFactory.build(
        application=application, form=form_a, application_response={"str_a": {}, "obj_a": {}}
    )
    application_form_b = ApplicationFormFactory.build(
        application=application,
        form=form_b,
        application_response={"str_b": "text", "bool_b": "hello"},
    )
    application_form_c = ApplicationFormFactory.build(
        application=application, form=form_c, application_response={}
    )
    application.application_forms = [application_form_a, application_form_b, application_form_c]

    app_form_ids = [app_form.application_form_id for app_form in application.application_forms]

    validation_errors, error_detail = get_application_form_errors(application)

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
            type="required", message="'int_a' is a required property", field="$.obj_a"
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
        ValidationErrorDetail(type="required", message="'str_c' is a required property", field="$")
    }
