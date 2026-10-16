"""Always-on consumer that builds application submissions from queue messages.

This is the fast path for creating application submissions: the submit
endpoint sends a message per application, and this consumer builds the
submission package within seconds. The scheduled
CreateApplicationSubmissionTask remains as the safety net for anything
this consumer misses.

The loop structure (long-poll, thread-per-message batches, graceful
shutdown, maintenance-mode idling) follows the same proven shape as the
workflow service's manager, without the state machine framework.
"""

import json
import logging
import signal
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from types import FrameType
from typing import Any

from flask import Flask, current_app
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from src.adapters import db
from src.adapters.aws import S3Config, SQSConfig
from src.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from src.adapters.db import flask_db
from src.api.maintenance_mode import is_maintenance_mode_enabled
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.services.applications.create_application_submission import (
    ApplicationSubmissionBuilder,
    create_internal_token_for_pdf_generation,
)
from src.services.applications.submission_queue import ApplicationSubmissionMessage
from src.services.pdf_generation.config import PdfGenerationConfig
from src.task.service_background_task import service_transaction
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

TRANSACTION_GROUP = "SubmissionConsumer"


class SubmissionConsumerLogEvent(StrEnum):
    """Distinct, queryable event types for submission consumer log records."""

    MAINTENANCE_MODE_SKIP = "maintenance_mode_submission_processing_skipped"


class SubmissionProcessingResult(StrEnum):
    SUCCESS = "success"
    # The application was already processed (eg. by the scheduled task
    # or a duplicate delivery of this message) - nothing to do.
    ALREADY_PROCESSED = "already_processed"
    # The application doesn't exist - retrying won't help.
    APPLICATION_NOT_FOUND = "application_not_found"
    # The message body couldn't be parsed - retrying won't help.
    PARSE_ERROR = "parse_error"
    # The application row is locked by another process (the scheduled
    # task, or a concurrent duplicate) - safe to retry later.
    LOCKED = "locked"
    # The application isn't in the submitted status - most likely the
    # transaction that sent this message hasn't committed yet. Retry.
    NOT_READY = "not_ready"
    # Something unexpected went wrong - the transaction rolled back. Retry.
    ERROR = "error"


# Results where the message should be deleted from the queue -
# either we succeeded, or retrying can never help. Anything a delete
# might miss is covered by the scheduled task sweeping SUBMITTED apps.
RESULTS_TO_DELETE = {
    SubmissionProcessingResult.SUCCESS,
    SubmissionProcessingResult.ALREADY_PROCESSED,
    SubmissionProcessingResult.APPLICATION_NOT_FOUND,
    SubmissionProcessingResult.PARSE_ERROR,
}


class SubmissionConsumerConfig(PydanticBaseEnvConfig):

    # How long to long-poll SQS for a batch of messages, in seconds
    submission_consumer_cycle_duration: int = 10  # SUBMISSION_CONSUMER_CYCLE_DURATION

    # How many batches to run - only used for testing,
    # we have no limit under ordinary circumstances
    submission_consumer_maximum_batch_count: int | None = (
        None  # SUBMISSION_CONSUMER_MAXIMUM_BATCH_COUNT
    )

    # Per-message timeout when processing in parallel. If a thread doesn't
    # return a result within this many seconds, we stop waiting on it,
    # treat the message as failed (kept on the queue), and move on.
    # The thread itself can't be forcibly killed - the DB transaction
    # opened inside it will commit or roll back when the underlying
    # operation eventually completes or errors; a commit after this
    # timeout is harmless as the redelivered message no-ops.
    # Sized above the slowest observed submission build (~70s in staging).
    submission_consumer_processing_timeout_sec: int = (
        120  # SUBMISSION_CONSUMER_PROCESSING_TIMEOUT_SEC
    )


@dataclass
class MessageContainer:
    receipt_handle: str
    message: ApplicationSubmissionMessage | None
    # When SQS recorded the message as sent - used to report the
    # full queued-to-processed lifecycle duration.
    sent_at: datetime

    def get_log_extra(self) -> dict[str, Any]:
        if self.message is None:
            return {}
        return self.message.get_log_extra()


class SubmissionConsumer:

    def __init__(self, config: SubmissionConsumerConfig | None = None):
        self.sigterm_received = False
        # Set when a shutdown signal is received so the maintenance-mode idle loop
        # can wake immediately rather than waiting out a full sleep interval.
        self._shutdown_event = threading.Event()
        self._register_signal_handlers()

        if config is None:
            config = SubmissionConsumerConfig()
        self.config = config

        # Record a few metrics that we'll log when the process exits.
        self.metrics = {
            "messages_processed": 0,
            "batches_processed": 0,
        }

        self.sqs_config = SQSConfig()
        self.sqs_client = SQSClient(queue_url=self.sqs_config.workflow_queue_url)

    def _register_signal_handlers(self) -> None:
        """Register signal handlers to handle expected
        signals like keyboard interrupts and kill commands.

        SIGTERM (sent by AWS when it tells an ECS task to scale down, with
        30 seconds before a SIGKILL follows) finishes the current batch
        before exiting. SIGINT (CTRL+C locally) exits immediately.
        https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/
        """
        signal.signal(signal.SIGTERM, self.handle_exit)
        signal.signal(signal.SIGINT, self.handle_interrupt)

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

    def process_messages(self) -> None:
        """Process submission messages constantly.

        The 'main' loop of the submission consumer.
        """
        if is_maintenance_mode_enabled():
            self._idle_during_maintenance()
            return

        logger.info("Processing application submission messages")

        batch_count = 0
        while True:
            batch_count += 1
            start_time = time.perf_counter()

            self.process_batch()

            end_time = time.perf_counter()
            batch_duration = round(end_time - start_time, 3)
            logger.info(
                "Finished running submission consumer batch",
                extra={"batch_duration_sec": batch_duration},
            )

            # If a sigterm signal is received we don't handle it
            # until after processing a batch has finished.
            if self.sigterm_received:
                logger.info("Exiting after receiving SIGTERM.")
                break

            # For the purposes of testing, we can configure a maximum batch
            # count to break the loop after a certain number of iterations
            if (
                self.config.submission_consumer_maximum_batch_count is not None
                and batch_count >= self.config.submission_consumer_maximum_batch_count
            ):
                logger.info("Exiting after batch limit reached.")
                break

        logger.info("Finished processing submission messages - exiting process", extra=self.metrics)

    def _idle_during_maintenance(self) -> None:
        """Idle without touching SQS or the DB while maintenance mode is enabled.

        The flag is resolved at task launch and flipped via force-new-deployment,
        so a single check at loop entry is sufficient. We wait for the SIGTERM that
        the redeploy sends.
        """
        logger.info(
            "Skipping submission processing due to maintenance mode",
            extra={"maintenance_mode_event": SubmissionConsumerLogEvent.MAINTENANCE_MODE_SKIP},
        )
        self._shutdown_event.wait()
        logger.info("Exiting after receiving SIGTERM.")

    def process_batch(self) -> tuple[list[str], list[str]]:
        """Fetch and process a batch of messages from SQS."""
        containers = self.fetch_messages()
        logger.info("Fetched SQS messages", extra={"message_count": len(containers)})

        messages_to_delete, messages_to_keep = self._handle_containers(containers)

        self.delete_messages(messages_to_delete)

        self.metrics["batches_processed"] += 1
        self.metrics["messages_processed"] += len(containers)

        # Return handles to delete and keep for testing purposes
        logger.info(
            "Processed SQS messages",
            extra={
                "successful_message_count": len(messages_to_delete),
                "failed_message_count": len(messages_to_keep),
            },
        )
        return messages_to_delete, messages_to_keep

    def _handle_containers(self, containers: list[MessageContainer]) -> tuple[list[str], list[str]]:
        """Run each message through handle_message concurrently and classify the results.

        Returns the receipt handles to delete and the receipt handles to keep on the
        queue. Each message is processed on its own thread so IO waits (DB calls,
        PDF generation, S3 uploads) overlap; the core loop stays single-threaded and
        waits for every thread in this batch to finish before any messages are deleted.
        """
        messages_to_delete: list[str] = []
        messages_to_keep: list[str] = []

        if not containers:
            return messages_to_delete, messages_to_keep

        app = current_app._get_current_object()  # type: ignore[attr-defined]
        timeout = self.config.submission_consumer_processing_timeout_sec

        with ThreadPoolExecutor(max_workers=len(containers)) as executor:
            future_to_container = {
                executor.submit(_handle_message_in_thread, app, container): container
                for container in containers
            }

            for future, container in future_to_container.items():
                try:
                    result = future.result(timeout=timeout)
                except FuturesTimeoutError:
                    # Python threads can't be forcibly killed - the thread will
                    # keep running until its DB call errors or returns. We stop
                    # waiting on it and keep the message; if the slow build
                    # eventually commits, the redelivered message no-ops.
                    logger.exception(
                        "Submission processing exceeded timeout",
                        extra=container.get_log_extra() | {"timeout_sec": timeout},
                    )
                    result = SubmissionProcessingResult.ERROR
                except Exception:
                    logger.exception(
                        "Failed to handle submission message",
                        extra=container.get_log_extra(),
                    )
                    result = SubmissionProcessingResult.ERROR

                if result in RESULTS_TO_DELETE:
                    messages_to_delete.append(container.receipt_handle)
                else:
                    messages_to_keep.append(container.receipt_handle)

        return messages_to_delete, messages_to_keep

    def fetch_messages(self) -> list[MessageContainer]:
        containers: list[MessageContainer] = []
        try:
            messages = self.sqs_client.receive_messages(
                wait_time=self.config.submission_consumer_cycle_duration
            )
        except Exception:
            logger.exception("Failed to fetch messages from SQS")
            return containers

        for message in messages:
            containers.append(
                MessageContainer(
                    receipt_handle=message.receipt_handle,
                    message=self.parse_message(message),
                    sent_at=self.parse_sent_timestamp(message),
                )
            )

        return containers

    def parse_sent_timestamp(self, message: SQSMessage) -> datetime:
        """Parse the SQS message's sent timestamp - defaulting to now on errors"""
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

    def parse_message(self, message: SQSMessage) -> ApplicationSubmissionMessage | None:
        """Parse an SQS message body, returning None if it is malformed."""
        try:
            message_body = json.loads(message.body)
            return ApplicationSubmissionMessage.model_validate(message_body)
        except json.JSONDecodeError, ValidationError:
            logger.exception(
                "Failed to parse SQS message as ApplicationSubmissionMessage",
                extra={"message_id": message.message_id},
            )
            return None

    def delete_messages(self, receipt_handles: list[str]) -> None:
        # Delete messages that were successfully processed or can never succeed
        try:
            delete_result = self.sqs_client.delete_message_batch(receipt_handles)
            if delete_result.failed_deletes:
                logger.error(
                    "Failed to delete messages from SQS queue",
                    extra={"failed_deletes": list(delete_result.failed_deletes)},
                )
        except Exception:
            logger.exception("Failed to delete messages from SQS queue")


def _handle_message_in_thread(
    app: Flask, container: MessageContainer
) -> SubmissionProcessingResult:
    # handle_message's @with_db_session decorator pulls the DB client off
    # current_app, which is per-thread. Push the app context here so the
    # decorator can find it from inside the worker thread.
    with app.app_context():
        return handle_message(container)


@flask_db.with_db_session()
def handle_message(
    db_session: db.Session, container: MessageContainer
) -> SubmissionProcessingResult:
    """Handle one submission message."""
    if container.message is None:
        return SubmissionProcessingResult.PARSE_ERROR

    with service_transaction("process-application-submission", group=TRANSACTION_GROUP):
        logger.info("Processing submission message", extra=container.get_log_extra())
        start = time.perf_counter()

        result = _process_message(db_session, container.message)

        # This log is the one we tie into for timing metrics. The handler
        # duration is how long we spent processing; the lifecycle duration
        # also includes the time the message sat on the queue.
        logger.info(
            "Finished handling submission message",
            extra=container.get_log_extra()
            | {
                "message_result": result,
                "message_handler_duration_sec": round(time.perf_counter() - start, 3),
                "message_lifecycle_duration_sec": (
                    datetime_util.utcnow() - container.sent_at
                ).total_seconds(),
            },
        )
        return result


def _process_message(
    db_session: db.Session, message: ApplicationSubmissionMessage
) -> SubmissionProcessingResult:
    """Build the submission for one application, in a single transaction.

    Any error rolls back everything - the message stays on the queue and
    SQS redelivers it after the visibility timeout.
    """
    log_extra = message.get_log_extra()
    metrics: dict[str, int] = {}

    def increment(name: str) -> None:
        metrics[name] = metrics.get(name, 0) + 1

    try:
        with db_session.begin():
            application = _lock_application(db_session, message)

            if application is None:
                logger.warning("Application not found for submission message", extra=log_extra)
                return SubmissionProcessingResult.APPLICATION_NOT_FOUND

            # The scheduled task, a duplicate delivery, or a retry of this
            # message may have already built the submission - nothing to do.
            if application.application_status == ApplicationStatus.ACCEPTED:
                logger.info(
                    "Application submission was already processed - nothing to do",
                    extra=log_extra,
                )
                return SubmissionProcessingResult.ALREADY_PROCESSED

            # Any other non-submitted status most likely means the transaction
            # that sent this message hasn't committed yet - retry later.
            if application.application_status != ApplicationStatus.SUBMITTED:
                logger.warning(
                    "Application is not in the submitted status - message will be retried",
                    extra=log_extra | {"application_status": application.application_status},
                )
                return SubmissionProcessingResult.NOT_READY

            pdf_generation_config = PdfGenerationConfig()
            internal_token = create_internal_token_for_pdf_generation(
                db_session, pdf_generation_config
            )

            builder = ApplicationSubmissionBuilder(
                db_session=db_session,
                s3_config=S3Config(),
                pdf_generation_config=pdf_generation_config,
                internal_token=internal_token,
                increment=increment,
            )
            application_submission = builder.build_submission(application)

        logger.info(
            "Created application submission via queue consumer",
            extra=log_extra
            | metrics
            | {"application_submission_id": application_submission.application_submission_id},
        )
        return SubmissionProcessingResult.SUCCESS

    except OperationalError:
        # The row lock below failed - another process (the scheduled task or
        # a concurrent duplicate of this message) is working this application.
        logger.info(
            "Application row is locked by another process - message will be retried",
            extra=log_extra,
        )
        return SubmissionProcessingResult.LOCKED

    except Exception:
        logger.exception("Failed to process submission message", extra=log_extra)
        return SubmissionProcessingResult.ERROR


def _lock_application(
    db_session: db.Session, message: ApplicationSubmissionMessage
) -> Application | None:
    """Lock the application row for the rest of this transaction.

    This prevents the scheduled CreateApplicationSubmissionTask (or a
    concurrently-delivered duplicate of this message) from building the same
    submission twice. The task skips locked rows; a concurrent consumer
    thread fails fast here (OperationalError) and the message is retried.
    """
    return db_session.execute(
        select(Application)
        .where(Application.application_id == message.application_id)
        .with_for_update(nowait=True)
    ).scalar_one_or_none()
