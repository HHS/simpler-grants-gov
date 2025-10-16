import logging
import uuid

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
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
    if not can_access(user, {Privilege.MODIFY_APPLICATION}, application_attachment.application):
        raise_flask_error(403, "Forbidden")

    # Delete the file from s3
    logger.info("Deleting application attachment from s3")
    file_util.delete_file(application_attachment.file_location)

    # Delete the attachment from the DB
    db_session.delete(application_attachment)
