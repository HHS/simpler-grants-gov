import uuid
import moto
import json
from pydantic import ValidationError
import pytest

from src.services.applications.submission_queue import ApplicationSubmissionMessage, send_application_submission_message

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
    assert log["application_id"]  == data["application_id"]
    assert log["submitted_by_user_id"] is None


def test_application_submission_message_schema_raises_validation_errors_for_required_fields():
    data = {
        "message_id": None,
        "application_id": None,
        "submitted_by_user_id": None,
    }
    with pytest.raises(ValidationError) as exc:
        ApplicationSubmissionMessage(**data)
    expected = (
        "<ExceptionInfo 2 validation errors for ApplicationSubmissionMessage\nmessage_id\n  UUID inp"
        "ut should be a string, bytes or UUID object ..., input_value=None, input_type=NoneType]\n  "
        "  For further information visit https://errors.pydantic.dev/2.13/v/uuid_type tblen=2>"
    )
    assert str(exc) == expected


def test_application_submission_message_model_dump_json():
    data = {
        "message_id": uuid.uuid4(),
        "application_id": uuid.uuid4(),
        "submitted_by_user_id": uuid.uuid4(),
    }
    message_obj = ApplicationSubmissionMessage(**data)
    assert json.loads(message_obj.model_dump_json()) == {key: str(val) for key, val in data.items()}

@pytest.fixture
def mock_sqs(reset_aws_env_vars):
    with moto.mock_aws(config={"core": {"service_whitelist": ["sqs", "s3"]}}):
        yield


def test_x(enable_factory_create, db_session, mock_sqs, s3_config, mock_s3):
    application = ApplicationFactory.create()
    send_application_submission_message(application.application_id, None)
    raise AssertionError
