import logging
import uuid

import src.adapters.db as db
import src.util.file_util as file_util
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import ApplicationAuditEvent, Privilege
from src.db.models.competition_models import ApplicationAttachment
from src.db.models.user_models import User
from src.services.applications.application_audit import add_audit_event
from src.services.applications.create_application_attachment import upsert_application_attachment
from src.services.applications.get_application_attachment import get_application_attachment

logger = logging.getLogger(__name__)


def update_application_attachment(
    db_session: db.Session,
    application_id: uuid.UUID,
    application_attachment_id: uuid.UUID,
    user: User,
    form_and_files_data: dict,
) -> ApplicationAttachment:
    # Fetch the application attachment, handles verifying
    # it exists, and that the user has access attachment.
    application_attachment = get_application_attachment(
        db_session, application_id, application_attachment_id, user
    )
    # Check privileges
    check_user_access(
        db_session,
        user,
        {Privilege.MODIFY_APPLICATION},
        application_attachment.application,
    )

    # Store the old file location before updating
    old_s3_file_location = application_attachment.file_location

    # Use the upsert function to update the attachment
    updated_application_attachment = upsert_application_attachment(
        db_session=db_session,
        application_id=application_id,
        user=user,
        form_and_files_data=form_and_files_data,
        application=application_attachment.application,
        application_attachment=application_attachment,
    )

    # If the filepath on s3 is different than before, delete the old file from s3
    if old_s3_file_location != updated_application_attachment.file_location:
        logger.info(
            "Deleting old application attachment from s3",
            extra={
                "application_attachment_id": application_attachment_id,
                "old_file_location": old_s3_file_location,
            },
        )
        file_util.delete_file(old_s3_file_location)

    logger.info(
        "Updated application attachment",
        extra={"application_attachment_id": application_attachment_id},
    )
    add_audit_event(
        db_session=db_session,
        application=application_attachment.application,
        user=user,
        audit_event=ApplicationAuditEvent.ATTACHMENT_UPDATED,
        target_attachment=application_attachment,
    )

    return updated_application_attachment
