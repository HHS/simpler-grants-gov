import uuid
from io import BytesIO
from pathlib import Path

import pytest
import requests
from sqlalchemy import select

import src.util.file_util as file_util
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import ApplicationAttachment
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
)

attachment_dir = Path(__file__).parent / "attachments"

##########################################
# Create application attachment tests
##########################################


@pytest.mark.parametrize(
    "file_name,expected_mimetype",
    [
        ("pdf_file.pdf", "application/pdf"),
        ("text_file.txt", "text/plain"),
        ("spaces in file name.txt", "text/plain"),
    ],
)
def test_application_attachment_create_200(
    db_session,
    enable_factory_create,
    client,
    user,
    user_auth_token,
    s3_config,
    file_name,
    expected_mimetype,
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / file_name).open("rb")},
    )

    assert response.status_code == 200

    application_attachment_id = response.json["data"]["application_attachment_id"]
    assert application_attachment_id is not None

    application_attachment = db_session.execute(
        select(ApplicationAttachment).where(
            ApplicationAttachment.application_attachment_id == application_attachment_id
        )
    ).scalar_one_or_none()
    assert application_attachment is not None

    assert application_attachment.file_name == file_name
    assert application_attachment.mime_type == expected_mimetype
    assert application_attachment.file_size_bytes > 0
    assert file_util.file_exists(application_attachment.file_location) is True


def test_application_attachment_create_404_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application_id = uuid.uuid4()

    response = client.post(
        f"/alpha/applications/{application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application with ID {application_id} not found"


def test_application_attachment_create_422_not_a_file(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": "not-a-file"},
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"
    assert response.json["errors"] == [
        {
            "field": "file_attachment",
            "message": "Not a valid file.",
            "type": "invalid",
            "value": None,
        }
    ]


def test_application_attachment_create_401_invalid_token(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": "not-a-token"},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_application_attachment_create_403_not_the_owner(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application)  # There is an owner, it's someone else

    response = client.post(
        f"/alpha/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Unauthorized"


##########################################
# Get application attachment tests
##########################################


def test_application_attachment_get_200(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    file_contents = "this is text in my file"

    application = ApplicationFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    application_attachment = ApplicationAttachmentFactory.create(
        application=application, file_contents=file_contents
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    response_data = response.json["data"]

    assert response_data["application_attachment_id"] == str(
        application_attachment.application_attachment_id
    )
    assert response_data["file_name"] == application_attachment.file_name
    assert response_data["mime_type"] == application_attachment.mime_type
    assert response_data["file_size_bytes"] == application_attachment.file_size_bytes
    assert response_data["created_at"] == application_attachment.created_at.isoformat()
    assert response_data["updated_at"] == application_attachment.created_at.isoformat()

    # Verify the download path returned is a presigned URL we can download
    response = requests.get(response_data["download_path"], timeout=5)
    assert response.text == file_contents


def test_application_attachment_get_404_application_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application_id = uuid.uuid4()

    response = client.get(
        f"/alpha/applications/{application_id}/attachments/{application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application with ID {application_id} not found"


def test_application_attachment_get_404_application_attachment_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    application_attachment_id = uuid.uuid4()

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert (
        response.json["message"]
        == f"Application attachment with ID {application_attachment_id} not found"
    )


def test_application_attachment_get_401_invalid_token(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)
    application_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": "not-a-token"},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_application_attachment_get_403_not_the_owner(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application)  # There is an owner, it's someone else
    application_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Unauthorized"


##########################################
# Update application attachment tests
##########################################


@pytest.mark.parametrize(
    "file_name,expected_mimetype",
    [
        ("pdf_file.pdf", "application/pdf"),
        ("text_file.txt", "text/plain"),
        ("spaces in file name.txt", "text/plain"),
    ],
)
def test_application_attachment_update_200(
    db_session,
    enable_factory_create,
    client,
    user,
    user_auth_token,
    s3_config,
    file_name,
    expected_mimetype,
):
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    # Create an existing attachment first
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt"
    )

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / file_name).open("rb")},
    )

    assert response.status_code == 200

    application_attachment_id = response.json["data"]["application_attachment_id"]
    assert application_attachment_id == str(existing_attachment.application_attachment_id)

    # Refresh the attachment from the database
    db_session.refresh(existing_attachment)

    assert existing_attachment.file_name == file_name
    assert existing_attachment.mime_type == expected_mimetype
    assert existing_attachment.file_size_bytes > 0
    assert file_util.file_exists(existing_attachment.file_location) is True


def test_application_attachment_update_404_application_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application_id = uuid.uuid4()
    application_attachment_id = uuid.uuid4()

    response = client.put(
        f"/alpha/applications/{application_id}/attachments/{application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application with ID {application_id} not found"


def test_application_attachment_update_404_attachment_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

    attachment_id = uuid.uuid4()

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application attachment with ID {attachment_id} not found"


def test_application_attachment_update_422_not_a_file(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)
    existing_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": "not-a-file"},
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"
    assert response.json["errors"] == [
        {
            "field": "file_attachment",
            "message": "Not a valid file.",
            "type": "invalid",
            "value": None,
        }
    ]


def test_application_attachment_update_422_bad_type(
    db_session,
    enable_factory_create,
    client,
    user,
    user_auth_token,
    s3_config,
):
    """If we pass a non-file stream in, Werkzeug can handle it
    but our API libraries don't, verify that fails gracefully
    """
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)

    # Create an existing attachment first
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt"
    )

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": BytesIO(b"not-a-file")},
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"
    assert response.json["errors"] == [
        {
            "field": "file_attachment",
            "message": "Not a valid file.",
            "type": "invalid",
            "value": None,
        }
    ]


def test_application_attachment_update_401_invalid_token(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)
    existing_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": "not-a-token"},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_application_attachment_update_403_not_the_owner(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application)  # There is an owner, it's someone else
    existing_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Unauthorized"


def test_application_attachment_update_deletes_old_file_different_name(
    db_session,
    enable_factory_create,
    client,
    user,
    user_auth_token,
    s3_config,
):
    """Test that updating an attachment with different filename deletes the old file"""
    application = ApplicationFactory.create()
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    # Create attachment with initial file
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="old_file.txt", file_contents="old file contents"
    )
    old_file_location = existing_attachment.file_location

    # Verify old file exists
    assert file_util.file_exists(old_file_location) is True

    # Update with new file
    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "pdf_file.pdf").open("rb")},
    )

    assert response.status_code == 200

    # Refresh the attachment from the database
    db_session.refresh(existing_attachment)

    # Verify new file exists
    assert file_util.file_exists(existing_attachment.file_location) is True
    assert existing_attachment.file_name == "pdf_file.pdf"

    # Verify old file was deleted (since filename changed, path would be different)
    # Only check if the paths are actually different
    if old_file_location != existing_attachment.file_location:
        assert file_util.file_exists(old_file_location) is False


def test_application_attachment_update_same_filename_overwrites(
    db_session,
    enable_factory_create,
    client,
    user,
    user_auth_token,
    s3_config,
):
    """Test that updating an attachment with same filename updates the attachment"""
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

    # Create attachment with initial file
    existing_attachment = ApplicationAttachmentFactory.create(
        application=application, file_name="text_file.txt", file_contents="old content"
    )
    old_file_location = existing_attachment.file_location

    # Update with new file with same name
    response = client.put(
        f"/alpha/applications/{application.application_id}/attachments/{existing_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
        data={"file_attachment": (attachment_dir / "text_file.txt").open("rb")},
    )

    assert response.status_code == 200

    # Refresh the attachment from the database
    db_session.refresh(existing_attachment)

    # Verify file still exists and was updated
    assert file_util.file_exists(existing_attachment.file_location) is True
    assert existing_attachment.file_name == "text_file.txt"

    # The old file should be deleted since the path changed
    # (factory creates in public bucket, update service uses draft bucket)
    if old_file_location != existing_attachment.file_location:
        assert file_util.file_exists(old_file_location) is False


##########################################
# Delete application attachment tests
##########################################


def test_application_attachment_delete_200(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

    application_attachment = ApplicationAttachmentFactory.create(application=application)
    second_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.delete(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200

    # Make sure the file was deleted from s3
    assert file_util.file_exists(application_attachment.file_location) is False
    # Make sure the record was deleted from the DB
    assert (
        db_session.execute(
            select(ApplicationAttachment).where(
                ApplicationAttachment.application_attachment_id
                == application_attachment.application_attachment_id
            )
        ).scalar_one_or_none()
        is None
    )

    # Make sure the other attachment is unmodified
    db_session.refresh(second_attachment)
    assert second_attachment is not None


def test_application_attachment_delete_404_application_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application_id = uuid.uuid4()

    response = client.delete(
        f"/alpha/applications/{application_id}/attachments/{application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application with ID {application_id} not found"


def test_application_attachment_delete_404_application_attachment_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(user=user, application=application)
    application_attachment_id = uuid.uuid4()

    response = client.delete(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert (
        response.json["message"]
        == f"Application attachment with ID {application_attachment_id} not found"
    )


def test_application_attachment_delete_401_invalid_token(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)
    application_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.delete(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": "not-a-token"},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_application_attachment_delete_403_not_the_owner(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application)  # There is an owner, it's someone else
    application_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.delete(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Unauthorized"


def test_application_attachment_get_403_access(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(user=user, application=application)

    application_attachment = ApplicationAttachmentFactory.create(
        application=application,
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"
