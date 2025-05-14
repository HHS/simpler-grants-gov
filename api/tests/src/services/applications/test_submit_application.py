import uuid
from datetime import date, timedelta

import apiflask.exceptions
import pytest
from freezegun import freeze_time

from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.submit_application import (
    submit_application,
    validate_application_in_progress,
    validate_competition_open,
)
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import ApplicationFactory, CompetitionFactory

# Set a fixed date for freezing time in tests
TEST_DATE = "2023-03-10"


# Tests for validate_application_in_progress
def test_validate_application_in_progress_success(enable_factory_create, db_session):
    """Test that validating an application in IN_PROGRESS state succeeds."""
    application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)
    db_session.commit()

    # Should not raise any exception
    validate_application_in_progress(application)


@pytest.mark.parametrize(
    "status",
    [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED],
)
def test_validate_application_in_progress_failure(enable_factory_create, db_session, status):
    """Test that validating an application not in IN_PROGRESS state raises an error."""
    application = ApplicationFactory.create(application_status=status)
    db_session.commit()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        validate_application_in_progress(application)

    assert excinfo.value.status_code == 403
    assert (
        f"Application cannot be submitted. It is currently in status: {status}"
        in excinfo.value.message
    )
    assert (
        excinfo.value.extra_data["validation_issues"][0].type == ValidationErrorType.NOT_IN_PROGRESS
    )


# Tests for validate_competition_open
@freeze_time(TEST_DATE)
def test_validate_competition_open_success(enable_factory_create, db_session):
    """Test that validating an open competition succeeds."""
    current_date = date.fromisoformat(TEST_DATE)

    # Test cases:
    # 1. Competition with future closing date
    # 2. Competition with past closing date but within grace period

    # Future closing date
    competition1 = CompetitionFactory.create(
        closing_date=current_date + timedelta(days=1),
        grace_period=0,
    )
    application1 = ApplicationFactory.create(competition=competition1)

    # Should not raise any exception
    validate_competition_open(application1)

    # Past closing date but within grace period
    competition2 = CompetitionFactory.create(
        closing_date=current_date - timedelta(days=2),
        grace_period=3,
    )
    application2 = ApplicationFactory.create(competition=competition2)

    # Should not raise any exception
    validate_competition_open(application2)


@freeze_time(TEST_DATE)
def test_validate_competition_open_failure(enable_factory_create, db_session):
    """Test that validating a closed competition raises an error."""
    current_date = date.fromisoformat(TEST_DATE)

    # Create a competition with a past closing date (5 days ago) and a grace period of 3 days
    # This means the competition has been closed for 2 days
    competition = CompetitionFactory.create(
        closing_date=current_date - timedelta(days=5),
        grace_period=3,
    )
    application = ApplicationFactory.create(competition=competition)
    db_session.commit()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        validate_competition_open(application)

    assert excinfo.value.status_code == 422
    assert "Cannot submit application - competition is closed" in excinfo.value.message
    assert (
        excinfo.value.extra_data["validation_issues"][0].type
        == ValidationErrorType.COMPETITION_ALREADY_CLOSED
    )


@freeze_time(TEST_DATE)
def test_validate_competition_with_no_closing_date(enable_factory_create, db_session):
    """Test that validating a competition with no closing date succeeds."""
    competition = CompetitionFactory.create(closing_date=None)
    application = ApplicationFactory.create(competition=competition)
    db_session.commit()

    # Should not raise any exception
    validate_competition_open(application)


# Tests for the main submit_application function
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


def test_submit_application_not_found(db_session):
    """Test that submitting a non-existent application."""
    non_existent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        submit_application(db_session, non_existent_id)

    assert excinfo.value.status_code == 404
    assert f"Application with ID {non_existent_id} not found" in excinfo.value.message
