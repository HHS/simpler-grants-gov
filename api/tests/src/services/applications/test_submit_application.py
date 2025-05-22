import uuid
from datetime import timedelta

import apiflask.exceptions
import pytest

from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.submit_application import submit_application
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
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
    CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application, form=form, application_response={"name": "Test Name"}
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

    # Call the function and get the updated application
    with db_session.begin():
        updated_application = submit_application(db_session, application.application_id, user)

    # Verify the application status was updated
    assert updated_application.application_status == ApplicationStatus.SUBMITTED

    # Fetch the application from the database to verify the status has been updated
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.SUBMITTED


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
    ApplicationUserFactory.create(user=user, application=application)

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id, user)

    assert excinfo.value.status_code == 422
    assert excinfo.value.message == "The application has issues in its form responses."
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.MISSING_REQUIRED_FORM
    )


def test_submit_application_with_invalid_field(enable_factory_create, db_session):
    today = get_now_us_eastern_date()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1), grace_period=3, competition_forms=[]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application, form=form, application_response={"name": 5}
    )

    # Create a user and associate with the application
    user = UserFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

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
