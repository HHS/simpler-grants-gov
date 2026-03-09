import json
import logging
import signal
import sys
import time
from types import FrameType

from pydantic import ValidationError

from src.adapters import db
from src.adapters.aws import SQSConfig
from src.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from src.adapters.db import flask_db
from src.constants.lookup_constants import WorkflowEventProcessingResult
from src.db.models.workflow_models import WorkflowEventHistory
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig
from src.util.json_util import json_encoder
from src.workflow.event.workflow_event import WorkflowEvent
from src.workflow.handler.event_handler import EventHandler
from src.workflow.workflow_background_task import workflow_transaction
from src.workflow.workflow_errors import NonRetryableWorkflowError, RetryableWorkflowError

logger = logging.getLogger(__name__)


class WorkflowManagerConfig(PydanticBaseEnvConfig):

    # How frequent we want a batch of events
    # to be fetched in seconds
    workflow_cycle_duration: int = 10  # WORKFLOW_CYCLE_DURATION

    # How many batches to run
    # Only used for testing, we have no limit
    # under ordinary circumstances
    workflow_maximum_batch_count: int | None = None  # WORKFLOW_MAXIMUM_BATCH_COUNT


class WorkflowManager:

    def __init__(self, config: WorkflowManagerConfig | None = None):
        self.sigterm_received = False
        self._register_signal_handlers()

        if config is None:
            config = WorkflowManagerConfig()
        self.config = config

        # Not sure yet how we'll handle metrics
        # This is just here to aid in testing at
        # the moment
        self.metrics = {
            "events_processed": 0,
            "batches_processed": 0,
        }

        self.sqs_config = SQSConfig()
        self.sqs_client = SQSClient(queue_url=self.sqs_config.workflow_queue_url)

    def _register_signal_handlers(self) -> None:
        """Register signal handlers to handle expected
        signals like keyboard interrupts and kill commands.

        This changes the default behavior of "end the program instantly"
        into a more graceful approach. Note that not all signals
        can be caught, and many that indicate hardware faults shouldn't.
        """
        # Make it so if a SIGTERM is received, it doesn't
        # cause the process to instantly exit so we can gracefully
        # exit. SIGTERM is sent by either calling kill on the process ID
        # and is also sent by AWS when it tells an ECS task to scale down.
        # We have 30 seconds to gracefully shutdown before a SIGKILL will be sent.
        # We do not handle SIGKILL and will allow it to kill the process.
        # https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/
        #
        # This follows a similar pattern from gunicorn which runs our API server.
        # https://github.com/benoitc/gunicorn/blob/56b5ad87f8d72a674145c273ed8f547513c2b409/gunicorn/workers/base.py#L174
        signal.signal(signal.SIGTERM, self.handle_exit)

        # SIGINT is a keyboard interrupt, if you're running locally and hit CTRL+C.
        signal.signal(signal.SIGINT, self.handle_interrupt)

        # Most other signals indicate either errors or
        # more significant kill signals that we are fine
        # with causing the program to exit instantly as normal.

    def handle_exit(self, signum: int, frame: FrameType | None) -> None:
        logger.info(
            "Received interrupt signal, will allow current processing to complete before exiting."
        )
        self.sigterm_received = True

    def handle_interrupt(self, signum: int, frame: FrameType | None) -> None:
        logger.info("Received keyboard interrupt, exiting immediately.")
        sys.exit(0)

    def parse_event(self, message: SQSMessage) -> WorkflowEvent:
        try:
            message_body = json.loads(message.body)
            return WorkflowEvent.model_validate(message_body)
        except json.JSONDecodeError as e:
            logger.exception(
                "Failed to parse SQS message body as JSON", extra={"message_id": message.message_id}
            )
            raise ValueError(f"Invalid JSON in SQS message body: {e}") from e
        except ValidationError:
            logger.exception(
                "Failed to validate SQS message as WorkflowEvent",
                extra={"message_id": message.message_id},
            )
            raise

    def process_events(self) -> None:
        """Process workflow events constantly

        The 'main' loop of the workflow manager.
        """
        logger.info("Processing workflow events")

        batch_count = 0
        while True:
            batch_count += 1
            start_time = time.perf_counter()

            self.process_batch()

            end_time = time.perf_counter()
            batch_duration = round(end_time - start_time, 3)
            logger.info(
                "Finished running workflow batch", extra={"batch_duration_sec": batch_duration}
            )

            # If a sigterm signal is received
            # we don't handle it until after
            # processing a batch has finished.
            if self.sigterm_received:
                logger.info("Exiting after receiving SIGTERM.")
                break

            # For the purposes of testing, we can configure a maximum batch
            # size count to break the loop after a certain number of iterations
            if (
                self.config.workflow_maximum_batch_count is not None
                and batch_count >= self.config.workflow_maximum_batch_count
            ):
                logger.info("Exiting after batch limit reached.")
                break

            # We want batches to run every 10 seconds at most
            # so sleep for the remaining time
            time_to_sleep = round(self.config.workflow_cycle_duration - batch_duration, 3)
            if time_to_sleep <= 0:
                time_to_sleep = 0
            logger.info("Sleeping after processing events", extra={"time_to_sleep": time_to_sleep})
            time.sleep(time_to_sleep)
            logger.info("Finished sleeping.")

        logger.info("Finished processing workflow events")

    def process_batch(self) -> None:
        """Fetch and process a batch of events from SQS."""
        messages = self.sqs_client.receive_messages(wait_time=self.config.workflow_cycle_duration)
        messages_to_delete: list[str] = []
        events = []

        # Note that the initial approach won't be multi-threaded
        # We'll follow-up on that later
        for message in messages:
            workflow_event = self.parse_event(message)
            events.append(workflow_event)
            event_result = handle_event(workflow_event)
            if event_result in [
                WorkflowEventProcessingResult.SUCCESS,
                WorkflowEventProcessingResult.NON_RETRYABLE_ERROR,
            ]:
                messages_to_delete.append(message.receipt_handle)

            logger.info(
                "Processed workflow event",
                extra=workflow_event.get_log_extra() | {"event_result": event_result},
            )

        # Delete messages that were successfully processed or had non-retryable errors
        if messages_to_delete:
            logger.info(
                "Deleting messages from current batch",
                extra={"message_count": len(messages_to_delete)},
            )
            delete_result = self.sqs_client.delete_message_batch(messages_to_delete)

            if delete_result.failed_deletes:
                logger.exception(
                    "Failed to delete messages from SQS queue",
                    extra={"failed_deletes": list(delete_result.failed_deletes)},
                )

        # Very simple metrics for test purposes
        self.metrics["batches_processed"] += 1
        self.metrics["events_processed"] += len(events)


@flask_db.with_db_session()
def handle_event(db_session: db.Session, event: WorkflowEvent) -> WorkflowEventProcessingResult:
    with workflow_transaction(f"process-{event.event_type}"):
        logger.info(
            "Processing event",
            extra={"event_type": event.event_type},
        )

        history_event = WorkflowEventHistory(
            event_data=json.dumps(event.__dict__, default=json_encoder),
            sent_at=datetime_util.utcnow(),
            is_successfully_processed=True,
            event_id=event.event_id,
        )

        try:
            with db_session.begin():
                db_session.add(history_event)
                event_handler = EventHandler(db_session, event, history_event)
                event_handler.process()
            logger.info("Successfully processed workflow event")
            return WorkflowEventProcessingResult.SUCCESS

        except NonRetryableWorkflowError:
            if db_session.is_active:
                db_session.rollback()

            with db_session.begin():
                history_event.is_successfully_processed = False
                db_session.add(history_event)
            logger.warning(
                "Encountered non-retryable workflow error while processing event", exc_info=True
            )
            return WorkflowEventProcessingResult.NON_RETRYABLE_ERROR

        except RetryableWorkflowError:
            logger.warning(
                "Encountered retryable workflow error while processing event", exc_info=True
            )
            return WorkflowEventProcessingResult.RETRYABLE_ERROR

        except Exception:
            # log specific error for any other exception
            logger.exception("Unexpected error processing workflow event")
            return WorkflowEventProcessingResult.GENERAL_ERROR
