import json
import logging
from unittest.mock import Mock, patch

import boto3
import pytest
from botocore.exceptions import ClientError
from pydantic import ValidationError

from src.adapters.aws.sqs_adapter import (
    SQSClient,
    SQSConfig,
    SQSDeleteBatchResponse,
    SQSSendMessageResponse,
    get_boto_sqs_client,
)


class TestSQSConfig:
    """Tests for the SQS configuration class."""

    def test_config_defaults(self, monkeypatch):
        """Verify that SQSConfig raises a validation error if required environment variables are missing."""
        monkeypatch.delenv("WORKFLOW_QUEUE_URL", raising=False)
        with pytest.raises(ValidationError):
            SQSConfig()

    def test_config_from_environment(self, monkeypatch):
        """Verify that SQSConfig correctly loads the queue URL from environment variables."""
        monkeypatch.setenv("WORKFLOW_QUEUE_URL", "https://test-queue-url")
        config = SQSConfig()
        assert config.workflow_queue_url == "https://test-queue-url"


class TestGetBotoSQSClient:
    """Tests for the SQS boto3 client factory function."""

    @patch("src.adapters.aws.sqs_adapter.get_boto_session")
    def test_uses_default_session(self, mock_get_session):
        """Verify that the factory function uses the default AWS session when none is provided."""
        mock_session = Mock()
        mock_get_session.return_value = mock_session
        get_boto_sqs_client()
        mock_get_session.assert_called_once()
        mock_session.client.assert_called_once_with("sqs", endpoint_url=SQSConfig().s3_endpoint_url)

    def test_uses_provided_session(self):
        """Verify that the factory function uses a specifically provided AWS session."""
        mock_session = Mock()
        get_boto_sqs_client(session=mock_session)
        mock_session.client.assert_called_once_with("sqs", endpoint_url=SQSConfig().s3_endpoint_url)


class TestSQSClient:
    """Tests for the SQSClient adapter methods."""

    def test_receive_messages_success(self, workflow_sqs_queue):
        """Verify that receive_messages successfully retrieves and parses messages as SQSMessage objects."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        boto_client.send_message(
            QueueUrl=workflow_sqs_queue, MessageBody='{"event_type": "start_workflow"}'
        )

        messages = sqs_client.receive_messages(max_messages=1)
        assert len(messages) == 1
        assert messages[0].body == '{"event_type": "start_workflow"}'

    def test_receive_messages_empty_queue(self, workflow_sqs_queue):
        """Verify that receive_messages returns an empty list when no messages are available."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        messages = sqs_client.receive_messages(max_messages=10, wait_time=0)
        assert messages == []

    def test_receive_messages_logs_on_error(self, mock_sqs, caplog):
        """Verify that failed receive attempts raise a ClientError and log the queue URL as extra context."""
        invalid_url = "https://sqs.us-east-1.amazonaws.com/123456789012/non-existent"
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=invalid_url, sqs_client=boto_client)

        with pytest.raises(ClientError):
            with caplog.at_level(logging.ERROR):
                sqs_client.receive_messages()

        assert "Failed to receive messages from SQS" in caplog.text
        sqs_record = next(
            r for r in caplog.records if r.message == "Failed to receive messages from SQS"
        )
        assert sqs_record.queue_url == invalid_url

    def test_visibility_timeout_hides_message(self, workflow_sqs_queue):
        """Verify that a message becomes invisible to subsequent requests for the duration of the visibility timeout."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        boto_client.send_message(QueueUrl=workflow_sqs_queue, MessageBody="hidden-test")

        sqs_client.receive_messages(max_messages=1, visibility_timeout=2)
        second_attempt = sqs_client.receive_messages(max_messages=1, wait_time=0)
        assert len(second_attempt) == 0

    def test_delete_message_batch_success(self, workflow_sqs_queue):
        """Verify that delete_message_batch removes multiple messages and returns an SQSDeleteBatchResponse."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        boto_client.send_message(QueueUrl=workflow_sqs_queue, MessageBody="msg1")
        boto_client.send_message(QueueUrl=workflow_sqs_queue, MessageBody="msg2")

        messages = sqs_client.receive_messages(max_messages=2)
        handles = [m.receipt_handle for m in messages]
        results = sqs_client.delete_message_batch(handles)

        assert isinstance(results, SQSDeleteBatchResponse)
        assert len(results.successful_deletes) == 2
        assert set(handles) == results.successful_deletes

    def test_delete_message_batch_partial_failure(self, workflow_sqs_queue):
        """Verify that delete_message_batch correctly reports success and failure sets when only some deletions succeed."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        boto_client.send_message(QueueUrl=workflow_sqs_queue, MessageBody="valid-msg")

        messages = sqs_client.receive_messages(max_messages=1)
        valid_handle = messages[0].receipt_handle
        invalid_handle = "this-handle-does-not-exist"

        results = sqs_client.delete_message_batch([valid_handle, invalid_handle])

        assert valid_handle in results.successful_deletes
        assert invalid_handle in results.failed_deletes

    def test_send_message_success(self, workflow_sqs_queue):
        """Verify that send_message successfully sends a message and returns an SQSSendMessageResponse."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        message_body = {"event_type": "workflow_started", "workflow_id": "12345"}
        response = sqs_client.send_message(message_body)

        assert isinstance(response, SQSSendMessageResponse)
        assert response.message_id is not None
        assert response.md5_of_message_body is not None
        assert len(response.message_id) > 0
        assert len(response.md5_of_message_body) == 32  # MD5 hash is 32 characters

    def test_send_message_returns_all_response_fields(self, workflow_sqs_queue):
        """Verify that send_message response includes all expected fields from boto3."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        message_body = {"test": "data"}
        response = sqs_client.send_message(message_body)

        # Required fields
        assert hasattr(response, "message_id")
        assert hasattr(response, "md5_of_message_body")
        # Optional fields (may be None for standard queues)
        assert hasattr(response, "md5_of_message_attributes")
        assert hasattr(response, "sequence_number")
        assert hasattr(response, "md5_of_message_system_attributes")

    def test_send_message_can_be_received(self, workflow_sqs_queue):
        """Verify that a message sent via send_message can be successfully received."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        message_body = {"event_type": "test_event", "data": {"key": "value"}}
        send_response = sqs_client.send_message(message_body)

        messages = sqs_client.receive_messages(max_messages=1, wait_time=0)

        assert len(messages) == 1
        assert messages[0].message_id == send_response.message_id

        received_body = json.loads(messages[0].body)
        assert received_body == message_body

    def test_send_message_logs_on_error(self, mock_sqs, caplog):
        """Verify that failed send attempts raise a ClientError and log the queue URL as extra context."""
        invalid_url = "https://sqs.us-east-1.amazonaws.com/123456789012/non-existent"
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=invalid_url, sqs_client=boto_client)

        message_body = {"test": "data"}

        with pytest.raises(ClientError):
            with caplog.at_level(logging.ERROR):
                sqs_client.send_message(message_body)

        assert "Failed to send message to SQS" in caplog.text
        sqs_record = next(r for r in caplog.records if r.message == "Failed to send message to SQS")
        assert sqs_record.queue_url == invalid_url

    def test_send_message_logs_success(self, workflow_sqs_queue, caplog):
        """Verify that successful message sends are logged with the message ID."""
        boto_client = boto3.client("sqs", region_name="us-east-1")
        sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

        message_body = {"event_type": "test"}

        with caplog.at_level(logging.INFO):
            response = sqs_client.send_message(message_body)

        assert "Successfully sent message to SQS" in caplog.text
        success_record = next(
            r for r in caplog.records if r.message == "Successfully sent message to SQS"
        )
        assert success_record.queue_url == workflow_sqs_queue
        assert success_record.message_id == response.message_id
