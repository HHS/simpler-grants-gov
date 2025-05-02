import uuid

import pytest
from werkzeug.exceptions import Forbidden, NotFound

from src.constants.lookup_constants import ApplicationStatus
from src.services.applications.submit_application import submit_application
from tests.src.db.models.factories import ApplicationFactory


def test_submit_application_success(enable_factory_create, db_session):
    """Test successful submission of an application in IN_PROGRESS state."""
    application = ApplicationFactory.create(status=ApplicationStatus.IN_PROGRESS)
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
    application = ApplicationFactory.create(status=initial_status)
    db_session.commit()

    with pytest.raises(Forbidden) as excinfo:
        submit_application(db_session, application.application_id)

    assert (
        f"Application cannot be submitted. It is currently in status: {initial_status.value}"
        in excinfo.value.description
    )

    # Verify status hasn't changed
    db_session.refresh(application)
    assert application.application_status == initial_status


def test_submit_application_not_found(db_session):
    """Test that submitting a non-existent application raises NotFoundError."""
    non_existent_id = uuid.uuid4()

    with pytest.raises(NotFound) as excinfo:
        submit_application(db_session, non_existent_id)

    assert f"Application with ID {non_existent_id} not found" in excinfo.value.description
