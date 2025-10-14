import pytest

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.validation.validation_constants import ValidationErrorType
from tests.lib.application_test_utils import create_user_in_app
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
)


def test_application_update_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful update of an application's name"""
    # Create application
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Update the application name
    new_name = "Updated Application Name"
    request_data = {"application_name": new_name}
    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )
    # Check response
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)

    # Refresh the application from the database before checking
    db_session.refresh(application)
    assert application.application_name == new_name


def test_application_update_unauthorized(client, enable_factory_create, db_session):
    """Test application update fails without proper authentication"""
    application = ApplicationFactory.create(application_name="Original Name")
    request_data = {"application_name": "Updated Name"}
    # Use an invalid JWT token
    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json=request_data,
        headers={"X-SGG-Token": "invalid.jwt.token"},
    )
    assert response.status_code == 401
    # Verify application was not updated
    db_session.refresh(application)
    assert application.application_name == "Original Name"


def test_application_update_empty_name(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application update allows empty name at service level"""
    # Create application
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Try to update with empty name
    request_data = {"application_name": ""}
    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    # We expect success now that the service layer doesn't validate empty strings
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application was updated with empty name
    db_session.refresh(application)
    assert application.application_name == ""


def test_application_update_missing_field(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application update fails when required field is missing"""
    # Create a user and application
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserFactory.create(user=user, application=application)

    # Try to update with missing required field
    request_data = {}
    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )
    assert response.status_code == 422
    # Verify application was not updated
    db_session.refresh(application)
    assert application.application_name == "Original Name"


@pytest.mark.parametrize(
    "initial_status", [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED]
)
def test_application_form_update_forbidden_not_in_progress(
    client, enable_factory_create, db_session, initial_status
):
    """Test application update fails if application is not in IN_PROGRESS status"""
    # Create an application with a status other than IN_PROGRESS
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION], status=initial_status
    )

    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json={"application_name": "something new"},
        headers={"X-SGG-Token": token},
    )

    # Assert forbidden response
    assert response.status_code == 403
    assert (
        f"Cannot modify application. It is currently in status: {initial_status.value}"
        in response.json["message"]
    )
    assert len(response.json["errors"]) == 1
    assert response.json["errors"][0]["type"] == ValidationErrorType.NOT_IN_PROGRESS
    assert (
        response.json["errors"][0]["message"]
        == "Cannot modify application, not currently in progress"
    )

    db_session.refresh(application)
    assert application.application_name != "something new"


def test_application_update_403_access(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test forbidden update of an application's name"""
    # Create application
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserFactory.create(user=user, application=application)

    # Update the application name
    new_name = "Updated Application Name"
    request_data = {"application_name": new_name}
    response = client.put(
        f"/alpha/applications/{application.application_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )
    # Check response
    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"
