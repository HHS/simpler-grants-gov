import uuid

import apiflask.exceptions
import pytest

from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.submit_application import submit_application
from tests.src.db.models.factories import ApplicationFactory


def test_submit_application_success(enable_factory_create, db_session):
    """Test successful submission of an application in IN_PROGRESS state."""
    application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)
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
    application = ApplicationFactory.create(application_status=initial_status)
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
