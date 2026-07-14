import logging
import uuid

import grants_shared.adapters.db as db
import grants_shared.util.file_util as file_util
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import func, select

from src.app_config import AppConfig
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import ApplicationAuditEvent, Privilege, SubmissionIssue
from src.db.models.competition_models import ApplicationAttachment
from src.db.models.user_models import User
from src.services.applications.application_audit import add_audit_event
from src.services.applications.create_application_attachment import (
    build_s3_application_attachment_path,
)
from src.services.applications.get_application import get_application
from src.services.files.pending_file_handling_domain_specific import (
    fetch_and_validate_scan_complete_file,
    move_pending_file_to_destination,
)

logger = logging.getLogger(__name__)


def create_application_attachment_from_pending_file(
    db_session: db.Session,
    application_id: uuid.UUID,
    user: User,
    pending_file_id: uuid.UUID,
) -> ApplicationAttachment:
    """Create an application attachment by moving a virus-scanned pending file.

    This is the pending-file (presigned upload) variant of attachment creation.
    Unlike the multipart upload variant, this accepts a ``pending_file_id``
    referencing a file that has already been uploaded via ``POST /v1/files``
    and cleared by the virus scanner (``FileScanStatus.COMPLETE``).

    The pending file is *moved* (not copied) into the application attachments
    bucket so it is not double-stored.
    """
    # Fetch application — raises 404 if not found, 403 if user not a member
    application = get_application(db_session, application_id, user)

    # check privileges
    check_user_access(db_session, user, {Privilege.MODIFY_APPLICATION}, application)

    # Enforce attachment count limit
    app_config = AppConfig()
    max_attachments = app_config.max_attachments_per_application
    attachment_count = db_session.execute(
        select(func.count())
        .select_from(ApplicationAttachment)
        .where(
            ApplicationAttachment.application_id == application_id,
            ApplicationAttachment.is_deleted.isnot(True),
        )
    ).scalar_one()
    if attachment_count >= max_attachments:
        logger.info(
            "Application has reached the maximum number of attachments (%s)",
            max_attachments,
            extra={
                "submission_issue": SubmissionIssue.ATTACHMENT_LIMIT_EXCEEDED,
                "application_id": application_id,
                "attachment_count": attachment_count,
            },
        )
        raise_flask_error(
            422,
            f"Application has reached the maximum number of attachments ({max_attachments})",
        )

    # Fetch pending file; validates user ownership and scan completion
    pending_file = fetch_and_validate_scan_complete_file(db_session, pending_file_id, user)

    # Build destination path in the application attachments bucket
    application_attachment_id = uuid.uuid4()
    secure_file_name = file_util.get_secure_file_name(pending_file.file_name)
    s3_file_location = build_s3_application_attachment_path(
        secure_file_name, application_id, application_attachment_id
    )

    # Get file size
    file_size_bytes = file_util.get_file_length_bytes(pending_file.file_location)

    # Persist attachment record before moving the file so that if any DB
    # operation fails the pending file remains in its original location.
    application_attachment = ApplicationAttachment(
        application_attachment_id=application_attachment_id
    )
    application_attachment.application = application
    application_attachment.file_location = s3_file_location
    application_attachment.file_name = pending_file.file_name
    application_attachment.mime_type = pending_file.mime_type
    application_attachment.file_size_bytes = file_size_bytes
    application_attachment.user = user
    db_session.add(application_attachment)

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.ATTACHMENT_ADDED,
        target_attachment=application_attachment,
    )

    # Move (not copy) after all DB operations — pending file is consumed and
    # its status is set to PROCESSED.
    move_pending_file_to_destination(pending_file, s3_file_location)

    return application_attachment
