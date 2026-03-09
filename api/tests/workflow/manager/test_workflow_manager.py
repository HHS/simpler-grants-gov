import json
import uuid
from unittest.mock import MagicMock, patch

import boto3
import pytest

from src.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from src.constants.lookup_constants import (
    WorkflowEntityType,
    WorkflowEventProcessingResult,
    WorkflowEventType,
    WorkflowType,
)
from src.workflow.event.workflow_event import WorkflowEvent
from src.workflow.manager.workflow_manager import (
    WorkflowManager,
    WorkflowManagerConfig,
    handle_event,
)
from src.workflow.workflow_background_task import workflow_background_task
from src.workflow.workflow_errors import NonRetryableWorkflowError, RetryableWorkflowError


@workflow_background_task()
def test_workflow_manager(workflow_sqs_queue, app, valid_sqs_message):
    """Test process_events() processes batches and tracks metrics correctly."""
    boto_client = boto3.client("sqs", region_name="us-east-1")
    sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

    for _ in range(5):
        sqs_client.send_message(json.loads(valid_sqs_message.body))

    # Execute: create manager with max 3 batches and 0 sleep time
    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=3)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        workflow_manager.process_events()

    # Verify: check metrics reflect 3 batches processed
    metrics = workflow_manager.metrics
    assert metrics["batches_processed"] == 3
    assert metrics["events_processed"] >= 3


@pytest.fixture
def valid_message_body():
    """Create a valid message body for testing."""
    return {
        "event_id": str(uuid.uuid4()),
        "acting_user_id": "7c3e5d1e-8a2f-4e5a-8b1c-9d2e3f4a5b6c",
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": "1cb6ed8b-81ff-4cfa-92bc-b0d08b162f77",
        },
    }


@pytest.fixture
def valid_sqs_message(valid_message_body):
    """Create a valid SQS message for testing."""
    return SQSMessage(
        Body=json.dumps(valid_message_body),
        ReceiptHandle="test-receipt-handle",
        MessageId=str(uuid.uuid4()),
    )


@pytest.fixture
def invalid_message_body():
    """Create a valid message body for testing."""
    return {
        "event_id": str(uuid.uuid4()),
        "acting_user_id": "abcded1e-8a2f-4e5a-8b1c-9d2e3f4abcde",
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": "1cb6ed8b-81ff-4cfa-92bc-b0d08b162f77",
        },
    }


@pytest.fixture
def invalid_sqs_message(invalid_message_body):
    """Create a valid SQS message for testing."""
    return SQSMessage(
        Body=json.dumps(invalid_message_body),
        ReceiptHandle="test-receipt-handle",
        MessageId=str(uuid.uuid4()),
    )


def test_convert_sqs_message_to_workflow_event_success(valid_sqs_message):
    """Test successful fetching of a workflow event from an SQS message."""
    wfm = WorkflowManager(config=WorkflowManagerConfig())
    result = wfm.parse_event(valid_sqs_message)
    assert isinstance(result, WorkflowEvent)
    assert str(result.event_id) == json.loads(valid_sqs_message.body)["event_id"]


@workflow_background_task()
def test_process_sqs_event_success(app, valid_sqs_message):
    with app.app_context():
        """Test successful processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.parse_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.SUCCESS


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_retryable_error(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test retryable error processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = RetryableWorkflowError("Test error")
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.parse_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.RETRYABLE_ERROR
        mock_event_handler.return_value.process.assert_called_once()


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_non_retryable_error(mock_event_handler, app, invalid_sqs_message):
    with app.app_context():
        """Test non-retryable error processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = NonRetryableWorkflowError(
            "Test error"
        )
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.parse_event(invalid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.NON_RETRYABLE_ERROR
        mock_session.rollback.assert_called_once()
        mock_event_handler.return_value.process.assert_called_once()


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_general_error(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test general error (any other error) processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = Exception("Unexpected error")
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.parse_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.GENERAL_ERROR
        mock_event_handler.return_value.process.assert_called_once()
