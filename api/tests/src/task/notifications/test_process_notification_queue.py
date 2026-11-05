import logging
from datetime import timedelta
from unittest.mock import patch

import pytest
from botocore.exceptions import ClientError
from sqlalchemy import delete, select

import src.task.notifications.process_notification_queue as process_notification_queue
import tests.src.db.models.factories as factories
from src.adapters.aws.ses_suppressed_email_adapter import MockSESV2Client, SuppressedDestination
from src.api.maintenance_mode import get_maintenance_mode_config
from src.constants.lookup_constants import ExternalUserType, NotificationQueueStatus
from src.db.models.user_models import NotificationJobContent, NotificationQueue, SuppressedEmail
from src.task.notifications.config import EmailNotificationConfig, _reset_email_config
from src.task.notifications.process_notification_queue import (
    NotificationQueueProcessor,
    NotificationQueueProcessorConfig,
    NotificationSendResult,
)
from src.task.notifications.sync_suppressed_emails import SyncSuppressedEmailsTask
from src.util import datetime_util

SES_MESSAGE_ID = "test-ses-message-id"


class FakeEmailSender:
    def __init__(self, fail_for: set[str] | None = None):
        self.calls: list[dict] = []
        self.fail_for = fail_for or set()
        self.error: Exception = Exception("Failed to send")

    def __call__(self, **kwargs) -> str:
        self.calls.append(kwargs)
        if kwargs["to_address"] in self.fail_for:
            raise self.error
        return SES_MESSAGE_ID

    @property
    def to_addresses(self) -> list[str]:
        return [call["to_address"] for call in self.calls]


@pytest.fixture(autouse=True)
def clear_data(db_session):
    db_session.execute(delete(NotificationQueue))
    db_session.execute(delete(NotificationJobContent))
    db_session.execute(delete(SuppressedEmail))
    db_session.commit()


@pytest.fixture
def processor_session(db_client):
    with db_client.get_session() as session:
        yield session


@pytest.fixture
def email_sender(monkeypatch):
    sender = FakeEmailSender()
    monkeypatch.setattr(process_notification_queue, "send_email_to_address", sender)
    return sender


@pytest.fixture
def notification_config():
    config = EmailNotificationConfig()
    config.sync_suppressed_emails = False
    return config


@pytest.fixture
def job_content(enable_factory_create):
    return factories.NotificationJobContentFactory.create()


def build_processor(
    processor_session, notification_config, sesv2_client=None, **config_kwargs
) -> NotificationQueueProcessor:
    config = NotificationQueueProcessorConfig(
        **{
            "notification_processor_poll_interval_sec": 0,
            "notification_processor_maximum_batch_count": 1,
            **config_kwargs,
        }
    )
    return NotificationQueueProcessor(
        processor_session,
        config=config,
        notification_config=notification_config,
        sesv2_client=sesv2_client,
    )


def create_queue_row(job_content, email: str | None = None, **kwargs) -> NotificationQueue:
    user = factories.UserFactory.create()
    if email is not None:
        factories.LinkExternalUserFactory.create(
            user=user, email=email, external_user_type=ExternalUserType.LOGIN_GOV
        )
    return factories.NotificationQueueFactory.create(job_content=job_content, user=user, **kwargs)


def get_queue_row(db_session, queue_row) -> NotificationQueue:
    db_session.expire_all()
    return db_session.execute(
        select(NotificationQueue).where(
            NotificationQueue.notification_queue_id == queue_row.notification_queue_id
        )
    ).scalar_one()


def test_sends_pending_notification(
    db_session, processor_session, notification_config, email_sender, job_content
):
    """A pending row is sent with its job content and email_type tag, then marked sent"""
    queue_row = create_queue_row(job_content, email="user@example.com")

    build_processor(processor_session, notification_config).run()

    assert len(email_sender.calls) == 1
    call = email_sender.calls[0]
    assert call["to_address"] == "user@example.com"
    assert call["subject"] == job_content.subject
    assert call["message"] == job_content.email_body
    assert call["email_tags"] == {"email_type": "all_new_opportunities"}
    queue_row = get_queue_row(db_session, queue_row)
    assert queue_row.status == NotificationQueueStatus.SENT
    assert queue_row.ses_message_id == SES_MESSAGE_ID


def test_retries_failed_notification(
    db_session, processor_session, notification_config, email_sender, job_content
):
    queue_row = create_queue_row(
        job_content, email="user@example.com", status=NotificationQueueStatus.FAILED
    )

    build_processor(processor_session, notification_config).run()

    assert email_sender.to_addresses == ["user@example.com"]
    assert get_queue_row(db_session, queue_row).status == NotificationQueueStatus.SENT


def test_send_failure_marks_notification_failed(
    db_session, processor_session, notification_config, email_sender, job_content
):
    email_sender.fail_for = {"fails@example.com"}
    failed_row = create_queue_row(job_content, email="fails@example.com")
    sent_row = create_queue_row(job_content, email="user@example.com")

    build_processor(processor_session, notification_config).run()

    failed_row = get_queue_row(db_session, failed_row)
    assert failed_row.status == NotificationQueueStatus.FAILED
    assert failed_row.ses_message_id is None
    assert get_queue_row(db_session, sent_row).status == NotificationQueueStatus.SENT


def test_suppressed_email_is_not_sent(
    db_session, processor_session, notification_config, email_sender, job_content
):
    factories.SuppressedEmailFactory.create(email="suppressed@example.com")
    queue_row = create_queue_row(job_content, email="suppressed@example.com")

    build_processor(processor_session, notification_config).run()

    assert email_sender.calls == []
    queue_row = get_queue_row(db_session, queue_row)
    assert queue_row.status == NotificationQueueStatus.SUPPRESSED
    assert queue_row.ses_message_id is None


def test_user_without_email_marks_notification_failed(
    db_session, processor_session, notification_config, email_sender, job_content
):
    queue_row = create_queue_row(job_content, email=None)

    build_processor(processor_session, notification_config).run()

    assert email_sender.calls == []
    assert get_queue_row(db_session, queue_row).status == NotificationQueueStatus.FAILED


@pytest.mark.parametrize(
    "status",
    [
        NotificationQueueStatus.IN_PROGRESS,
        NotificationQueueStatus.SENT,
        NotificationQueueStatus.SUPPRESSED,
    ],
)
def test_skips_rows_not_pending_or_failed(
    db_session, processor_session, notification_config, email_sender, job_content, status
):
    queue_row = create_queue_row(job_content, email="user@example.com", status=status)

    build_processor(processor_session, notification_config).run()

    assert email_sender.calls == []
    assert get_queue_row(db_session, queue_row).status == status


def test_processes_oldest_first(processor_session, notification_config, email_sender, job_content):
    now = datetime_util.utcnow()
    create_queue_row(job_content, email="newest@example.com", created_at=now)
    create_queue_row(job_content, email="oldest@example.com", created_at=now - timedelta(hours=2))
    create_queue_row(job_content, email="middle@example.com", created_at=now - timedelta(hours=1))

    build_processor(processor_session, notification_config).run()

    assert email_sender.to_addresses == [
        "oldest@example.com",
        "middle@example.com",
        "newest@example.com",
    ]


def test_cursor_advances_and_resets_when_drained(
    processor_session, notification_config, email_sender, job_content
):
    now = datetime_util.utcnow()
    first = create_queue_row(job_content, email="first@example.com", created_at=now)
    second = create_queue_row(
        job_content, email="second@example.com", created_at=now + timedelta(seconds=1)
    )
    processor = build_processor(
        processor_session, notification_config, notification_processor_batch_size=1
    )

    assert processor.process_batch() is True
    assert processor.cursor.notification_queue_id == first.notification_queue_id

    assert processor.process_batch() is True
    assert processor.cursor.notification_queue_id == second.notification_queue_id

    assert processor.process_batch() is False
    assert processor.cursor is None
    assert email_sender.to_addresses == ["first@example.com", "second@example.com"]


def test_failed_row_is_retried_on_next_pass(
    db_session, processor_session, notification_config, email_sender, job_content
):
    """A row that fails is behind the cursor, so it isn't retried until the queue drains"""
    email_sender.fail_for = {"flaky@example.com"}
    now = datetime_util.utcnow()
    flaky_row = create_queue_row(job_content, email="flaky@example.com", created_at=now)
    create_queue_row(job_content, email="user@example.com", created_at=now + timedelta(seconds=1))
    processor = build_processor(
        processor_session, notification_config, notification_processor_batch_size=1
    )

    processor.process_batch()
    processor.process_batch()
    assert email_sender.to_addresses == ["flaky@example.com", "user@example.com"]

    # Drains the queue and resets the cursor
    assert processor.process_batch() is False

    email_sender.fail_for = set()
    assert processor.process_batch() is True
    assert email_sender.to_addresses == [
        "flaky@example.com",
        "user@example.com",
        "flaky@example.com",
    ]
    assert get_queue_row(db_session, flaky_row).status == NotificationQueueStatus.SENT


def test_rows_with_same_created_at_are_not_skipped(
    processor_session, notification_config, email_sender, job_content
):
    """Rows from one enqueue run can share a created_at, the cursor uses the ID as a tiebreaker"""
    now = datetime_util.utcnow()
    for i in range(3):
        create_queue_row(job_content, email=f"user{i}@example.com", created_at=now)
    processor = build_processor(
        processor_session,
        notification_config,
        notification_processor_batch_size=1,
        notification_processor_maximum_batch_count=4,
    )

    processor.run()

    assert len(email_sender.calls) == 3
    assert len(set(email_sender.to_addresses)) == 3


def test_locked_row_is_skipped(
    db_session, db_client, processor_session, notification_config, email_sender, job_content
):
    """A row locked by another processor is skipped rather than sent twice"""
    queue_row = create_queue_row(job_content, email="user@example.com")
    processor = build_processor(processor_session, notification_config)

    with db_client.get_session() as other_session, other_session.begin():
        other_session.execute(
            select(NotificationQueue)
            .where(NotificationQueue.notification_queue_id == queue_row.notification_queue_id)
            .with_for_update()
        )
        result = processor.process_notification(queue_row.notification_queue_id)

    assert result == NotificationSendResult.SKIPPED
    assert email_sender.calls == []
    assert get_queue_row(db_session, queue_row).status == NotificationQueueStatus.PENDING


def test_logs_oldest_age_seconds(
    processor_session, notification_config, email_sender, job_content, caplog
):
    caplog.set_level(logging.INFO)
    create_queue_row(
        job_content,
        email="user@example.com",
        created_at=datetime_util.utcnow() - timedelta(hours=1),
    )
    create_queue_row(
        job_content,
        email="sent@example.com",
        created_at=datetime_util.utcnow() - timedelta(hours=5),
        status=NotificationQueueStatus.SENT,
    )

    build_processor(processor_session, notification_config).run()

    record = next(
        r for r in caplog.records if r.message == "Starting pass through notification queue"
    )
    assert 3600 <= record.oldest_age_seconds < 3700


def test_logs_zero_oldest_age_seconds_when_queue_is_empty(
    processor_session, notification_config, email_sender, caplog
):
    caplog.set_level(logging.INFO)

    build_processor(processor_session, notification_config).run()

    record = next(
        r for r in caplog.records if r.message == "Starting pass through notification queue"
    )
    assert record.oldest_age_seconds == 0
    assert email_sender.calls == []


def test_syncs_suppression_list_before_sending(
    db_session, processor_session, notification_config, email_sender, job_content
):
    notification_config.sync_suppressed_emails = True
    queue_row = create_queue_row(job_content, email="bounced@example.com")
    sesv2_client = MockSESV2Client()
    sesv2_client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="bounced@example.com",
            Reason="BOUNCE",
            LastUpdateTime=datetime_util.utcnow(),
        )
    )

    build_processor(processor_session, notification_config, sesv2_client=sesv2_client).run()

    assert email_sender.calls == []
    assert get_queue_row(db_session, queue_row).status == NotificationQueueStatus.SUPPRESSED


def test_syncs_suppression_list_once_per_pass(
    processor_session, notification_config, email_sender, job_content
):
    notification_config.sync_suppressed_emails = True
    for i in range(3):
        create_queue_row(job_content, email=f"user{i}@example.com")
    processor = build_processor(
        processor_session,
        notification_config,
        sesv2_client=MockSESV2Client(),
        notification_processor_batch_size=1,
    )

    with patch.object(SyncSuppressedEmailsTask, "run") as mock_sync:
        while processor.process_batch():
            pass

    assert mock_sync.call_count == 1
    assert len(email_sender.calls) == 3


def test_skips_suppression_sync_when_queue_is_empty(
    processor_session, notification_config, email_sender
):
    notification_config.sync_suppressed_emails = True
    processor = build_processor(
        processor_session, notification_config, sesv2_client=MockSESV2Client()
    )

    with patch.object(SyncSuppressedEmailsTask, "run") as mock_sync:
        assert processor.process_batch() is False

    mock_sync.assert_not_called()


def test_suppression_sync_failure_does_not_stop_sending(
    processor_session, notification_config, email_sender, job_content
):
    notification_config.sync_suppressed_emails = True
    create_queue_row(job_content, email="user@example.com")
    processor = build_processor(
        processor_session, notification_config, sesv2_client=MockSESV2Client()
    )

    with patch.object(SyncSuppressedEmailsTask, "run", side_effect=Exception("SES is down")):
        processor.run()

    assert email_sender.to_addresses == ["user@example.com"]


def test_exits_after_sigterm(processor_session, notification_config, email_sender, job_content):
    """A SIGTERM lets the current batch finish, then exits"""
    for i in range(2):
        create_queue_row(job_content, email=f"user{i}@example.com")
    processor = build_processor(
        processor_session,
        notification_config,
        notification_processor_batch_size=1,
        notification_processor_maximum_batch_count=None,
    )
    processor.handle_exit(0, None)

    processor.run()

    assert len(email_sender.calls) == 1


@pytest.fixture
def enable_maintenance_mode(monkeypatch):
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


def test_maintenance_mode_idles_without_sending(
    processor_session,
    notification_config,
    email_sender,
    job_content,
    enable_maintenance_mode,
    caplog,
):
    caplog.set_level(logging.INFO)
    create_queue_row(job_content, email="user@example.com")
    processor = build_processor(processor_session, notification_config)
    # Pre-set the shutdown event so the idle wait returns immediately
    processor._shutdown_event.set()

    processor.run()

    assert email_sender.calls == []
    assert "Skipping notification queue processing due to maintenance mode" in caplog.messages


def test_process_notification_queue_command(
    db_session, cli_runner, monkeypatch, email_sender, job_content
):
    monkeypatch.setenv("NOTIFICATION_PROCESSOR_MAXIMUM_BATCH_COUNT", "1")
    monkeypatch.setenv("SYNC_SUPPRESSED_EMAILS", "false")
    _reset_email_config()
    queue_row = create_queue_row(job_content, email="user@example.com")

    result = cli_runner.invoke(args=["task", "process-notification-queue"])
    _reset_email_config()

    assert result.exit_code == 0, result.output
    assert email_sender.to_addresses == ["user@example.com"]
    assert get_queue_row(db_session, queue_row).status == NotificationQueueStatus.SENT


def test_sent_email_includes_trace_id(
    processor_session, notification_config, email_sender, job_content, caplog
):
    caplog.set_level(logging.INFO)
    create_queue_row(job_content, email="user@example.com")

    build_processor(processor_session, notification_config).run()

    trace_id = email_sender.calls[0]["trace_id"]
    assert trace_id
    record = next(r for r in caplog.records if r.message == "Sent notification email")
    assert record.ses_trace_id == trace_id


def test_send_client_error_logs_ses_error_details(
    processor_session, notification_config, email_sender, job_content, caplog
):
    email_sender.fail_for = {"user@example.com"}
    email_sender.error = ClientError(
        {
            "Error": {"Code": "MessageRejected", "Message": "Rejected user@example.com"},
            "ResponseMetadata": {"RequestId": "test-request-id", "HTTPStatusCode": 400},
        },
        "SendEmail",
    )
    create_queue_row(job_content, email="user@example.com")

    build_processor(processor_session, notification_config).run()

    record = next(r for r in caplog.records if r.message == "Failed to send notification email")
    assert record.send_error_type == "ClientError"
    assert record.ses_error_code == "MessageRejected"
    assert record.ses_http_status_code == 400
    assert record.aws_request_id == "test-request-id"
    assert record.ses_trace_id == email_sender.calls[0]["trace_id"]


def test_send_error_logs_error_type(
    processor_session, notification_config, email_sender, job_content, caplog
):
    email_sender.fail_for = {"user@example.com"}
    email_sender.error = ValueError("Bad config")
    create_queue_row(job_content, email="user@example.com")

    build_processor(processor_session, notification_config).run()

    record = next(r for r in caplog.records if r.message == "Failed to send notification email")
    assert record.send_error_type == "ValueError"
    assert not hasattr(record, "ses_error_code")


def test_attempt_count_increments_on_each_attempt(
    db_session, processor_session, notification_config, email_sender, job_content
):
    queue_row = create_queue_row(
        job_content,
        email="user@example.com",
        status=NotificationQueueStatus.FAILED,
        attempt_count=2,
    )

    build_processor(processor_session, notification_config).run()

    queue_row = get_queue_row(db_session, queue_row)
    assert queue_row.status == NotificationQueueStatus.SENT
    assert queue_row.attempt_count == 3


def test_stops_retrying_after_max_attempts(
    db_session, processor_session, notification_config, email_sender, job_content, caplog
):
    email_sender.fail_for = {"user@example.com"}
    queue_row = create_queue_row(job_content, email="user@example.com")
    processor = build_processor(
        processor_session, notification_config, notification_processor_max_attempts=2
    )

    # Each pass processes the row, then drains the queue
    for _ in range(2):
        assert processor.process_batch() is True
        assert processor.process_batch() is False

    assert processor.process_batch() is False
    assert len(email_sender.calls) == 2
    queue_row = get_queue_row(db_session, queue_row)
    assert queue_row.status == NotificationQueueStatus.FAILED
    assert queue_row.attempt_count == 2
    assert (
        "Notification reached the maximum number of attempts and will not be retried"
        in caplog.messages
    )


def test_user_without_email_stops_retrying_after_max_attempts(
    db_session, processor_session, notification_config, email_sender, job_content
):
    queue_row = create_queue_row(job_content, email=None, attempt_count=4)
    processor = build_processor(processor_session, notification_config)

    assert processor.process_batch() is True
    assert processor.process_batch() is False
    assert processor.process_batch() is False

    assert get_queue_row(db_session, queue_row).attempt_count == 5


def test_rows_out_of_attempts_are_ignored(
    processor_session, notification_config, email_sender, job_content, caplog
):
    """Rows out of attempts don't count towards oldest_age_seconds or trigger a suppression sync"""
    caplog.set_level(logging.INFO)
    notification_config.sync_suppressed_emails = True
    create_queue_row(
        job_content,
        email="user@example.com",
        status=NotificationQueueStatus.FAILED,
        attempt_count=5,
    )
    processor = build_processor(
        processor_session, notification_config, sesv2_client=MockSESV2Client()
    )

    with patch.object(SyncSuppressedEmailsTask, "run") as mock_sync:
        assert processor.process_batch() is False

    mock_sync.assert_not_called()
    assert email_sender.calls == []
    record = next(
        r for r in caplog.records if r.message == "Starting pass through notification queue"
    )
    assert record.oldest_age_seconds == 0
