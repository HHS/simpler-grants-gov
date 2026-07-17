import json
import logging
import signal
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeoutError
from datetime import datetime
from enum import StrEnum
from types import FrameType

from flask import Flask, current_app
from grants_shared.adapters import db
from grants_shared.adapters.aws import SQSConfig
from grants_shared.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from grants_shared.adapters.db import flask_db
from grants_shared.api.maintenance_mode import is_maintenance_mode_enabled
from grants_shared.util import datetime_util
from grants_shared.util.json_util import json_encoder
from pydantic import ValidationError

from src.adapters.search import SearchClient, flask_opensearch
from src.constants.lookup_constants import WorkflowEventProcessingResult
from src.db.models.workflow_models import WorkflowEventHistory
from src.util.env_config import PydanticBaseEnvConfig
from src.workflow.event.sqs_message_container import SqsMessageContainer
from src.workflow.event.workflow_event import WorkflowEvent
from src.workflow.handler.event_handler import EventHandler
from src.workflow.registry.workflow_client_registry import init_workflow_client_registry
from src.workflow.workflow_background_task import workflow_transaction
from src.workflow.workflow_errors import NonRetryableWorkflowError, RetryableWorkflowError

logger = logging.getLogger(__name__)


class WorkflowManagerLogEvent(StrEnum):
    """Distinct, queryable event types for workflow manager log records."""

    MAINTENANCE_MODE_SKIP = "maintenance_mode_workflow_processing_skipped"


class WorkflowManagerConfig(PydanticBaseEnvConfig):

    # How frequent we want a batch of events
    # to be fetched in seconds
    workflow_cycle_duration: int = 10  # WORKFLOW_CYCLE_DURATION

    # How many batches to run
    # Only used for testing, we have no limit
    # under ordinary circumstances
    workflow_maximum_batch_count: int | None = None  # WORKFLOW_MAXIMUM_BATCH_COUNT

    # Per-event timeout when processing in parallel. If a thread doesn't
    # return a result within this many seconds, we stop waiting on it,
    # treat the event as failed (message kept on the queue), and move on.
    # The thread itself can't be forcibly killed - the DB transaction
    # opened inside it will roll back when the underlying operation
    # eventually errors or completes.
    workflow_event_processing_timeout_sec: int = 30  # WORKFLOW_EVENT_PROCESSING_TIMEOUT_SEC


class WorkflowManager:

    def __init__(self, config: WorkflowManagerConfig | None = None):
        self.sigterm_received = False
        # Set when a shutdown signal is received so the maintenance-mode idle loop
        # can wake immediately rather than waiting out a full sleep interval.
        self._shutdown_event = threading.Event()
        self._register_signal_handlers()

        if config is None:
            config = WorkflowManagerConfig()
        self.config = config

        # Record a few metrics that we'll log when the process exits.
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
        self._shutdown_event.set()

    def handle_interrupt(self, signum: int, frame: FrameType | None) -> None:
        logger.info("Received keyboard interrupt, exiting immediately.")
        self._shutdown_event.set()
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

    def parse_sent_timestamp(self, message: SQSMessage) -> datetime:
        """Parse the SQS messages timestamp - defaulting to now on errors"""
        sent_timestamp = message.attributes.get("SentTimestamp", None)
        if sent_timestamp is None:
            logger.warning(
                "SQS message was missing sent timestamp - defaulting to now",
                extra={"message_id": message.message_id},
            )
            return datetime_util.utcnow()

        try:
            return datetime_util.from_timestamp(int(sent_timestamp))
        except Exception:
            logger.exception(
                "Could not convert timestamp from SQS message to datetime - defaulting to now",
                extra={"message_id": message.message_id},
            )
            return datetime_util.utcnow()

    def process_events(self) -> None:
        """Process workflow events constantly

        The 'main' loop of the workflow manager.
        """
        if is_maintenance_mode_enabled():
            self._idle_during_maintenance()
            return

        logger.info("Processing workflow events")
        initialize_workflow_client_registry()

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

        logger.info("Finished processing workflow events - exiting process", extra=self.metrics)

    def _idle_during_maintenance(self) -> None:
        """Idle without touching SQS or the DB while maintenance mode is enabled.

        The flag is resolved at task launch and flipped via force-new-deployment,
        so a single check at loop entry is sufficient. We wait for the SIGTERM that
        the redeploy sends, checking periodically so shutdown stays responsive.
        """
        logger.info(
            "Skipping workflow processing due to maintenance mode",
            extra={"maintenance_mode_event": WorkflowManagerLogEvent.MAINTENANCE_MODE_SKIP},
        )
        # Block until a shutdown signal wakes us. handle_exit/handle_interrupt set the
        # event, so this returns promptly on SIGTERM instead of waiting out a sleep.
        self._shutdown_event.wait()
        logger.info("Exiting after receiving SIGTERM.")

    def process_batch(self) -> tuple[list[str], list[str]]:
        """Fetch and process a batch of events from SQS."""
        sqs_containers = self.fetch_messages()
        logger.info("Fetched SQS messages", extra={"message_count": len(sqs_containers)})

        messages_to_delete, messages_to_keep = self._handle_containers(sqs_containers)

        self.delete_messages(messages_to_delete)

        # Very simple metrics for test purposes
        self.metrics["batches_processed"] += 1
        self.metrics["events_processed"] += len(sqs_containers)

        # return messages to delete and messages to keep handles for testing purposes
        logger.info(
            "Processed SQS messages",
            extra={
                "successful_message_count": len(messages_to_delete),
                "failed_message_count": len(messages_to_keep),
            },
        )
        return messages_to_delete, messages_to_keep

    def _handle_containers(
        self, sqs_containers: list[SqsMessageContainer]
    ) -> tuple[list[str], list[str]]:
        """Run each container through handle_event concurrently and classify the results.

        Returns the receipt handles to delete and the receipt handles to keep on the queue.
        Each container is processed on its own thread so IO waits (DB calls, downstream
        services) overlap; the core loop stays single-threaded and waits for every thread
        in this batch to finish before any messages are deleted.
        """
        messages_to_delete: list[str] = []
        messages_to_keep: list[str] = []

        if not sqs_containers:
            return messages_to_delete, messages_to_keep

        app = current_app._get_current_object()  # type: ignore[attr-defined]
        timeout = self.config.workflow_event_processing_timeout_sec

        with ThreadPoolExecutor(max_workers=len(sqs_containers)) as executor:
            future_to_container = {
                executor.submit(_handle_event_in_thread, app, container): container
                for container in sqs_containers
            }

            for future, sqs_container in future_to_container.items():
                try:
                    event_result = future.result(timeout=timeout)
                except FuturesTimeoutError:
                    # Python threads can't be forcibly killed - the thread will
                    # keep running until its DB call errors or returns, at which
                    # point the surrounding transaction rolls back. We stop waiting
                    # on it and treat the message as failed.
                    logger.exception(
                        "Workflow event handler exceeded timeout",
                        extra=sqs_container.get_log_extra() | {"timeout_sec": timeout},
                    )
                    event_result = WorkflowEventProcessingResult.GENERAL_ERROR
                except Exception:
                    logger.exception(
                        "Failed to handle current event",
                        extra=sqs_container.get_log_extra(),
                    )
                    event_result = WorkflowEventProcessingResult.GENERAL_ERROR

                if event_result in [
                    WorkflowEventProcessingResult.SUCCESS,
                    WorkflowEventProcessingResult.NON_RETRYABLE_ERROR,
                ]:
                    messages_to_delete.append(sqs_container.receipt_handle)
                else:
                    messages_to_keep.append(sqs_container.receipt_handle)

        return messages_to_delete, messages_to_keep

    def fetch_messages(self) -> list[SqsMessageContainer]:
        containers: list[SqsMessageContainer] = []
        try:
            messages = self.sqs_client.receive_messages(
                wait_time=self.config.workflow_cycle_duration
            )
        except Exception:
            logger.exception("Failed to fetch messages from SQS")
            return containers

        for message in messages:
            try:
                event = self.parse_event(message)
                history_event = WorkflowEventHistory(
                    event_data=json.dumps(event.model_dump(), default=json_encoder),
                    sent_at=self.parse_sent_timestamp(message),
                    # This might change if it errors - but default to True
                    is_successfully_processed=True,
                    event_id=event.event_id,
                )
                containers.append(
                    SqsMessageContainer(
                        receipt_handle=message.receipt_handle,
                        workflow_event=event,
                        history_event=history_event,
                    )
                )
            except Exception:
                logger.exception("Failed to convert SQS message")
                continue

        return containers

    def delete_messages(self, receipt_handles: list[str]) -> None:
        # Delete messages that were successfully processed or had non-retryable errors
        try:
            delete_result = self.sqs_client.delete_message_batch(receipt_handles)
            if delete_result.failed_deletes:
                logger.error(
                    "Failed to delete messages from SQS queue",
                    extra={"failed_deletes": list(delete_result.failed_deletes)},
                )
        except Exception:
            logger.exception("Failed to delete messages from SQS queue")


def _handle_event_in_thread(
    app: Flask, sqs_container: SqsMessageContainer
) -> WorkflowEventProcessingResult:
    # handle_event's @with_db_session decorator pulls the DB client off
    # current_app, which is per-thread. Push the app context here so the
    # decorator can find it from inside the worker thread.
    with app.app_context():
        return handle_event(sqs_container)


@flask_db.with_db_session()
def handle_event(
    db_session: db.Session, sqs_container: SqsMessageContainer
) -> WorkflowEventProcessingResult:
    """Handle an SQS event"""
    with workflow_transaction(sqs_container.workflow_event.event_type):
        logger.info(
            "Processing event",
            extra=sqs_container.get_log_extra(),
        )

        return _handle_event(db_session, sqs_container)


def _handle_event(
    db_session: db.Session, sqs_container: SqsMessageContainer
) -> WorkflowEventProcessingResult:
    """
    Handle the SQS event:

    * DB session management - any errors will rollback all changes
                              except non-retryable ones which only
                              persist their history event.
    * Logging / metrics inclusion
    * Error handling of the various cases
    """

    log_extra = sqs_container.get_log_extra()
    result = WorkflowEventProcessingResult.SUCCESS
    error: Exception | None = None

    try:
        with db_session.begin():
            db_session.add(sqs_container.history_event)
            EventHandler(db_session, sqs_container).process()

    except NonRetryableWorkflowError as e:
        if db_session.is_active:
            db_session.rollback()

        with db_session.begin():
            sqs_container.history_event.is_successfully_processed = False
            db_session.add(sqs_container.history_event)
        logger.warning(
            "Encountered non-retryable workflow error while processing event",
            exc_info=True,
            extra=log_extra,
        )
        result = WorkflowEventProcessingResult.NON_RETRYABLE_ERROR
        error = e

    except RetryableWorkflowError as e:
        logger.warning(
            "Encountered retryable workflow error while processing event",
            exc_info=True,
            extra=log_extra,
        )
        result = WorkflowEventProcessingResult.RETRYABLE_ERROR
        error = e

    except Exception as e:
        # log specific error for any other exception
        logger.exception("Unexpected error processing workflow event", extra=log_extra)
        result = WorkflowEventProcessingResult.GENERAL_ERROR
        error = e

    # Add whatever to the log extra that was added to the metric context
    # Even if the above errored, there could be a bit more info we pull out
    log_extra |= sqs_container.workflow_metric_context.log_extra
    log_extra |= sqs_container.workflow_metric_context.metrics

    log_extra |= {
        "event_result": result,
        "event_lifecycle_duration_sec": (
            datetime_util.utcnow() - sqs_container.history_event.sent_at
        ).total_seconds(),
    }

    if error is not None:
        log_extra["error_cls"] = error.__class__.__name__

    # This log is one that we'll tie into heavily for metrics
    logger.info("Finished handling event", extra=log_extra)

    return result


@flask_opensearch.with_search_client()
def initialize_workflow_client_registry(search_client: SearchClient) -> None:
    init_workflow_client_registry(search_client)
