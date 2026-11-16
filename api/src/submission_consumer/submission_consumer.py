import json
import logging
import signal
import sys
import threading
import time
import uuid
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import StrEnum
from types import FrameType
from typing import Any

from flask import Flask, current_app
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

import src.adapters.db as db
from src.adapters.aws import S3Config, SQSConfig
from src.adapters.aws.sqs_adapter import SQSClient
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


class SubmissionSource(StrEnum):
    """What triggered processing of an application - logged as source
    so the queue and reconciler paths can be counted separately."""

    QUEUE = "queue"
    RECONCILER = "reconciler"


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

    # How often the reconciler sweep runs, in seconds. On each pass the
    # consumer queries for applications that have been stuck in SUBMITTED
    # longer than the age threshold and processes them directly, bypassing
    # the queue. This is the safety net for messages that were never sent,
    # were dropped, or exhausted their SQS retries and went to the DLQ.
    submission_consumer_reconcile_interval_sec: int = (
        3600  # SUBMISSION_CONSUMER_RECONCILE_INTERVAL_SEC
    )

    # Minimum time since submitted_at before the reconciler will pick up a
    # SUBMITTED application, in seconds. This prevents the reconciler from
    # racing with the queue path on freshly submitted applications whose SQS
    # message is already in flight and about to be processed normally.
    submission_consumer_reconcile_age_threshold_sec: int = (
        300  # SUBMISSION_CONSUMER_RECONCILE_AGE_THRESHOLD_SEC
    )

    # Maximum number of stale applications the reconciler processes in a
    # single pass. The pass runs on the main loop, so this bounds how long
    # queue processing is paused while the reconciler works through a backlog.
    submission_consumer_reconcile_batch_size: int = 50  # SUBMISSION_CONSUMER_RECONCILE_BATCH_SIZE


@dataclass
class MessageContainer:
    receipt_handle: str
    message: ApplicationSubmissionMessage | None
    # When SQS recorded the message as sent - used to report the
    # full queued-to-processed lifecycle duration.
    sent_at: datetime

    def get_log_extra(self) -> dict[str, Any]:
        log_extra: dict[str, Any] = {"source": SubmissionSource.QUEUE}
        if self.message is None:
            return log_extra
        return log_extra | self.message.get_log_extra()


class SubmissionConsumer:
    def __init__(self, config: SubmissionConsumerConfig | None = None) -> None:
        self.sqs_config = SQSConfig()
        self.sqs_client = SQSClient(queue_url=self.sqs_config.workflow_queue_url)

        self.metrics = {
            "messages_processed": 0,
            "batches_processed": 0,
        }
        self.sigterm_received = False
        self._shutdown_event = threading.Event()
        self._register_signal_handlers()
        self.config = config if config else SubmissionConsumerConfig()

        self._last_reconcile_time: float | None = None

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

            # Run the reconciler sweep on the first batch and then
            # every time the configured interval has elapsed
            if self._is_reconcile_due():
                self._run_reconcile_pass()

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

    def _is_reconcile_due(self) -> bool:
        if self._last_reconcile_time is None:
            return True
        elapsed = time.monotonic() - self._last_reconcile_time
        return elapsed >= self.config.submission_consumer_reconcile_interval_sec

    def _run_reconcile_pass(self) -> None:
        """Run a reconcile pass, never letting a failure escape the main loop.

        The reconciler is the safety net for the queue path, so a failure in
        it (eg. a DB blip during the query) must not take down queue
        processing. The next attempt waits for the full interval either way.
        """
        self._last_reconcile_time = time.monotonic()
        try:
            reconcile_stale_submissions(
                self.config.submission_consumer_reconcile_age_threshold_sec,
                self.config.submission_consumer_reconcile_batch_size,
                should_stop=lambda: self.sigterm_received,
            )
        except Exception:
            logger.exception("Reconciler sweep failed - will retry next interval")

    def process_batch(self) -> tuple[list[str], list[str]]:
        containers = self.fetch_messages()

        logger.info("Fetched SQS messages", extra={"message_count": len(containers)})

        messages_to_delete, messages_to_keep = self.handle_containers(containers)
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

    def fetch_messages(self) -> list[MessageContainer]:
        containers = []
        messages = self.sqs_client.receive_messages(
            wait_time=self.config.submission_consumer_cycle_duration
        )
        for m in messages:
            try:
                application_submission_message = ApplicationSubmissionMessage.model_validate(
                    json.loads(m.body)
                )
            except ValidationError, json.JSONDecodeError:
                application_submission_message = None
                logger.exception(
                    "Failed to parse SQS message as ApplicationSubmissionMessage",
                    extra={"message_id": m.message_id},
                )
            sent_timestamp = m.attributes.get("SentTimestamp", None)
            if sent_timestamp is not None:
                try:
                    sent_datetime = datetime_util.from_timestamp(int(sent_timestamp))
                except Exception:
                    logger.exception(
                        "Could not convert timestamp from SQS message to datetime - defaulting to now",
                        extra={"message_id": m.message_id},
                    )
                    sent_datetime = datetime_util.utcnow()
            else:
                logger.warning(
                    "SQS message was missing sent timestamp - defaulting to now",
                    extra={"message_id": m.message_id},
                )
                sent_datetime = datetime_util.utcnow()
            containers.append(
                MessageContainer(
                    receipt_handle=m.receipt_handle,
                    message=application_submission_message,
                    sent_at=sent_datetime,
                )
            )
        return containers

    def delete_messages(self, receipt_handles: list[str]) -> None:
        try:
            delete_result = self.sqs_client.delete_message_batch(receipt_handles)
            if delete_result.failed_deletes:
                logger.error(
                    "Failed to delete messages from SQS queue",
                    extra={"failed_deletes": list(delete_result.failed_deletes)},
                )
        except Exception:
            logger.exception(
                "SQS delete message batch failed",
                extra={"failed_deletes": list(receipt_handles)},
            )

    def handle_containers(self, containers: list[MessageContainer]) -> tuple[list[str], list[str]]:
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


def process_application_submission_message(
    db_session: db.Session,
    message: ApplicationSubmissionMessage,
    pdf_generation_config: PdfGenerationConfig | None = None,
    s3_config: S3Config | None = None,
) -> SubmissionProcessingResult:
    log_extra = message.get_log_extra() | {"source": SubmissionSource.QUEUE}
    return process_application_submission(
        db_session, message.application_id, log_extra, pdf_generation_config, s3_config
    )


def process_application_submission(
    db_session: db.Session,
    application_id: uuid.UUID,
    log_extra: dict[str, Any],
    pdf_generation_config: PdfGenerationConfig | None = None,
    s3_config: S3Config | None = None,
) -> SubmissionProcessingResult:
    """Build the submission for one application in its own transaction.

    Shared by the queue path and the reconciler so both use the same
    locking, status checks, and result taxonomy.
    """
    try:
        return _process_application_submission(
            db_session, application_id, log_extra, pdf_generation_config, s3_config
        )
    except OperationalError:
        logger.info(
            "Application row is locked by another process - message will be retried",
            extra=log_extra,
        )
        return SubmissionProcessingResult.LOCKED
    except Exception:
        logger.exception("Failed to process submission message", extra=log_extra)
        return SubmissionProcessingResult.ERROR


def _process_application_submission(
    db_session: db.Session,
    application_id: uuid.UUID,
    log_extra: dict[str, Any],
    pdf_generation_config: PdfGenerationConfig | None = None,
    s3_config: S3Config | None = None,
) -> SubmissionProcessingResult:
    metrics: dict[str, int] = {}

    def increment(name: str) -> None:
        metrics[name] = metrics.get(name, 0) + 1

    with db_session.begin():
        application = get_locked_application(db_session, application_id)
        if not application:
            logger.warning("Application not found for submission message", extra=log_extra)
            return SubmissionProcessingResult.APPLICATION_NOT_FOUND
        if application.application_status == ApplicationStatus.ACCEPTED:
            logger.info(
                "Application submission was already processed - nothing to do",
                extra=log_extra,
            )
            return SubmissionProcessingResult.ALREADY_PROCESSED
        if application.application_status != ApplicationStatus.SUBMITTED:
            logger.warning(
                "Application is not in the submitted status - message will be retried",
                extra=log_extra | {"application_status": application.application_status},
            )
            return SubmissionProcessingResult.NOT_READY
        pdf_generation_config = pdf_generation_config or PdfGenerationConfig()
        s3_config = s3_config if s3_config else S3Config()
        internal_token = create_internal_token_for_pdf_generation(db_session, pdf_generation_config)
        application_submission_builder = ApplicationSubmissionBuilder(
            db_session,
            s3_config,
            pdf_generation_config,
            increment,
            internal_token,
        )
        application_submission_builder.build_application_submission(application)
        return SubmissionProcessingResult.SUCCESS


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

        result = process_application_submission_message(db_session, container.message)

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


def get_locked_application(db_session: db.Session, application_id: uuid.UUID) -> Application | None:
    return db_session.execute(
        select(Application)
        .where(Application.application_id == application_id)
        .with_for_update(nowait=True)
    ).scalar_one_or_none()


@flask_db.with_db_session()
def reconcile_stale_submissions(
    db_session: db.Session,
    reconcile_age_threshold_sec: int,
    batch_size: int,
    should_stop: Callable[[], bool] = lambda: False,
) -> None:
    """Query for applications stuck in SUBMITTED and process them directly.

    This is the safety net for submissions whose SQS message was never
    sent, was dropped, or exhausted its retries and moved to the DLQ.
    It runs on a fixed interval inside the main consumer loop.

    Each application is processed in its own transaction through the same
    path as a queue message (FOR UPDATE NOWAIT + status re-check), so
    a finished build commits immediately and a row held by the queue path
    or the scheduled task is skipped as locked and picked up next pass.

    Each application found is logged with source=reconciler.
    """
    age_threshold = datetime_util.utcnow() - timedelta(seconds=reconcile_age_threshold_sec)
    with db_session.begin():
        stale_application_ids = db_session.scalars(
            select(Application.application_id)
            .where(
                Application.application_status == ApplicationStatus.SUBMITTED,
                Application.submitted_at < age_threshold,
            )
            .limit(batch_size)
        ).all()

    logger.info(
        "Running reconciler sweep",
        extra={"stale_submitted_count": len(stale_application_ids)},
    )

    for application_id in stale_application_ids:
        # A SIGTERM gives us ~30 seconds before ECS kills the process, so stop
        # between applications rather than starting another build. Anything
        # left over is picked up by the next pass.
        if should_stop():
            logger.info("Stopping reconciler sweep early after receiving SIGTERM")
            break

        log_extra = get_reconciler_log_extra(application_id)
        with service_transaction("reconcile-application-submission", group=TRANSACTION_GROUP):
            start = time.perf_counter()

            result = process_application_submission(db_session, application_id, log_extra)

            logger.info(
                "Finished handling submission message",
                extra=log_extra
                | {
                    "message_result": result,
                    "message_handler_duration_sec": round(time.perf_counter() - start, 3),
                },
            )


def get_reconciler_log_extra(application_id: uuid.UUID) -> dict[str, Any]:
    return {
        "application_id": application_id,
        "source": SubmissionSource.RECONCILER,
    }
