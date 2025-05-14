import uuid
from datetime import date, timedelta

import apiflask.exceptions
import pytest
from freezegun import freeze_time

from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.submit_application import submit_application
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import ApplicationFactory, CompetitionFactory

# Set a fixed date for freezing time in tests
TEST_DATE = "2023-03-10"


def test_submit_application_success(enable_factory_create, db_session):
    """Test successful submission of an application in IN_PROGRESS state."""
    today = date.today()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1),
        grace_period=3,
    )
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    db_session.commit()  # Commit initial state

    updated_application = submit_application(db_session, application.application_id)
    db_session.commit()  # Commit the change made by the service

    db_session.refresh(updated_application)  # Refresh to get the latest state from DB

    assert updated_application.application_id == application.application_id
    assert updated_application.application_status == ApplicationStatus.SUBMITTED


@pytest.mark.parametrize(
    "initial_status",
    [ApplicationStatus.IN_PROGRESS, ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED],
)
def test_submit_application_forbidden(enable_factory_create, db_session, initial_status):
    """Test that submitting an application not in IN_PROGRESS state raises ForbiddenError."""
    today = date.today()
    competition = CompetitionFactory.create(
        closing_date=today + timedelta(days=1),
        grace_period=3,
    )
    application = ApplicationFactory.create(
        application_status=initial_status, competition=competition
    )
    db_session.commit()

    if initial_status == ApplicationStatus.IN_PROGRESS:
        # If already in progress, submission should succeed, not raise Forbidden
        # We actually test this case in test_submit_application_success
        # so we can just skip this parameterization here.
        # Alternatively, assert that it *doesn't* raise Forbidden.
        try:
            submit_application(db_session, application.application_id)
        except apiflask.exceptions.HTTPError as e:
            pytest.fail(
                f"Expected no HTTPError for IN_PROGRESS status, but got {e.status_code}: {e.message}"
            )
        return  # End test for this parameter case

    # For states other than IN_PROGRESS, expect a 403 HTTPError
    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id)

    assert excinfo.value.status_code == 403
    assert (
        f"Application cannot be submitted. It is currently in status: {initial_status.value}"
        in excinfo.value.message
    )

    # Verify status hasn't changed
    db_session.refresh(application)
    assert application.application_status == initial_status


def test_submit_application_not_found(db_session):
    """Test that submitting a non-existent application."""
    non_existent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, non_existent_id)

    assert excinfo.value.status_code == 404
    assert f"Application with ID {non_existent_id} not found" in excinfo.value.message


@freeze_time(TEST_DATE)
def test_submit_application_competition_closed(db_session, enable_factory_create):
    """Test that submitting an application fails if the competition is closed."""
    # Get current date based on the frozen time
    current_date = date.fromisoformat(TEST_DATE)

    # Create a competition with a past closing date (5 days ago) and a grace period of 3 days
    # This means the competition has been closed for 2 days
    past_closing_date = current_date - timedelta(days=5)
    grace_period = 3

    # Create the competition
    competition = CompetitionFactory.create(
        closing_date=past_closing_date, grace_period=grace_period
    )

    # Create an application for this competition
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    # Try to submit the application
    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id)

    # Check that we got the expected error
    assert excinfo.value.status_code == 422
    assert "Cannot submit application - competition is closed" in excinfo.value.message
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.COMPETITION_ALREADY_CLOSED
    )


@freeze_time(TEST_DATE)
def test_submit_application_during_grace_period(db_session, enable_factory_create):
    """Test that submitting an application succeeds during the grace period."""
    # Get current date based on the frozen time
    current_date = date.fromisoformat(TEST_DATE)

    # Create a competition with a closing date 3 days ago but a grace period of 5 days
    # This means the competition is still in the grace period (2 days left)
    past_closing_date = current_date - timedelta(days=3)
    grace_period = 5

    # Create the competition
    competition = CompetitionFactory.create(
        closing_date=past_closing_date, grace_period=grace_period
    )

    # Create an application for this competition
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    # Submit the application - this should succeed
    result = submit_application(db_session, application.application_id)

    # Verify the application was submitted
    assert result.application_status == ApplicationStatus.SUBMITTED
