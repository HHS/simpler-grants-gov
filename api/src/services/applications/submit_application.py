import logging
from uuid import UUID

import src.adapters.db as db
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import ApplicationAuditEvent, ApplicationStatus, Privilege
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.application_audit import add_audit_event
from src.services.applications.application_logging import add_application_metadata_to_logs
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_in_progress,
    validate_competition_open,
    validate_forms,
)
from src.services.applications.get_application import get_application
from src.services.applications.submission_queue import send_application_submission_message
from src.util.datetime_util import utcnow

logger = logging.getLogger(__name__)


def submit_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Submit an application for a competition.
    """

    logger.info("Processing application submit")

    application = get_application(db_session, application_id, user)

    # Check privileges
    check_user_access(
        db_session,
        user,
        {Privilege.SUBMIT_APPLICATION},
        application,
    )

    # This assignment will not persist if any of the form validations fail.
    application.submitted_by_user = user

    # Run validations
    validate_application_in_progress(application, ApplicationAction.SUBMIT)
    validate_competition_open(application.competition, ApplicationAction.SUBMIT)
    validate_forms(application, ApplicationAction.SUBMIT)

    # Update application status and submission metadata
    application.application_status = ApplicationStatus.SUBMITTED
    application.submitted_at = utcnow()
    logger.info("Application successfully submitted")

    # Add application metadata to logs
    add_application_metadata_to_logs(application)

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.APPLICATION_SUBMITTED,
    )

    _queue_application_submission(application, user)

    return application


def _queue_application_submission(application: Application, user: User) -> None:
    """Queue the submission-build request for this application.

    Failure here is deliberately non-fatal: the application is already
    submitted, and the scheduled CreateApplicationSubmissionTask will build
    the submission package on its next run if the queue is unavailable.
    """
    try:
        send_application_submission_message(
            application_id=application.application_id,
            submitted_by_user_id=user.user_id,
        )
    except Exception:
        logger.exception(
            "Failed to queue application submission message - the scheduled submission task will process this application",
            extra={"application_id": application.application_id},
        )
