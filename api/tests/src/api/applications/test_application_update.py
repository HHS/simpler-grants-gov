from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import ApplicationFactory, ApplicationUserFactory, UserFactory


def test_application_update_success(client, enable_factory_create, db_session):
    """Test successful update of an application's name"""
    # Create a user and application
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserFactory.create(user=user, application=application)

    # Get user auth token
    user_auth_token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

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


def test_application_update_empty_name(client, enable_factory_create, db_session):
    """Test application update allows empty name at service level"""
    # Create a user and application
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserFactory.create(user=user, application=application)

    # Get user auth token
    user_auth_token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

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


def test_application_update_missing_field(client, enable_factory_create, db_session):
    """Test application update fails when required field is missing"""
    # Create a user and application
    user = UserFactory.create()
    application = ApplicationFactory.create(application_name="Original Name")

    # Associate the user with the application using factory
    ApplicationUserFactory.create(user=user, application=application)

    # Get user auth token
    user_auth_token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

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
