import logging
import uuid

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
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

    # Fetch the attachment
    application_attachment = db_session.execute(
        select(ApplicationAttachment).where(
            ApplicationAttachment.application_id == application.application_id,
            ApplicationAttachment.application_attachment_id == application_attachment_id,
        )
    ).scalar_one_or_none()

    # 404 if not found
    if not application_attachment:
        raise_flask_error(
            404, f"Application attachment with ID {application_attachment_id} not found"
        )

    return application_attachment
