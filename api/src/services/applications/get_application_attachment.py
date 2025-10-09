import logging
import uuid

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege, SubmissionIssue
from src.db.models.competition_models import ApplicationAttachment
from src.db.models.user_models import User
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def get_application_attachment(
    db_session: db.Session,
    application_id: uuid.UUID,
    application_attachment_id: uuid.UUID,
    user: User,
) -> ApplicationAttachment:

    # Fetch the application which also validates if the user can access it
    application = get_application(db_session, application_id, user)
    # Check privileges
    if not can_access(user, {Privilege.VIEW_APPLICATION}, application):
        raise_flask_error(403, "Forbidden")

    # Fetch the attachment
    application_attachment = db_session.execute(
        select(ApplicationAttachment).where(
            ApplicationAttachment.application_id == application.application_id,
            ApplicationAttachment.application_attachment_id == application_attachment_id,
        )
    ).scalar_one_or_none()

    # 404 if not found
    if not application_attachment:
        logger.info(
            "Application attachment not found",
            extra={"submission_issue": SubmissionIssue.ATTACHMENT_NOT_FOUND},
        )
        raise_flask_error(
            404, f"Application attachment with ID {application_attachment_id} not found"
        )

    return application_attachment
