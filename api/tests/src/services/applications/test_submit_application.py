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


def test_submit_application_success(db_session, enable_factory_create):
    """Test that submitting an in-progress application changes its status."""
    application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)

    # Call function to test
    result = submit_application(db_session, application.application_id)

    # We expect the result to be SUBMITTED
    assert result.application_status == ApplicationStatus.SUBMITTED


def test_submit_application_not_in_progress(db_session, enable_factory_create):
    """Test that submitting an application not in progress fails."""
    # Create a new application with status SUBMITTED (not IN_PROGRESS)
    application = ApplicationFactory.create(application_status=ApplicationStatus.SUBMITTED)

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, application.application_id)

    # Check that we got the expected error
    assert excinfo.value.status_code == 403
    assert "Application cannot be submitted. It is currently in status:" in excinfo.value.message
    assert (
        excinfo.value.extra_data["validation_issues"][0].type == ValidationErrorType.NOT_IN_PROGRESS
    )


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
