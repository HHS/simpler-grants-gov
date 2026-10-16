import json
import logging
import uuid
import zipfile
from dataclasses import dataclass
from unittest.mock import patch

import boto3
import moto
import pytest
from freezegun import freeze_time
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from src.adapters.aws.sqs_adapter import SQSClient
from src.api.maintenance_mode import get_maintenance_mode_config
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationSubmission, Form
from src.form_schema.registry.form_template_registry import form_template_registry
from src.services.applications.submission_queue import (
    ApplicationSubmissionMessage,
    send_application_submission_message,
)
from src.submission_consumer.submission_consumer import (
    SubmissionConsumer,
    SubmissionConsumerConfig,
    SubmissionProcessingResult,
    get_locked_application,
    handle_message,
    process_application_submission_message,
)
from src.util import file_util
from tests.src.db.models.factories import ApplicationFactory, ApplicationFormFactory, UserFactory

TEST_DATETIME_STR = "2025-06-15 14:30:00"

QUEUE_NAME = "test-submission-queue"


class MockSQSMessage(BaseModel):
    body: str = Field(alias="Body")
    receipt_handle: str = Field(alias="ReceiptHandle")
    message_id: str = Field(alias="MessageId")
    attributes: dict[str, None] = Field(alias="Attributes", default_factory=dict)


@dataclass
class MockSQSDeleteMessage:
    successful_deletes: set
    failed_deletes: set


@pytest.fixture
def registered_form():
    """Register a simple form with the template registry, cleaning up afterwards."""
    registry_keys_before = set(form_template_registry._registry.keys())
    form = Form(
        form_id=uuid.uuid4(),
        form_name="Consumer Test Form",
        short_form_name="consumer_test",
        form_version="1.0",
        agency_code="TEST",
        form_json_schema={},
        form_ui_schema={},
        json_to_xml_schema=None,
    )
    form_template_registry.register(form, major_version=1)
    yield form
    for key in set(form_template_registry._registry.keys()) - registry_keys_before:
        del form_template_registry._registry[key]


def build_submitted_application(registered_form):
    application = ApplicationFactory.create(
        with_forms=False,
        application_status=ApplicationStatus.SUBMITTED,
        has_submitted_by_user=True,
        competition__competition_forms=[],
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form__competition=application.competition,
        competition_form__form=registered_form,
    )
    return application


def build_consumer():
    config = SubmissionConsumerConfig(
        submission_consumer_cycle_duration=0,
        submission_consumer_maximum_batch_count=1,
    )
    return SubmissionConsumer(config=config)


def get_submissions(db_session, application_id):
    return (
        db_session.scalars(
            select(ApplicationSubmission).where(
                ApplicationSubmission.application_id == application_id
            )
        )
        .unique()
        .all()
    )


@pytest.fixture
def consumer_queue(reset_aws_env_vars, monkeypatch):
    """A single moto context whitelisting both sqs and s3, plus consumer env vars.

    The single-service ``mock_sqs`` / ``mock_s3`` fixtures each enter their own
    ``moto.mock_aws`` context with a one-service whitelist, and the
    innermost-entered context wins -- so they can't both be active at once.
    The consumer touches both (reads SQS, writes the submission zip to S3),
    so it needs this combined context.

    The consumer builds S3Config / PdfGenerationConfig from the environment
    per message, so those are provided as env vars too.

    Yields the queue URL.
    """
    with moto.mock_aws(config={"core": {"service_whitelist": ["sqs", "s3"]}}):
        sqs = boto3.client("sqs", region_name="us-east-1")
        queue = sqs.create_queue(QueueName=QUEUE_NAME)
        monkeypatch.setenv("WORKFLOW_QUEUE_URL", queue["QueueUrl"])

        s3 = boto3.client("s3")
        for bucket, env_var in [
            ("local-mock-public-bucket", "PUBLIC_FILES_BUCKET"),
            ("local-mock-draft-bucket", "DRAFT_FILES_BUCKET"),
            ("local-mock-file-scan-bucket", "FILE_SCAN_BUCKET"),
        ]:
            s3.create_bucket(Bucket=bucket)
            monkeypatch.setenv(env_var, f"s3://{bucket}")

        monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")
        monkeypatch.setenv("DOCRAPTOR_API_KEY", "test-key")
        monkeypatch.setenv("DOCRAPTOR_TEST_MODE", "true")
        monkeypatch.setenv("DOCRAPTOR_API_URL", "https://docraptor.com/docs")
        monkeypatch.setenv("SHORT_LIVED_TOKEN_EXPIRATION_MINUTES", "60")
        monkeypatch.setenv("PDF_GENERATION_USE_MOCKS", "true")

        yield queue["QueueUrl"]


class TestSubmissionConsumer:
    @freeze_time(TEST_DATETIME_STR)
    def test_submission_consumer_fetch_messages(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message is not None
        assert container.message.application_id == application.application_id
        assert container.message.submitted_by_user_id == user.user_id
        assert container.sent_at.strftime("%Y-%m-%d %H:%M:%S") == TEST_DATETIME_STR

    @freeze_time(TEST_DATETIME_STR)
    def test_submission_consumer_fetch_messages_when_message_sent_timestamp_is_none(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        response = MockSQSMessage(
            Body=f'{{"message_id": "11111111-aaaa-bbbb-cccc-222222222222", "application_id": "{application.application_id}", "submitted_by_user_id": "{user.user_id}"}}',
            ReceiptHandle="cntcvhbxnbnpjzdwutepqmzovkwfqjzvctkyffssihbisuxokptupkclxupthhfnbpwrfbgovitfsmfkgblmkbekpezbgcyghtlathdjngpsipfurxzavicoxqrczdqwtuoyjtlvajbtwzijlhfjhiipunlbmlvwnpprxrhgdfucntdnokywktcpl",
            MessageId="22222222-aaaa-bbbb-cccc-333333333333",
            attributes={"SentTimestamp": None},
        )
        submission_consumer = build_consumer()
        with patch.object(SQSClient, "receive_messages", return_value=[response]):
            send_application_submission_message(application.application_id, user.user_id)
            containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message is not None
        assert container.message.application_id == application.application_id
        assert container.message.submitted_by_user_id == user.user_id
        assert container.sent_at.strftime("%Y-%m-%d %H:%M:%S") == TEST_DATETIME_STR
        log = next(
            r
            for r in caplog.records
            if r.message == "SQS message was missing sent timestamp - defaulting to now"
        )
        assert log.message_id == "22222222-aaaa-bbbb-cccc-333333333333"

    @freeze_time(TEST_DATETIME_STR)
    def test_submission_consumer_fetch_messages_when_consumer_fails_to_convert_timestamp(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        submission_consumer = build_consumer()
        with patch(
            "src.submission_consumer.submission_consumer.datetime_util.from_timestamp"
        ) as mock_from_timestamp:
            mock_from_timestamp.side_effect = Exception()
            send_application_submission_message(application.application_id, user.user_id)
            containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message is not None
        assert container.message.application_id == application.application_id
        assert container.message.submitted_by_user_id == user.user_id
        assert container.sent_at.strftime("%Y-%m-%d %H:%M:%S") == TEST_DATETIME_STR
        log = next(
            r
            for r in caplog.records
            if r.message
            == "Could not convert timestamp from SQS message to datetime - defaulting to now"
        )
        assert log is not None

    def test_submission_consumer_handles_message_that_throws_pydantic_invalid_error(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        submission_consumer = build_consumer()
        sqs = boto3.client("sqs", region_name="us-east-1")
        queue = sqs.create_queue(QueueName=QUEUE_NAME)
        sent_message = sqs.send_message(
            QueueUrl=queue["QueueUrl"], MessageBody=json.dumps({"application_id": "abc"})
        )
        sent_message_id = sent_message["MessageId"]
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message is None
        log = next(
            r
            for r in caplog.records
            if r.message == "Failed to parse SQS message as ApplicationSubmissionMessage"
        )
        assert log is not None
        assert log.message_id == sent_message_id
        exc_type, _, _ = log.exc_info
        assert exc_type == ValidationError

    def test_submission_consumer_handles_message_that_throws_json_error(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        submission_consumer = build_consumer()
        sqs = boto3.client("sqs", region_name="us-east-1")
        queue = sqs.create_queue(QueueName=QUEUE_NAME)
        sent_message = sqs.send_message(QueueUrl=queue["QueueUrl"], MessageBody="not valid json")
        sent_message_id = sent_message["MessageId"]
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message is None
        log = next(
            r
            for r in caplog.records
            if r.message == "Failed to parse SQS message as ApplicationSubmissionMessage"
        )
        assert log is not None
        assert log.message_id == sent_message_id
        exc_type, _, _ = log.exc_info
        assert exc_type == json.JSONDecodeError

    def test_submission_consumer_delete_message(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        submission_consumer = build_consumer()
        sqs = boto3.client("sqs", region_name="us-east-1")
        queue = sqs.create_queue(QueueName=QUEUE_NAME)
        send_application_submission_message(application.application_id, user.user_id)
        messages = sqs.receive_message(
            QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
        )
        assert messages.get("Messages", []) != []
        submission_consumer.delete_messages([messages["Messages"][0]["ReceiptHandle"]])
        messages = sqs.receive_message(
            QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
        )
        assert messages.get("Messages", []) == []

    def test_submission_consumer_delete_message_call_fails(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        submission_consumer = build_consumer()
        response = MockSQSDeleteMessage(successful_deletes={"x"}, failed_deletes={"y"})
        with patch.object(SQSClient, "delete_message_batch", return_value=response):
            sqs = boto3.client("sqs", region_name="us-east-1")
            queue = sqs.create_queue(QueueName=QUEUE_NAME)
            send_application_submission_message(application.application_id, user.user_id)
            messages = sqs.receive_message(
                QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
            )
            assert messages.get("Messages", []) != []
            submission_consumer.delete_messages([messages["Messages"][0]["ReceiptHandle"]])
            messages = sqs.receive_message(
                QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
            )
            assert messages.get("Messages", []) != []
        log = next(
            r for r in caplog.records if r.message == "Failed to delete messages from SQS queue"
        )
        assert log.failed_deletes == ["y"]

    def test_submission_consumer_delete_message_raises_exception(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        user = UserFactory.create()
        submission_consumer = build_consumer()
        with patch.object(SQSClient, "delete_message_batch", side_effect=Exception()):
            sqs = boto3.client("sqs", region_name="us-east-1")
            queue = sqs.create_queue(QueueName=QUEUE_NAME)
            send_application_submission_message(application.application_id, user.user_id)
            messages_1 = sqs.receive_message(
                QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
            )
            assert messages_1.get("Messages", []) != []
            submission_consumer.delete_messages([messages_1["Messages"][0]["ReceiptHandle"]])
            messages_2 = sqs.receive_message(
                QueueUrl=queue["QueueUrl"], MaxNumberOfMessages=1, VisibilityTimeout=0
            )
            assert messages_2.get("Messages", []) != []
        log = next(r for r in caplog.records if r.message == "SQS delete message batch failed")
        assert log.failed_deletes == [messages_1["Messages"][0]["ReceiptHandle"]]

    def test_get_locked_application_returns_a_locked_application(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create()
        engine = db_session.get_bind().engine
        with Session(engine) as _, Session(engine) as fetch_session:
            application = get_locked_application(db_session, application.application_id)
            with pytest.raises(OperationalError):
                fetch_session.execute(
                    select(Application)
                    .where(Application.application_id == application.application_id)
                    .with_for_update(nowait=True)
                )

    def test_process_application_submission_message_success(
        self,
        db_session,
        enable_factory_create,
        monkeypatch,
        caplog,
        consumer_queue,
        registered_form,
    ):
        caplog.set_level(logging.INFO)
        application = build_submitted_application(registered_form)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        response = process_application_submission_message(db_session, container.message)
        assert response == SubmissionProcessingResult.SUCCESS
        submissions = get_submissions(db_session, application.application_id)
        db_session.refresh(application)
        assert application.application_status == ApplicationStatus.ACCEPTED
        assert len(submissions) == 1
        submission = submissions[0]
        assert submission.file_size_bytes > 0
        log = next(
            r for r in caplog.records if r.message == "Finished processing application submission"
        )
        assert log.application_submission_id == submissions[0].application_submission_id

    def test_process_application_submission_message_already_processed(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create(application_status=ApplicationStatus.ACCEPTED)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        response = process_application_submission_message(db_session, container.message)
        assert response == SubmissionProcessingResult.ALREADY_PROCESSED
        submissions = get_submissions(db_session, application.application_id)
        assert len(submissions) == 0
        log = next(
            r
            for r in caplog.records
            if r.message == "Application submission was already processed - nothing to do"
        )
        assert log.application_id == application.application_id

    def test_process_application_submission_message_application_not_found(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        message = ApplicationSubmissionMessage(message_id=uuid.uuid4(), application_id=uuid.uuid4())
        response = process_application_submission_message(db_session, message)
        assert response == SubmissionProcessingResult.APPLICATION_NOT_FOUND
        log = next(
            r for r in caplog.records if r.message == "Application not found for submission message"
        )
        assert log.application_id == message.application_id

    def test_process_application_submission_message_not_ready(
        self, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        response = process_application_submission_message(db_session, container.message)
        assert response == SubmissionProcessingResult.NOT_READY
        submissions = get_submissions(db_session, application.application_id)
        assert len(submissions) == 0
        log = next(
            r
            for r in caplog.records
            if r.message == "Application is not in the submitted status - message will be retried"
        )
        assert log.application_id == application.application_id
        assert log.application_status == ApplicationStatus.IN_PROGRESS

    def test_process_application_submission_message_locked(
        self,
        db_session,
        enable_factory_create,
        monkeypatch,
        caplog,
        consumer_queue,
        registered_form,
    ):
        caplog.set_level(logging.INFO)
        application = build_submitted_application(registered_form)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        with patch(
            "src.submission_consumer.submission_consumer._process_application_submission_message"
        ) as mock_process_application_submission_message:
            error = OperationalError("SELECT 1", {}, Exception("connection lost"))
            mock_process_application_submission_message.side_effect = error
            response = process_application_submission_message(db_session, container.message)
            assert response == SubmissionProcessingResult.LOCKED
            submissions = get_submissions(db_session, application.application_id)
            assert len(submissions) == 0
            log = next(
                r
                for r in caplog.records
                if r.message
                == "Application row is locked by another process - message will be retried"
            )
            assert log.application_id == application.application_id

    def test_process_application_submission_message_error(
        self,
        db_session,
        enable_factory_create,
        monkeypatch,
        caplog,
        consumer_queue,
        registered_form,
    ):
        caplog.set_level(logging.INFO)
        application = build_submitted_application(registered_form)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        with patch(
            "src.submission_consumer.submission_consumer._process_application_submission_message"
        ) as mock_process_application_submission_message:
            mock_process_application_submission_message.side_effect = Exception()
            response = process_application_submission_message(db_session, container.message)
            assert response == SubmissionProcessingResult.ERROR
            submissions = get_submissions(db_session, application.application_id)
            assert len(submissions) == 0
            log = next(
                r for r in caplog.records if r.message == "Failed to process submission message"
            )
            assert log.application_id == application.application_id

    def test_submission_consumer_handle_message(
        self,
        app,
        db_session,
        enable_factory_create,
        monkeypatch,
        caplog,
        consumer_queue,
        registered_form,
    ):
        caplog.set_level(logging.INFO)
        application = build_submitted_application(registered_form)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        assert container.message
        with app.app_context():
            response = handle_message(container)
        assert response == SubmissionProcessingResult.SUCCESS
        submissions = get_submissions(db_session, application.application_id)
        db_session.refresh(application)
        assert application.application_status == ApplicationStatus.ACCEPTED
        assert len(submissions) == 1
        submission = submissions[0]
        assert submission.file_size_bytes > 0
        log = next(r for r in caplog.records if r.message == "Finished handling submission message")
        assert log.application_id == application.application_id
        assert log.message_result == SubmissionProcessingResult.SUCCESS
        assert log.message_handler_duration_sec > 0
        assert log.message_lifecycle_duration_sec < 5

    def test_submission_consumer_handle_message_parse_error(
        self,
        app,
        db_session,
        enable_factory_create,
        monkeypatch,
        caplog,
        consumer_queue,
        registered_form,
    ):
        caplog.set_level(logging.INFO)
        application = build_submitted_application(registered_form)
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container = containers[0]
        container.message = None
        with app.app_context():
            response = handle_message(container)
        assert response == SubmissionProcessingResult.PARSE_ERROR
        submissions = get_submissions(db_session, application.application_id)
        db_session.refresh(application)
        assert application.application_status == ApplicationStatus.SUBMITTED
        assert len(submissions) == 0

    def test_submission_consumer_handle_containers(
        self, app, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application_delete = ApplicationFactory.create(
            application_status=ApplicationStatus.SUBMITTED
        )
        application_keep = ApplicationFactory.create(
            application_status=ApplicationStatus.IN_PROGRESS
        )
        user = UserFactory.create()
        submission_consumer = build_consumer()
        send_application_submission_message(application_delete.application_id, user.user_id)
        send_application_submission_message(application_keep.application_id, user.user_id)
        containers = submission_consumer.fetch_messages()
        container_delete = next(
            c
            for c in containers
            if c.message and c.message.application_id == application_delete.application_id
        )
        container_keep = next(
            c
            for c in containers
            if c.message and c.message.application_id == application_keep.application_id
        )
        with app.app_context():
            to_delete, to_keep = submission_consumer.handle_containers(containers)
            assert to_delete == [container_delete.receipt_handle]
            assert to_keep == [container_keep.receipt_handle]

    def test_submission_Consumer_handle_containers_when_no_containers(
        self, app, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        submission_consumer = build_consumer()
        with app.app_context():
            to_delete, to_keep = submission_consumer.handle_containers([])
            assert to_delete == []
            assert to_keep == []

    def test_submission_consumer_process_batch(
        self, app, db_session, enable_factory_create, monkeypatch, caplog, consumer_queue
    ):
        caplog.set_level(logging.INFO)
        application_keep = ApplicationFactory.create(
            application_status=ApplicationStatus.IN_PROGRESS
        )
        application_delete = ApplicationFactory.create(
            application_status=ApplicationStatus.SUBMITTED
        )
        user = UserFactory.create()
        send_application_submission_message(application_delete.application_id, user.user_id)
        send_application_submission_message(application_keep.application_id, user.user_id)
        submission_consumer = build_consumer()
        with app.app_context():
            to_keep, to_delete = submission_consumer.process_batch()
            assert len(to_keep) == 1
            assert len(to_delete) == 1
        log_1 = next(r for r in caplog.records if r.message == "Fetched SQS messages")
        assert log_1.message_count == 2
        log_2 = next(r for r in caplog.records if r.message == "Processed SQS messages")
        assert log_2.successful_message_count == 1
        assert log_2.failed_message_count == 1


def test_submission_consumer_happy_path(
    db_session,
    enable_factory_create,
    consumer_queue,
    registered_form,
    app,
    caplog,
):
    """A queued message builds the submission and is deleted from the queue."""
    application = build_submitted_application(registered_form)
    db_session.commit()

    send_application_submission_message(
        application_id=application.application_id,
        submitted_by_user_id=application.submitted_by,
    )

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 1
    assert len(messages_to_keep) == 0

    db_session.expire_all()
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.ACCEPTED

    submissions = get_submissions(db_session, application.application_id)
    assert len(submissions) == 1
    submission = submissions[0]
    assert submission.file_size_bytes > 0

    with file_util.open_stream(submission.file_location, "rb") as f:
        with zipfile.ZipFile(f) as submission_zip:
            file_names_in_zip = {info.filename for info in submission_zip.infolist()}
            assert file_names_in_zip == {"consumer_test.pdf", "manifest.txt"}

    # The finished log line carries the timing metrics
    finished_records = [
        r for r in caplog.records if r.message == "Finished handling submission message"
    ]
    assert len(finished_records) == 1
    assert finished_records[0].message_handler_duration_sec >= 0
    assert finished_records[0].message_lifecycle_duration_sec >= 0


def test_submission_consumer_already_processed(
    db_session,
    enable_factory_create,
    consumer_queue,
    registered_form,
    app,
):
    """A message for an already-accepted application is a no-op and is deleted."""
    application = build_submitted_application(registered_form)
    application.application_status = ApplicationStatus.ACCEPTED
    db_session.commit()

    send_application_submission_message(application_id=application.application_id)

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 1
    assert len(messages_to_keep) == 0
    assert len(get_submissions(db_session, application.application_id)) == 0


def test_submission_consumer_not_ready_is_retried(
    db_session,
    enable_factory_create,
    consumer_queue,
    registered_form,
    app,
):
    """A message for an in-progress application is kept on the queue for retry."""
    application = build_submitted_application(registered_form)
    application.application_status = ApplicationStatus.IN_PROGRESS
    db_session.commit()

    send_application_submission_message(application_id=application.application_id)

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 0
    assert len(messages_to_keep) == 1
    assert len(get_submissions(db_session, application.application_id)) == 0


def test_submission_consumer_application_not_found(
    db_session, enable_factory_create, consumer_queue, app
):
    """A message for a nonexistent application is deleted - retrying can't help."""
    missing_application_id = uuid.uuid4()
    send_application_submission_message(application_id=missing_application_id)

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 1
    assert len(messages_to_keep) == 0


def test_submission_consumer_malformed_message(
    db_session, enable_factory_create, consumer_queue, app
):
    """A message that doesn't parse is deleted - retrying can't help."""
    sqs = boto3.client("sqs", region_name="us-east-1")
    sqs.send_message(QueueUrl=consumer_queue, MessageBody=json.dumps({"nonsense": True}))
    sqs.send_message(QueueUrl=consumer_queue, MessageBody="not even json")

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 2
    assert len(messages_to_keep) == 0


def test_submission_consumer_build_failure_is_retried(
    db_session,
    enable_factory_create,
    consumer_queue,
    registered_form,
    app,
    monkeypatch,
):
    """A failing build rolls back and the message is kept for retry."""
    application = build_submitted_application(registered_form)
    db_session.commit()

    send_application_submission_message(application_id=application.application_id)

    def _raise_on_build(*args, **kwargs):
        raise Exception("simulated build failure")

    monkeypatch.setattr(
        "src.services.applications.create_application_submission.ApplicationSubmissionBuilder.build_application_submission",
        _raise_on_build,
    )

    consumer = build_consumer()
    with app.app_context():
        messages_to_delete, messages_to_keep = consumer.process_batch()

    assert len(messages_to_delete) == 0
    assert len(messages_to_keep) == 1

    db_session.expire_all()
    db_session.refresh(application)
    # Nothing partial committed - the application is still submitted
    assert application.application_status == ApplicationStatus.SUBMITTED
    assert len(get_submissions(db_session, application.application_id)) == 0


@pytest.fixture
def enable_maintenance_mode(monkeypatch):
    """Turn maintenance mode on for the duration of a test.

    The maintenance-mode config is @cached, so clear it around the env change.
    """
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


def test_submission_consumer_maintenance_mode(
    db_session, consumer_queue, app, enable_maintenance_mode, caplog
):
    """In maintenance mode the consumer idles without touching SQS, exiting on shutdown."""
    consumer = build_consumer()
    # Pre-set the shutdown event so the idle wait returns immediately
    consumer._shutdown_event.set()

    with app.app_context():
        consumer.process_messages()

    assert "Skipping submission processing due to maintenance mode" in caplog.messages
