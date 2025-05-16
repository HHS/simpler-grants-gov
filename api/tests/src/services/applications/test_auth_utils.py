import pytest
from apiflask.exceptions import HTTPError

from src.services.applications.auth_utils import check_user_application_access
from tests.src.db.models.factories import ApplicationFactory, ApplicationUserFactory, UserFactory


def test_check_user_application_access_success(enable_factory_create, db_session):
    """Test that a user with access to an application passes the check."""
    # Create a user and an application
    user = UserFactory.create()
    application = ApplicationFactory.create()

    # Associate the user with the application using the factory
    ApplicationUserFactory.create(user=user, application=application)

    # Call the function - should return None without raising an exception
    result = check_user_application_access(application, user)

    assert result is None


def test_check_user_application_access_unauthorized(enable_factory_create, db_session):
    """Test that a user without access to an application raises a 403 error."""
    # Create a user and an application, but don't associate them
    user = UserFactory.create()
    application = ApplicationFactory.create()

    # Call the function - should raise a 403 HTTPError
    with pytest.raises(HTTPError) as excinfo:
        check_user_application_access(application, user)

    # Verify error details
    assert excinfo.value.status_code == 403
    assert "Unauthorized" in excinfo.value.message

    # Check that the validation issue is included
    validation_issues = excinfo.value.extra_data["validation_issues"]
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "unauthorized_application_access"
    assert validation_issues[0].field == "application_id"
