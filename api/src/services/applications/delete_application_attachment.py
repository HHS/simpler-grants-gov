import logging
import uuid

import src.adapters.db as db
from src.db.models.user_models import User
from src.services.applications.get_application_attachment import get_application_attachment
from src.util import file_util

logger = logging.getLogger(__name__)


def delete_application_attachment(
    db_session: db.Session,
    application_id: uuid.UUID,
    application_attachment_id: uuid.UUID,
    user: User,
) -> None:
    """Delete an application attachment"""
    # Fetch the application attachment, handles verifying
    # it exists, and that the user has access attachment.
    application_attachment = get_application_attachment(
        db_session, application_id, application_attachment_id, user
    )
    # Check privileges

    # Delete the file from s3
    logger.info("Deleting application attachment from s3")
    file_util.delete_file(application_attachment.file_location)

    # Mark the attachment as deleted
    # We keep the record in the DB for auditing purposes
    # But still remove the actual file
    application_attachment.is_deleted = True
    # Remove the s3 path to make clear it's gone.
    application_attachment.file_location = "DELETED"
