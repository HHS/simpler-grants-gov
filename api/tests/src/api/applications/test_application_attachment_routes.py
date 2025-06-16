import uuid
from pathlib import Path

import pytest
import requests
from sqlalchemy import select

import src.util.file_util as file_util
from src.db.models.competition_models import ApplicationAttachment
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationUserFactory,
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
    ApplicationUserFactory.create(application=application, user=user)
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
    ApplicationUserFactory.create(application=application, user=user)
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
# Delete application attachment tests
##########################################


def test_application_attachment_delete_200(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application, user=user)
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
    ApplicationUserFactory.create(application=application, user=user)
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
