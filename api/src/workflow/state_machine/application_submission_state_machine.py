import logging
from enum import StrEnum
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from statemachine import Event
from statemachine.states import States

from src.adapters.aws import S3Config
from src.constants.lookup_constants import (
    ApplicationStatus,
    WorkflowEntityType,
    WorkflowType,
)
from src.db.models.competition_models import Application
from src.services.applications.create_application_submission import (
    ApplicationSubmissionBuilder,
    create_internal_token_for_pdf_generation,
)
from src.services.pdf_generation.config import PdfGenerationConfig
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.application_persistence_model import (
    ApplicationPersistenceModel,
)
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_errors import EntityLockedError, EntityNotReadyError

logger = logging.getLogger(__name__)


class ApplicationSubmissionState(StrEnum):
    START = "start"

    PENDING_SUBMISSION_CREATION = "pending_submission_creation"
    SUBMISSION_CREATED = "submission_created"

    END = "end"


application_submission_state_machine_config = WorkflowConfig(
    workflow_type=WorkflowType.APPLICATION_SUBMISSION,
    persistence_model_cls=ApplicationPersistenceModel,
    entity_type=WorkflowEntityType.APPLICATION,
    # An application only ever needs one submission built at a time -
    # reject duplicate start events while one is in flight.
    allow_concurrent_workflow_for_entity=False,
    approval_mapping={},  # No approvals
)


@WorkflowRegistry.register_workflow(application_submission_state_machine_config)
class ApplicationSubmissionStateMachine(BaseStateMachine):
    """Builds the submission package for an application right after it is submitted.

    This is the fast path for creating application submissions - the submit
    endpoint queues a start event and this workflow builds the submission
    within seconds. The scheduled CreateApplicationSubmissionTask remains
    as the safety net for anything this workflow misses.
    """

    class Metrics(StrEnum):
        APP_SUBMISSION_CREATED = "app_submission_created"
        APP_SUBMISSION_ALREADY_PROCESSED = "app_submission_already_processed"

    ### States
    states = States.from_enum(
        ApplicationSubmissionState,
        initial=ApplicationSubmissionState.START,
        final=[ApplicationSubmissionState.END],
    )

    ### Events + transitions
    start_workflow = Event(
        states.START.to(states.PENDING_SUBMISSION_CREATION, after="create_submission"),
    )

    # Build the submission package and then do finish_submission
    create_submission = Event(
        states.PENDING_SUBMISSION_CREATION.to(
            states.SUBMISSION_CREATED, after="finish_submission"
        ),
    )

    # End the submission workflow
    finish_submission = Event(
        states.SUBMISSION_CREATED.to(states.END),
    )

    def __init__(self, model: ApplicationPersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)
        self.application = model.application

    @create_submission.on
    def handle_create_submission(self, state_machine_event: StateMachineEvent) -> None:
        """Build the submission zip and mark the application as accepted."""
        log_extra = state_machine_event.get_log_extra()

        application = self._lock_application()

        # The scheduled task, a duplicate SQS delivery, or a retried event may
        # have already built this submission - in that case there's nothing to do.
        if application.application_status == ApplicationStatus.ACCEPTED:
            logger.info(
                "Application submission was already processed - nothing to do",
                extra=log_extra,
            )
            state_machine_event.increment(self.Metrics.APP_SUBMISSION_ALREADY_PROCESSED)
            return

        # Any status other than submitted most likely means the transaction that
        # sent this event hasn't committed yet - retry the event later.
        if application.application_status != ApplicationStatus.SUBMITTED:
            logger.warning(
                "Application is not in the submitted status - event will be retried",
                extra=log_extra | {"application_status": application.application_status},
            )
            raise EntityNotReadyError("Application is not in the submitted status")

        pdf_generation_config = PdfGenerationConfig()
        internal_token = create_internal_token_for_pdf_generation(
            self.db_session, pdf_generation_config
        )

        builder = ApplicationSubmissionBuilder(
            db_session=self.db_session,
            s3_config=S3Config(),
            pdf_generation_config=pdf_generation_config,
            internal_token=internal_token,
            increment=state_machine_event.increment,
        )
        application_submission = builder.build_submission(application)
        state_machine_event.increment(self.Metrics.APP_SUBMISSION_CREATED)

        logger.info(
            "Created application submission via workflow",
            extra=log_extra
            | {
                "application_submission_id": application_submission.application_submission_id,
            },
        )

    def _lock_application(self) -> Application:
        """Lock the application row for the rest of this transaction.

        This prevents the scheduled CreateApplicationSubmissionTask (or a
        concurrently-delivered duplicate of this event) from building the same
        submission twice. The task skips locked rows; a concurrent workflow
        event fails fast here and gets retried by SQS.
        """
        try:
            return self.db_session.execute(
                select(Application)
                .where(Application.application_id == self.application.application_id)
                .with_for_update(nowait=True)
                # Refresh the already-loaded application so the status check
                # below sees the latest committed value, not the value cached
                # when the workflow entity was first loaded.
                .execution_options(populate_existing=True)
            ).scalar_one()
        except OperationalError as e:
            raise EntityLockedError("Application row is locked by another process") from e
