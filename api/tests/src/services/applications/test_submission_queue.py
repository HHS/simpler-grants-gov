import json
import logging
import uuid

import boto3
import moto
import pytest
from pydantic import ValidationError

from src.adapters.aws.sqs_adapter import SQSClient
from src.services.applications.submission_queue import (
    ApplicationSubmissionMessage,
    send_application_submission_message,
)
from tests.src.db.models.factories import ApplicationFactory


def test_application_submission_message_schema():
    data = {
        "message_id": uuid.uuid4(),
        "application_id": uuid.uuid4(),
        "submitted_by_user_id": uuid.uuid4(),
    }
    message_obj = ApplicationSubmissionMessage(**data)
    assert message_obj.message_id == data["message_id"]
    assert message_obj.application_id == data["application_id"]
    assert message_obj.submitted_by_user_id == data["submitted_by_user_id"]
    log = message_obj.get_log_extra()
    assert log["submission_message_id"] == data["message_id"]
    assert log["application_id"] == data["application_id"]
    assert log["submitted_by_user_id"] == data["submitted_by_user_id"]


def test_application_submission_message_schema_can_take_none_for_submitted_by_user():
    data = {
        "message_id": uuid.uuid4(),
        "application_id": uuid.uuid4(),
        "submitted_by_user_id": None,
    }
    message_obj = ApplicationSubmissionMessage(**data)
    assert message_obj.message_id == data["message_id"]
    assert message_obj.application_id == data["application_id"]
    assert message_obj.submitted_by_user_id is None
    log = message_obj.get_log_extra()
    assert log["submission_message_id"] == data["message_id"]
    assert log["application_id"] == data["application_id"]
    assert log["submitted_by_user_id"] is None


def test_application_submission_message_schema_raises_validation_errors_for_required_fields():
    data = {
        "message_id": None,
        "application_id": None,
        "submitted_by_user_id": None,
    }
    with pytest.raises(ValidationError) as exc:
        ApplicationSubmissionMessage(**data)
    assert {e["loc"][0] for e in exc.value.errors()} == {"message_id", "application_id"}


def test_application_submission_message_model_dump_json():
    data = {
        "message_id": uuid.uuid4(),
        "application_id": uuid.uuid4(),
        "submitted_by_user_id": uuid.uuid4(),
    }
    message_obj = ApplicationSubmissionMessage(**data)
    assert json.loads(message_obj.model_dump_json()) == {key: str(val) for key, val in data.items()}


def test_application_submission_message_put_on_queue(
    db_session, enable_factory_create, monkeypatch, caplog
):
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    monkeypatch.setenv("WORKFLOW_QUEUE_URL", "https://test-queue-url")
    with moto.mock_aws(config={"core": {"service_whitelist": ["sqs", "s3"]}}):
        sqs = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url="https://test-queue-url", sqs_client=sqs)
        sqs = sqs.create_queue(QueueName="test-queue-url")
        send_application_submission_message(application.application_id, None)
        messages = sqs_client.receive_messages()
    assert len(messages) == 1
    message = json.loads(messages[0].body)
    assert message["application_id"] == str(application.application_id)
    assert message["submitted_by_user_id"] is None
    log = next(
        r
        for r in caplog.records
        if r.message == "Successfully sent application submission message to queue"
    )
    assert str(log.submission_message_id) == message["message_id"]
    assert log.application_id == application.application_id
    assert log.submitted_by_user_id is None
