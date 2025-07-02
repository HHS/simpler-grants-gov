import logging
from uuid import UUID

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_in_progress,
    validate_competition_open,
    validate_forms,
)
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def submit_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Submit an application for a competition.
    """

    logger.info("Processing application submit")

    application = get_application(db_session, application_id, user)

    # Run validations
    validate_application_in_progress(application, ApplicationAction.SUBMIT)
    validate_competition_open(application.competition, ApplicationAction.SUBMIT)
    validate_forms(application, ApplicationAction.SUBMIT)

    # Update application status
    application.application_status = ApplicationStatus.SUBMITTED
    logger.info("Application successfully submitted")

    return application
