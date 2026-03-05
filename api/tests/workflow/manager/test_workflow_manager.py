import json
import uuid
from unittest.mock import MagicMock, patch

import pytest

from src.adapters.aws.sqs_adapter import SQSMessage
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


@patch("src.workflow.manager.workflow_manager.SQSClient")
@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_workflow_manager(mock_event_handler, mock_sqs_client, app, valid_sqs_message):
    """Test process_events() processes batches and tracks metrics correctly."""
    # Setup: mock SQS client to return test messages for 3 batches
    mock_client_instance = MagicMock()
    mock_sqs_client.return_value = mock_client_instance

    # Return 1 message per batch for 3 batches, then empty to exit
    mock_client_instance.receive_messages.side_effect = [
        [valid_sqs_message],
        [valid_sqs_message],
        [valid_sqs_message],
        [],  # Fourth call returns empty, but we exit at batch_count >= 3
    ]
    mock_client_instance.delete_message_batch.return_value = MagicMock(failed_deletes=[])

    # Setup: mock EventHandler to simulate successful processing
    mock_event_handler.return_value.process.return_value = None

    # Execute: create manager with max 3 batches and 0 sleep time
    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=3)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        workflow_manager.process_events()

    # Verify: check metrics reflect 3 batches processed
    metrics = workflow_manager.metrics
    assert (
        metrics["batches_processed"] == 3
    ), f"Expected 3 batches, got {metrics['batches_processed']}"
    assert metrics["events_processed"] == 3, f"Expected 3 events, got {metrics['events_processed']}"

    # Verify: EventHandler was called for each message
    assert mock_event_handler.return_value.process.call_count == 3


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


def test_convert_sqs_message_to_workflow_event_success(valid_sqs_message):
    """Test successful fetching of a workflow event from an SQS message."""
    wfm = WorkflowManager(config=WorkflowManagerConfig())
    result = wfm.fetch_event(valid_sqs_message)
    assert isinstance(result, WorkflowEvent)
    assert str(result.event_id) == json.loads(valid_sqs_message.body)["event_id"]


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_success(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test successful processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.fetch_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.SUCCESS
        mock_event_handler.return_value.process.assert_called_once()
        mock_session.commit.assert_called_once()


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_retryable_error(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test retryable error processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = RetryableWorkflowError("Test error")
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.fetch_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.RETRYABLE_ERROR
        mock_event_handler.return_value.process.assert_called_once()
        mock_session.rollback.assert_called_once()


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_non_retryable_error(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test non-retryable error processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = NonRetryableWorkflowError(
            "Unexpected error"
        )
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.fetch_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.NON_RETRYABLE_ERROR
        mock_event_handler.return_value.process.assert_called_once()
        mock_session.rollback.assert_called_once()


@patch("src.workflow.manager.workflow_manager.EventHandler")
@workflow_background_task()
def test_process_sqs_event_general_error(mock_event_handler, app, valid_sqs_message):
    with app.app_context():
        """Test general error (any other error) processing of an SQS event."""
        # Setup mocks
        mock_session = MagicMock()
        mock_event_handler.return_value.process.side_effect = Exception("Unexpected error")
        wfm = WorkflowManager(config=WorkflowManagerConfig())
        test_event = wfm.fetch_event(valid_sqs_message)
        # Execute
        result = handle_event.__wrapped__(mock_session, test_event)

        # Verify
        assert result == WorkflowEventProcessingResult.GENERAL_ERROR
        mock_event_handler.return_value.process.assert_called_once()
        mock_session.rollback.assert_called_once()
