import uuid

import apiflask.exceptions
import pytest

from src.constants.lookup_constants import Privilege
from src.services.applications.update_application import update_application
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
    UserFactory,
)


def test_update_application_success(enable_factory_create, db_session):
    """Test successful update of an application."""
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")
    # Associate user with application
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    updates = {"application_name": "Updated Name"}

    # Call the function and get the updated application
    with db_session.begin():
        updated_application = update_application(
            db_session, application.application_id, updates, user
        )

    # Verify the application name was updated
    assert updated_application.application_name == "Updated Name"

    # Fetch the application from the database to verify the name has been updated
    db_session.refresh(application)
    assert application.application_name == "Updated Name"


def test_update_application_empty_name(enable_factory_create, db_session):
    """Test update allows empty application name."""
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")
    # Associate user with application
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )
    updates = {"application_name": ""}

    # Call the function and get the updated application
    with db_session.begin():
        updated_application = update_application(
            db_session, application.application_id, updates, user
        )

    # Verify the application name was updated to empty string
    assert updated_application.application_name == ""

    # Fetch the application from the database to verify the name has been updated
    db_session.refresh(application)
    assert application.application_name == ""


def test_update_application_not_found(enable_factory_create, db_session):
    """Test update fails with non-existent application."""
    user = UserFactory.create()
    non_existent_id = uuid.uuid4()
    updates = {"application_name": "New Name"}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application(db_session, non_existent_id, updates, user)

    assert excinfo.value.status_code == 404
    assert f"Application with ID {non_existent_id} not found" in excinfo.value.message


def test_update_application_unauthorized(enable_factory_create, db_session):
    """Test update fails when user is not associated with the application."""
    user = UserFactory.create()
    other_user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate other_user (not user) with the application
    ApplicationUserFactory.create(user=other_user, application=application)

    updates = {"application_name": "Updated Name"}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application(db_session, application.application_id, updates, user)

    assert excinfo.value.status_code == 403
    assert "Forbidden" in excinfo.value.message

    # Verify application name was not updated
    db_session.refresh(application)
    assert application.application_name == "Original Name"


def test_update_application_multiple_fields_future(enable_factory_create, db_session):
    """Test update with multiple fields for future extensibility."""
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")
    # Associate user with application
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )
    # Currently, only application_name is supported, but the function is designed
    # to be extended to handle more fields in the future
    updates = {
        "application_name": "Updated Name",
        # future fields would go here
    }

    # Call the function and get the updated application
    with db_session.begin():
        updated_application = update_application(
            db_session, application.application_id, updates, user
        )

    # Verify the application name was updated
    assert updated_application.application_name == "Updated Name"
