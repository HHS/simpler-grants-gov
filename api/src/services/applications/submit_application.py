import logging
from uuid import UUID

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def submit_application(db_session: db.Session, application_id: UUID) -> Application:
    logger.info("Processing application submit")

    application = get_application(db_session, application_id)

    # Check if the application is in the correct state
    if application.application_status != ApplicationStatus.IN_PROGRESS:
        message = f"Application cannot be submitted. It is currently in status: {application.application_status}"
        logger.warning(f"Application {application_id} submission failed: {message}")
        raise_flask_error(403, "FORBIDDEN", message)

    application.application_status = ApplicationStatus.SUBMITTED
    logger.info(
        "Application successfully submitted"
    )

    return application
