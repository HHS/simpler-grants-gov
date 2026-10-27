import logging
import signal
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from types import FrameType

from sqlalchemy import exists, func, literal, select, tuple_, update

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.adapters.aws.local_email_adapter import send_email_to_address
from src.adapters.aws.ses_adapter import build_email_tags
from src.adapters.aws.ses_suppressed_email_adapter import BaseSESV2Client
from src.api.maintenance_mode import is_maintenance_mode_enabled
from src.constants.email_constants import EmailType
from src.constants.lookup_constants import NotificationQueueStatus
from src.db.models.user_models import NotificationQueue, SuppressedEmail
from src.task.notifications.config import EmailNotificationConfig, get_email_config
from src.task.notifications.sync_suppressed_emails import SyncSuppressedEmailsTask
from src.task.service_background_task import service_background_task, service_transaction
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

TRANSACTION_GROUP = "NotificationQueueProcessor"

# Failed rows are retried on the next pass through the queue
STATUSES_TO_PROCESS = [NotificationQueueStatus.PENDING, NotificationQueueStatus.FAILED]


@task_blueprint.cli.command(
    "process-notification-queue",
    help="Continuously send the emails queued in notification_queue",
)
@service_background_task("process-notification-queue")
@flask_db.with_db_session()
def run_process_notification_queue(db_session: db.Session) -> None:
    """Main entry-point of the always-on notification queue processor"""
    NotificationQueueProcessor(db_session).run()


class NotificationQueueProcessorConfig(PydanticBaseEnvConfig):

    # How many queue rows to fetch per batch
    notification_processor_batch_size: int = 100  # NOTIFICATION_PROCESSOR_BATCH_SIZE

    # How long to wait before polling again once the queue is drained, in seconds
    notification_processor_poll_interval_sec: int = 60  # NOTIFICATION_PROCESSOR_POLL_INTERVAL_SEC

    # How many batches to run - only used for testing,
    # we have no limit under ordinary circumstances
    notification_processor_maximum_batch_count: int | None = (
        None  # NOTIFICATION_PROCESSOR_MAXIMUM_BATCH_COUNT
    )


class NotificationSendResult(StrEnum):
    SENT = "sent"
    FAILED = "failed"
    SUPPRESSED = "suppressed"
    # Another processor claimed the row, or it was already handled
    SKIPPED = "skipped"


@dataclass
class QueueCursor:
    """Position in the queue, ordered by created_at with the ID as a tiebreaker

    Rows inserted by the same enqueue run can share a created_at, so the ID
    keeps a batch boundary from skipping a row.
    """

    created_at: datetime
    notification_queue_id: uuid.UUID


@dataclass
class ClaimedNotification:
    notification_queue_id: uuid.UUID
    user_id: uuid.UUID
    email: str
    subject: str
    email_body: str
    email_type: EmailType

    def get_log_extra(self) -> dict:
        return {
            "notification_queue_id": self.notification_queue_id,
            "user_id": self.user_id,
            "email_type": self.email_type,
        }


class NotificationQueueProcessor:
    """Drain notification_queue, sending each pending or failed row via SES

    Each pass through the queue syncs the suppression list, then works through
    the rows oldest-first in batches. A cursor tracks how far the pass has gotten
    so a row that fails isn't retried until the next pass. When a batch comes back
    empty the cursor resets and the processor waits before starting the next pass.
    """

    def __init__(
        self,
        db_session: db.Session,
        config: NotificationQueueProcessorConfig | None = None,
        notification_config: EmailNotificationConfig | None = None,
        sesv2_client: BaseSESV2Client | None = None,
    ) -> None:
        self.db_session = db_session
        self.config = config or NotificationQueueProcessorConfig()
        self.notification_config = notification_config or get_email_config()
        self.sesv2_client = sesv2_client

        self.cursor: QueueCursor | None = None
        self.metrics = {
            "batches_processed": 0,
            "notifications_sent": 0,
            "notifications_failed": 0,
            "notifications_suppressed": 0,
        }
        self.sigterm_received = False
        self._shutdown_event = threading.Event()

    def run(self) -> None:
        """The 'main' loop of the processor"""
        self._register_signal_handlers()

        if is_maintenance_mode_enabled():
            self._idle_during_maintenance()
            return

        logger.info("Processing notification queue")

        batch_count = 0
        while True:
            batch_count += 1
            found_rows = self.process_batch()

            # If a sigterm signal is received we don't handle it
            # until after processing a batch has finished.
            if self.sigterm_received:
                logger.info("Exiting after receiving SIGTERM.")
                break

            # For the purposes of testing, we can configure a maximum batch
            # count to break the loop after a certain number of iterations
            if (
                self.config.notification_processor_maximum_batch_count is not None
                and batch_count >= self.config.notification_processor_maximum_batch_count
            ):
                logger.info("Exiting after batch limit reached.")
                break

            if not found_rows:
                # Returns early if a SIGTERM arrives while waiting
                self._shutdown_event.wait(self.config.notification_processor_poll_interval_sec)

        logger.info("Finished processing notification queue - exiting process", extra=self.metrics)

    def process_batch(self) -> bool:
        """Process one batch of the queue, returning whether there were any rows to process"""
        if self.cursor is None:
            if not self._start_pass():
                return False

        start = time.perf_counter()
        rows = self._fetch_batch()

        if not rows:
            logger.info("Notification queue drained, resetting cursor")
            self.cursor = None
            return False

        results: dict[NotificationSendResult, int] = {}
        for notification_queue_id, _ in rows:
            result = self.process_notification(notification_queue_id)
            results[result] = results.get(result, 0) + 1

        last_id, last_created_at = rows[-1]
        self.cursor = QueueCursor(created_at=last_created_at, notification_queue_id=last_id)
        self.metrics["batches_processed"] += 1

        logger.info(
            "Finished processing notification queue batch",
            extra={
                "batch_size": len(rows),
                "batch_duration_sec": round(time.perf_counter() - start, 3),
                **{f"{result}_count": count for result, count in results.items()},
            },
        )
        return True

    def _start_pass(self) -> bool:
        """Log the age of the oldest row and sync the suppression list if there is work to do

        Returns whether there are any rows to process.
        """
        with self.db_session.begin():
            oldest_created_at = self.db_session.execute(
                select(func.min(NotificationQueue.created_at)).where(
                    NotificationQueue.status.in_(STATUSES_TO_PROCESS)
                )
            ).scalar_one_or_none()

        oldest_age_seconds = (
            0
            if oldest_created_at is None
            else round((datetime_util.utcnow() - oldest_created_at).total_seconds(), 3)
        )
        logger.info(
            "Starting pass through notification queue",
            extra={"oldest_age_seconds": oldest_age_seconds},
        )

        if oldest_created_at is None:
            return False

        if self.notification_config.sync_suppressed_emails:
            self._sync_suppressed_emails()

        return True

    def _sync_suppressed_emails(self) -> None:
        # A failed sync shouldn't stop emails going out, the suppression
        # list we already have is still checked before each send
        try:
            SyncSuppressedEmailsTask(self.db_session, sesv2_client=self.sesv2_client).run()
        except Exception:
            logger.exception("Failed to sync suppressed emails")
            self.db_session.rollback()

    def _fetch_batch(self) -> list[tuple[uuid.UUID, datetime]]:
        stmt = (
            select(NotificationQueue.notification_queue_id, NotificationQueue.created_at)
            .where(NotificationQueue.status.in_(STATUSES_TO_PROCESS))
            .order_by(NotificationQueue.created_at, NotificationQueue.notification_queue_id)
            .limit(self.config.notification_processor_batch_size)
        )
        if self.cursor is not None:
            stmt = stmt.where(
                tuple_(NotificationQueue.created_at, NotificationQueue.notification_queue_id)
                > tuple_(
                    literal(self.cursor.created_at), literal(self.cursor.notification_queue_id)
                )
            )

        with self.db_session.begin():
            return [(row[0], row[1]) for row in self.db_session.execute(stmt)]

    def process_notification(self, notification_queue_id: uuid.UUID) -> NotificationSendResult:
        log_extra = {"notification_queue_id": notification_queue_id}
        with service_transaction("send-notification", group=TRANSACTION_GROUP):
            try:
                return self._process_notification(notification_queue_id)
            except Exception:
                # Covers errors outside the send itself (eg. the DB), the row is
                # left as-is and picked up again on the next pass
                logger.exception("Failed to process notification", extra=log_extra)
                if not self.db_session.is_active:
                    self.db_session.rollback()
                self.metrics["notifications_failed"] += 1
                return NotificationSendResult.FAILED

    def _process_notification(self, notification_queue_id: uuid.UUID) -> NotificationSendResult:
        notification = self._claim_notification(notification_queue_id)
        if not isinstance(notification, ClaimedNotification):
            return notification

        log_extra = notification.get_log_extra()
        trace_id = str(uuid.uuid4())

        # The row is in_progress while the email is sent, so the send happens
        # outside of any transaction and no other processor will pick it up
        try:
            ses_message_id = send_email_to_address(
                to_address=notification.email,
                subject=notification.subject,
                message=notification.email_body,
                trace_id=trace_id,
                email_tags=build_email_tags(notification.email_type),
            )
        except Exception:
            logger.exception(
                "Failed to send notification email", extra=log_extra | {"ses_trace_id": trace_id}
            )
            self._set_status(notification_queue_id, NotificationQueueStatus.FAILED)
            self.metrics["notifications_failed"] += 1
            return NotificationSendResult.FAILED

        self._set_status(
            notification_queue_id, NotificationQueueStatus.SENT, ses_message_id=ses_message_id
        )
        self.metrics["notifications_sent"] += 1
        logger.info(
            "Sent notification email",
            extra=log_extra | {"ses_message_id": ses_message_id, "ses_trace_id": trace_id},
        )
        return NotificationSendResult.SENT

    def _claim_notification(
        self, notification_queue_id: uuid.UUID
    ) -> ClaimedNotification | NotificationSendResult:
        """Lock the row and mark it in_progress, or suppressed/failed if it can't be sent"""
        log_extra: dict = {"notification_queue_id": notification_queue_id}

        with self.db_session.begin():
            queue_row = self.db_session.execute(
                select(NotificationQueue)
                .where(
                    NotificationQueue.notification_queue_id == notification_queue_id,
                    NotificationQueue.status.in_(STATUSES_TO_PROCESS),
                )
                .with_for_update(skip_locked=True)
            ).scalar_one_or_none()

            if queue_row is None:
                logger.info("Notification already claimed, skipping", extra=log_extra)
                return NotificationSendResult.SKIPPED

            log_extra["user_id"] = queue_row.user_id
            email = queue_row.user.email

            if email is None:
                logger.warning(
                    "User has no email address, cannot send notification", extra=log_extra
                )
                queue_row.status = NotificationQueueStatus.FAILED
                self.metrics["notifications_failed"] += 1
                return NotificationSendResult.FAILED

            if self._is_suppressed(email):
                logger.info(
                    "Email is on the suppression list, skipping notification", extra=log_extra
                )
                queue_row.status = NotificationQueueStatus.SUPPRESSED
                self.metrics["notifications_suppressed"] += 1
                return NotificationSendResult.SUPPRESSED

            queue_row.status = NotificationQueueStatus.IN_PROGRESS
            job_content = queue_row.job_content

            return ClaimedNotification(
                notification_queue_id=notification_queue_id,
                user_id=queue_row.user_id,
                email=email,
                subject=job_content.subject,
                email_body=job_content.email_body,
                email_type=EmailType(job_content.notification_type),
            )

    def _is_suppressed(self, email: str) -> bool:
        return bool(
            self.db_session.execute(
                select(exists().where(SuppressedEmail.email == email))
            ).scalar_one()
        )

    def _set_status(
        self,
        notification_queue_id: uuid.UUID,
        status: NotificationQueueStatus,
        ses_message_id: str | None = None,
    ) -> None:
        with self.db_session.begin():
            self.db_session.execute(
                update(NotificationQueue)
                .where(NotificationQueue.notification_queue_id == notification_queue_id)
                .values(status=status, ses_message_id=ses_message_id)
            )

    def _register_signal_handlers(self) -> None:
        """SIGTERM (ECS stopping the task) finishes the current batch, SIGINT exits immediately"""
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
        """Idle without touching the DB while maintenance mode is enabled

        The flag is resolved at task launch and flipped via force-new-deployment,
        so we wait for the SIGTERM that the redeploy sends.
        """
        logger.info("Skipping notification queue processing due to maintenance mode")
        self._shutdown_event.wait()
        logger.info("Exiting after receiving SIGTERM.")
