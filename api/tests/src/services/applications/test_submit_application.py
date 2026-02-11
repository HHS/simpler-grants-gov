import uuid
from datetime import timedelta

import apiflask.exceptions
import pytest

from src.constants.lookup_constants import ApplicationStatus, CompetitionOpenToApplicant, Privilege
from src.form_schema.rule_processing.json_rule_field_population import UNKNOWN_VALUE
from src.services.applications.submit_application import submit_application
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    LinkExternalUserFactory,
    RoleFactory,
    UserFactory,
)

# Simple JSON schema used for tests below
SIMPLE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "maximum": 200},
    },
    "required": ["name"],
}


# Tests for the main submit_application function
def test_submit_application_success(enable_factory_create, db_session):
    """Test successful submission of an application in IN_PROGRESS state."""
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1), grace_period=3, competition_forms=[]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    # Call the function and get the updated application
    with db_session.begin():
        updated_application = submit_application(db_session, application.application_id, user)

    # Verify the application status was updated
    assert updated_application.application_status == ApplicationStatus.SUBMITTED

    # Verify submitted_at and submitted_by are set
    assert updated_application.submitted_at is not None
    assert updated_application.submitted_by == user.user_id

    # Fetch the application from the database to verify the status has been updated
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.SUBMITTED
    assert application.submitted_at is not None
    assert application.submitted_by == user.user_id


def test_submit_application_with_missing_required_form(enable_factory_create, db_session):
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1), grace_period=3, competition_forms=[]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id, user)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "The application has issues in its form responses."
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.MISSING_APPLICATION_FORM
    )


def test_submit_application_with_invalid_required_form(enable_factory_create, db_session, user):
    competition = CompetitionFactory.create(competition_forms=[])
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response={}
    )

    # Create a user and associate with the application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id, user)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "The application has issues in its form responses."
    # With the new validation logic, empty required forms generate APPLICATION_FORM_VALIDATION errors
    # instead of MISSING_REQUIRED_FORM errors
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.APPLICATION_FORM_VALIDATION
    )


def test_submit_application_with_invalid_field(enable_factory_create, db_session):
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1), grace_period=3, competition_forms=[]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response={"name": 5}
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id, user)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "The application has issues in its form responses."
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.APPLICATION_FORM_VALIDATION
    )


def test_submit_application_not_found(db_session, enable_factory_create):
    """Test that submitting a non-existent application."""
    non_existent_id = uuid.uuid4()
    user = UserFactory.create()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, non_existent_id, user)

    assert excinfo.value.status_code == 404
    assert f"Application with ID {non_existent_id} not found" in excinfo.value.message


def test_submit_application_organization_required_but_missing(enable_factory_create, db_session):
    """Test that submitting an application without an organization when required returns 422."""
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1),
        grace_period=3,
        competition_forms=[],
        open_to_applicants={CompetitionOpenToApplicant.ORGANIZATION},  # Only org allowed
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    # Create application WITHOUT organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,  # No organization
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    # Attempt to submit should fail with 422
    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id, user)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "The application has issues in its form responses."
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.ORGANIZATION_REQUIRED
    )
    assert (
        excinfo.value.extra_data["validation_issues"][0].message
        == "Application requires organization in order to submit"
    )


def test_submit_application_signature_post_processing(enable_factory_create, db_session):
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1),
        competition_forms=[],
    )
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {
                "signature": {"description": "signature field"},
            },
        },
        form_rule_schema={
            "signature": {"gg_post_population": {"rule": "signature"}},
        },
    )
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    # Test for submitting user with an email
    application1 = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
    )
    ApplicationFormFactory.create(
        application=application1,
        competition_form=competition_form,
        application_response={},
    )

    user_email = "a@b.com"
    submitting_user_with_email = UserFactory.create()
    LinkExternalUserFactory.create(email=user_email, user=submitting_user_with_email)
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=submitting_user_with_email, application=application1
        ),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    submitted_application1 = submit_application(
        db_session, application1.application_id, submitting_user_with_email
    )
    assert submitted_application1.submitted_by == submitting_user_with_email.user_id
    assert submitted_application1.submitted_by_user == submitting_user_with_email
    assert submitted_application1.application_forms[0].application_response == {
        "signature": user_email
    }

    # Test for submitting user without an email
    application2 = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
    )
    ApplicationFormFactory.create(
        application=application2, competition_form=competition_form, application_response={}
    )
    submitting_user_without_email = UserFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=submitting_user_without_email, application=application2
        ),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    submitted_application2 = submit_application(
        db_session, application2.application_id, submitting_user_without_email
    )
    assert submitted_application2.submitted_by == submitting_user_without_email.user_id
    assert submitted_application2.submitted_by_user == submitting_user_without_email
    assert submitted_application2.application_forms[0].application_response == {
        "signature": UNKNOWN_VALUE
    }
