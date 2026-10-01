import uuid

import requests

from src.constants.lookup_constants import Privilege
from tests.lib.application_test_utils import create_user_in_app
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationUserFactory,
)

##########################################
# Get application attachment tests
##########################################


def test_application_attachment_get_200(db_session, enable_factory_create, client, s3_config):
    file_contents = "this is text in my file"
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])

    application_attachment = ApplicationAttachmentFactory.create(
        application=application, file_contents=file_contents
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": token},
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
    db_session,
    enable_factory_create,
    client,
    user,
):
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])

    application_attachment_id = uuid.uuid4()

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    assert (
        response.json["message"]
        == f"Application attachment with ID {application_attachment_id} not found"
    )


def test_application_attachment_get_404_application_attachment_deleted(
    db_session,
    enable_factory_create,
    client,
    user,
):
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])

    application_attachment = ApplicationAttachmentFactory.create(
        application=application, is_deleted=True
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    assert (
        response.json["message"]
        == f"Application attachment with ID {application_attachment.application_attachment_id} not found"
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
    assert response.json["message"] == "Forbidden"


def test_application_attachment_get_403_access(
    db_session,
    enable_factory_create,
    client,
):
    user, application, token = create_user_in_app(db_session)

    application_attachment = ApplicationAttachmentFactory.create(
        application=application,
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_application_attachment_get_access_with_organization_role(
    db_session,
    enable_factory_create,
    client,
):
    """Test that user can access the application if organization member"""
    # Associate user with organization
    _, org, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_APPLICATION])
    # Create application owned by org
    application = ApplicationFactory.create(organization=org)
    application_attachment = ApplicationAttachmentFactory.create(application=application)

    response = client.get(
        f"/alpha/applications/{application.application_id}/attachments/{application_attachment.application_attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
