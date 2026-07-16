import uuid

import grants_shared.util.file_util as file_util
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationAuditEvent, FileScanStatus, Privilege
from src.db.models.competition_models import ApplicationAttachment
from tests.lib.application_test_utils import create_user_in_app
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    PendingFileFactory,
    UserFactory,
)


def make_pending_file(
    user, s3_config, file_scan_status=FileScanStatus.COMPLETE, mime_type="application/pdf"
):
    """Create a PendingFile backed by a real S3 file."""
    file_name = "test-attachment.pdf"
    source_location = f"{s3_config.file_scan_bucket_path}/scan_complete/{uuid.uuid4()}/{file_name}"
    file_util.write_to_file(source_location, "test file content")
    return PendingFileFactory.create(
        user=user,
        file_name=file_name,
        file_location=source_location,
        file_scan_status=file_scan_status,
        mime_type=mime_type,
    )


def test_create_application_attachment_200(db_session, enable_factory_create, client, s3_config):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    pending_file = make_pending_file(user, s3_config)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 200, response.json

    data = response.json["data"]
    assert data["application_attachment_id"] is not None
    assert data["file_name"] == "test-attachment.pdf"
    assert data["mime_type"] == "application/pdf"
    assert data["file_size_bytes"] > 0
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    # Verify DB record
    attachment_id = data["application_attachment_id"]
    attachment = db_session.execute(
        select(ApplicationAttachment).where(
            ApplicationAttachment.application_attachment_id == attachment_id
        )
    ).scalar_one_or_none()
    assert attachment is not None
    assert attachment.file_name == "test-attachment.pdf"
    assert attachment.mime_type == "application/pdf"
    assert attachment.file_size_bytes > 0

    # File moved to attachment bucket, no longer at pending location
    assert file_util.file_exists(attachment.file_location) is True
    assert file_util.file_exists(pending_file.file_location) is False

    # Pending file status updated to PROCESSED
    db_session.refresh(pending_file)
    assert pending_file.file_scan_status == FileScanStatus.PROCESSED

    # Audit event recorded
    db_session.refresh(application)
    assert len(application.application_audits) == 1
    audit = application.application_audits[0]
    assert audit.application_audit_event == ApplicationAuditEvent.ATTACHMENT_ADDED
    assert audit.user_id == user.user_id
    assert str(audit.target_attachment_id) == attachment_id


def test_create_application_attachment_401_missing_token(db_session, enable_factory_create, client):
    application = ApplicationFactory.create()

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        json={"pending_file_id": str(uuid.uuid4())},
    )

    assert response.status_code == 401


def test_create_application_attachment_401_invalid_token(db_session, enable_factory_create, client):
    application = ApplicationFactory.create()

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": "not-a-token"},
        json={"pending_file_id": str(uuid.uuid4())},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_create_application_attachment_403_user_not_in_application(
    db_session, enable_factory_create, client, user, user_auth_token, s3_config
):
    application = ApplicationFactory.create()
    ApplicationUserFactory.create(application=application)  # someone else owns it

    pending_file = make_pending_file(user, s3_config)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_create_application_attachment_403_pending_file_belongs_to_other_user(
    db_session, enable_factory_create, client, s3_config
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    other_user = UserFactory.create()
    pending_file = make_pending_file(other_user, s3_config)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 403
    assert response.json["message"] == "You do not have permission to access this file"


def test_create_application_attachment_404_application_not_found(
    db_session, enable_factory_create, client, user, user_auth_token
):
    application_id = uuid.uuid4()

    response = client.post(
        f"/v1/applications/{application_id}/attachments",
        headers={"X-SGG-Token": user_auth_token},
        json={"pending_file_id": str(uuid.uuid4())},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"Application with ID {application_id} not found"


def test_create_application_attachment_404_pending_file_not_found(
    db_session, enable_factory_create, client
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    missing_id = uuid.uuid4()

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(missing_id)},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Pending file not found"


def test_create_application_attachment_422_attachment_limit_exceeded(
    db_session, enable_factory_create, client, s3_config, monkeypatch
):
    monkeypatch.setenv("MAX_ATTACHMENTS_PER_APPLICATION", "3")

    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    for _ in range(3):
        ApplicationAttachmentFactory.create(application=application)

    pending_file = make_pending_file(user, s3_config)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 422
    assert (
        response.json["message"] == "Application has reached the maximum number of attachments (3)"
    )


def test_create_application_attachment_422_limit_excludes_deleted(
    db_session, enable_factory_create, client, s3_config, monkeypatch
):
    """Soft-deleted attachments don't count toward the limit."""
    monkeypatch.setenv("MAX_ATTACHMENTS_PER_APPLICATION", "3")

    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    # 2 active + 1 deleted = still under the limit
    for _ in range(2):
        ApplicationAttachmentFactory.create(application=application)
    ApplicationAttachmentFactory.create(application=application, is_deleted=True)

    pending_file = make_pending_file(user, s3_config)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 200


def test_create_application_attachment_422_file_scan_not_complete(
    db_session, enable_factory_create, client, s3_config
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    pending_file = make_pending_file(user, s3_config, file_scan_status=FileScanStatus.PENDING)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 422
    assert response.json["message"] == "File cannot be used, status must be complete"


def test_create_application_attachment_422_file_scan_infected(
    db_session, enable_factory_create, client, s3_config
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    pending_file = make_pending_file(user, s3_config, file_scan_status=FileScanStatus.INFECTED)

    response = client.post(
        f"/v1/applications/{application.application_id}/attachments",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert response.status_code == 422
    assert response.json["message"] == "File cannot be used, status must be complete"
