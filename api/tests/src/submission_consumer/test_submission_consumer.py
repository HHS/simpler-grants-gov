import json
import uuid
import zipfile

import boto3
import moto
import pytest
from sqlalchemy import select

from src.api.maintenance_mode import get_maintenance_mode_config
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import ApplicationSubmission, Form
from src.form_schema.registry.form_template_registry import form_template_registry
from src.services.applications.submission_queue import send_application_submission_message
from src.submission_consumer.consumer import SubmissionConsumer, SubmissionConsumerConfig
from src.util import file_util
from tests.src.db.models.factories import ApplicationFactory, ApplicationFormFactory


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
        queue = sqs.create_queue(QueueName="test-submission-queue")
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
        "src.submission_consumer.consumer.ApplicationSubmissionBuilder.build_submission",
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
