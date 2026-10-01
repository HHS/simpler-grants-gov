import logging
import uuid
from uuid import UUID

import src.adapters.db as db
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationStatus,
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
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
from src.services.workflows.send_workflow_event import send_workflow_event_to_queue
from src.util.datetime_util import utcnow
from src.workflow.event.workflow_event import StartWorkflowEventContext, WorkflowEvent

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

    _queue_application_submission_workflow(application, user)

    return application


def _queue_application_submission_workflow(application: Application, user: User) -> None:
    """Queue the workflow that builds this application's submission package.

    Failure here is deliberately non-fatal: the application is already
    submitted, and the scheduled CreateApplicationSubmissionTask will build
    the submission package on its next run if the queue is unavailable.
    """
    try:
        send_workflow_event_to_queue(
            WorkflowEvent(
                event_id=uuid.uuid4(),
                acting_user_id=user.user_id,
                event_type=WorkflowEventType.START_WORKFLOW,
                start_workflow_context=StartWorkflowEventContext(
                    workflow_type=WorkflowType.APPLICATION_SUBMISSION,
                    entity_type=WorkflowEntityType.APPLICATION,
                    entity_id=application.application_id,
                ),
            )
        )
    except Exception:
        logger.exception(
            "Failed to queue application submission workflow event - the scheduled submission task will process this application",
            extra={"application_id": application.application_id},
        )
