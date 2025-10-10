from io import BytesIO
from pathlib import Path

import pytest

from src.app_config import AppConfig
from src.constants.lookup_constants import Privilege
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
)

attachment_dir = Path(__file__).parent / "attachments"


def test_flask_max_content_length_file_too_large(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    """Test that Flask's MAX_CONTENT_LENGTH rejects files larger than the configured limit."""
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)

    # Create a file that's larger than the 2GB limit
    # We'll create a file with content that appears to be larger than 2GB
    # by using a BytesIO object with a large size
    large_file_content = b"x" * (3 * 1024 * 1024 * 1024)  # 3GB of data

    # Create a BytesIO object that reports a large size
    class LargeBytesIO(BytesIO):
        def __init__(self, content, reported_size):
            super().__init__(content)
            self._reported_size = reported_size

        def __len__(self):
            return self._reported_size

    large_file = LargeBytesIO(large_file_content, 3 * 1024 * 1024 * 1024)  # Report as 3GB

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (large_file, "large_file.txt")},
    )

    # Flask should return 413 (Request Entity Too Large) when MAX_CONTENT_LENGTH is exceeded
    assert response.status_code == 413
    assert "Request Entity Too Large" in response.text or "413" in response.text


def test_flask_max_content_length_file_within_limit(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    """Test that Flask's MAX_CONTENT_LENGTH allows files within the configured limit."""
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )
    # Create a small file that's well within the 2GB limit
    small_file_content = b"This is a small test file content"
    small_file = BytesIO(small_file_content)

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (small_file, "small_file.txt")},
    )

    # Should succeed for files within the limit
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_attachment_id" in response.json["data"]


def test_flask_max_content_length_configuration(app):
    """Test that the Flask app is configured with the correct MAX_CONTENT_LENGTH."""
    app_config = AppConfig()

    # Verify that Flask's MAX_CONTENT_LENGTH is set to the app config value
    assert app.config["MAX_CONTENT_LENGTH"] == app_config.max_file_upload_size_bytes

    # Verify the value is 2GB (2 * 1024^3 bytes)
    expected_size = 2 * 1024 * 1024 * 1024
    assert app.config["MAX_CONTENT_LENGTH"] == expected_size


def test_flask_max_content_length_with_real_file(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    """Test Flask's MAX_CONTENT_LENGTH with a real file from the test directory."""
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory(privileges=[Privilege.MODIFY_APPLICATION]),
    )
    # Use a real test file that should be well within the 2GB limit
    test_file_path = attachment_dir / "pdf_file.pdf"

    if test_file_path.exists():
        response = client.post(
            f"/alpha/applications/{application.application_id}/attachments",
            headers={"X-SGG-Token": user_auth_token},
            data={"file_attachment": test_file_path.open("rb")},
        )

        # Should succeed for real files within the limit
        assert response.status_code == 200
        assert response.json["message"] == "Success"
        assert "application_attachment_id" in response.json["data"]
    else:
        # Skip test if test file doesn't exist
        pytest.skip("Test file pdf_file.pdf not found in attachments directory")
