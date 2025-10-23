import uuid
from pathlib import Path
from unittest.mock import MagicMock

import apiflask.exceptions
import pytest
from werkzeug.datastructures import FileStorage

import src.util.file_util as file_util
from src.constants.lookup_constants import Privilege
from src.services.applications.update_application_attachment import update_application_attachment
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
    UserFactory,
)

attachment_dir = Path(__file__).parent.parent.parent / "api" / "applications" / "attachments"


def test_update_application_attachment_success(enable_factory_create, db_session, s3_config, user):
    """Test successful update of an application attachment."""
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create existing attachment
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt"
    )

    # Mock file for updating
    mock_file = MagicMock(spec=FileStorage)
    mock_file.filename = "new_file.pdf"
    mock_file.mimetype = "application/pdf"
    mock_file.save = MagicMock()

    form_and_files_data = {"file_attachment": mock_file}

    with db_session.begin():
        updated_attachment = update_application_attachment(
            db_session,
            application.application_id,
            existing_attachment.application_attachment_id,
            user,
            form_and_files_data,
        )

    # Verify the attachment was updated
    assert (
        updated_attachment.application_attachment_id
        == existing_attachment.application_attachment_id
    )
    assert updated_attachment.file_name == "new_file.pdf"
    assert updated_attachment.mime_type == "application/pdf"


def test_update_application_attachment_not_found(enable_factory_create, db_session, user):
    """Test update fails with non-existent attachment."""
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    non_existent_attachment_id = uuid.uuid4()

    mock_file = MagicMock(spec=FileStorage)
    mock_file.filename = "test.pdf"
    mock_file.mimetype = "application/pdf"
    form_and_files_data = {"file_attachment": mock_file}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application_attachment(
            db_session,
            application.application_id,
            non_existent_attachment_id,
            user,
            form_and_files_data,
        )

    assert excinfo.value.status_code == 404
    assert (
        f"Application attachment with ID {non_existent_attachment_id} not found"
        in excinfo.value.message
    )


def test_update_application_attachment_application_not_found(
    enable_factory_create, db_session, user
):
    """Test update fails when application doesn't exist."""
    non_existent_application_id = uuid.uuid4()
    attachment_id = uuid.uuid4()

    mock_file = MagicMock(spec=FileStorage)
    mock_file.filename = "test.pdf"
    mock_file.mimetype = "application/pdf"
    form_and_files_data = {"file_attachment": mock_file}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application_attachment(
            db_session,
            non_existent_application_id,
            attachment_id,
            user,
            form_and_files_data,
        )

    assert excinfo.value.status_code == 404
    assert f"Application with ID {non_existent_application_id} not found" in excinfo.value.message


def test_update_application_attachment_unauthorized(enable_factory_create, db_session, user):
    """Test update fails when user is not associated with the application."""
    other_user = UserFactory.create()
    application = ApplicationFactory.create()

    # Associate other_user (not user) with the application
    ApplicationUserFactory.create(user=other_user, application=application)

    existing_attachment = ApplicationAttachmentFactory.create(application=application)

    mock_file = MagicMock(spec=FileStorage)
    mock_file.filename = "test.pdf"
    mock_file.mimetype = "application/pdf"
    form_and_files_data = {"file_attachment": mock_file}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application_attachment(
            db_session,
            application.application_id,
            existing_attachment.application_attachment_id,
            user,
            form_and_files_data,
        )

    assert excinfo.value.status_code == 403
    assert "Forbidden" in excinfo.value.message


def test_update_application_attachment_with_real_file(
    enable_factory_create, db_session, s3_config, user
):
    """Test update with a real file to verify file operations."""
    user = UserFactory.create()
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create existing attachment with actual file
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt", file_contents="old content"
    )
    old_file_location = existing_attachment.file_location

    # Verify old file exists
    assert file_util.file_exists(old_file_location) is True

    # Create FileStorage object to simulate proper form upload
    test_file_path = attachment_dir / "pdf_file.pdf"
    with test_file_path.open("rb") as file_handle:
        file_storage = FileStorage(
            stream=file_handle, filename="pdf_file.pdf", content_type="application/pdf"
        )
        form_and_files_data = {"file_attachment": file_storage}

        with db_session.begin():
            updated_attachment = update_application_attachment(
                db_session,
                application.application_id,
                existing_attachment.application_attachment_id,
                user,
                form_and_files_data,
            )

    # Verify the attachment was updated
    assert updated_attachment.file_name == "pdf_file.pdf"
    assert updated_attachment.mime_type == "application/pdf"
    assert file_util.file_exists(updated_attachment.file_location) is True

    # If the file path changed, old file should be deleted
    if old_file_location != updated_attachment.file_location:
        assert file_util.file_exists(old_file_location) is False


def test_update_application_no_filename(enable_factory_create, db_session, s3_config, user):
    """Test successful update of an application attachment."""
    user = UserFactory.create()
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create existing attachment
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt"
    )

    # Mock file for updating
    mock_file = MagicMock(spec=FileStorage)
    mock_file.filename = None
    mock_file.mimetype = "application/pdf"
    mock_file.save = MagicMock()

    form_and_files_data = {"file_attachment": mock_file}

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        update_application_attachment(
            db_session,
            application.application_id,
            existing_attachment.application_attachment_id,
            user,
            form_and_files_data,
        )

    assert excinfo.value.status_code == 422
    assert "Invalid file name, cannot parse" in excinfo.value.message
