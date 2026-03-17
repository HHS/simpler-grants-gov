import json
import logging
import uuid
from unittest.mock import patch

import boto3
import pytest

from src.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from src.constants.lookup_constants import (
    WorkflowEntityType,
    WorkflowEventProcessingResult,
    WorkflowEventType,
    WorkflowType,
)
from src.db.models.workflow_models import WorkflowEventHistory
from src.workflow.event.workflow_event import ProcessWorkflowEventContext, WorkflowEvent
from src.workflow.manager.workflow_manager import (
    WorkflowManager,
    WorkflowManagerConfig,
    handle_event,
)
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState
from tests.workflow.workflow_test_util import build_process_workflow_event

logger = logging.getLogger(__name__)


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


def test_convert_sqs_message_to_workflow_event_success(valid_sqs_message):
    """Test successful fetching of a workflow event from an SQS message."""
    wfm = WorkflowManager(config=WorkflowManagerConfig())
    result = wfm.parse_event(valid_sqs_message)
    assert isinstance(result, WorkflowEvent)
    assert str(result.event_id) == json.loads(valid_sqs_message.body)["event_id"]


def test_workflow_sqs_messages_process_batch_success(workflow_sqs_queue, app):
    """Test process_batch() processes batches and tracks metrics correctly, for success case"""
    boto_client = boto3.client("sqs", region_name="us-east-1")
    sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

    messages_to_delete_handles: list[str] = []
    messages_to_keep_handles: list[str] = []
    message_deleted = False

    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    test_event_id = uuid.uuid4()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    process_workflow_context = ProcessWorkflowEventContext(
        workflow_id=workflow.workflow_id, event_to_send="middle_to_end"
    )

    test_message_body_success = {
        "event_id": test_event_id,
        "acting_user_id": user.user_id,
        "event_type": WorkflowEventType.START_WORKFLOW,
        "process_workflow_context": process_workflow_context.model_dump(),
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }

    sqs_client.send_message(test_message_body_success)

    # Execute: create manager with max 1 batch and 0 sleep time
    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=1)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        messages_to_delete_handles, messages_to_keep_handles = workflow_manager.process_batch()

    # change_message_visibility will throw invalid handle exception, if the message is already deleted
    try:
        boto_client.change_message_visibility(
            QueueUrl=workflow_sqs_queue,
            ReceiptHandle=messages_to_delete_handles[0],
            VisibilityTimeout=0,
        )
    except Exception:
        message_deleted = True
        logger.exception(
            "Message was already deleted, change_message_visibility failed as expected"
        )

    message_post_process = boto_client.receive_message(
        QueueUrl=workflow_sqs_queue, MaxNumberOfMessages=10, WaitTimeSeconds=5
    )

    # Verify: check metrics reflect 1 batch processed
    metrics = workflow_manager.metrics
    assert metrics["batches_processed"] == 1
    assert metrics["events_processed"] >= 1
    assert len(messages_to_delete_handles) == 1
    assert len(messages_to_keep_handles) == 0
    # Verify the message was deleted and is no longer in the queue
    assert message_deleted
    assert not message_post_process.get("Messages")


def test_workflow_sqs_messages_process_batch_retryable(workflow_sqs_queue, app):
    """Test process_batch() processes batches and tracks metrics correctly, for retryable case"""
    boto_client = boto3.client("sqs", region_name="us-east-1")
    sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

    messages_to_delete_handles: list[str] = []
    messages_to_keep_handles: list[str] = []

    # Create test user and opportunity
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state="not-a-valid-state",
        has_opportunity=True,
    )

    process_workflow_context = ProcessWorkflowEventContext(
        workflow_id=workflow.workflow_id, event_to_send="middle_to_end"
    )

    test_event_id = uuid.uuid4()

    test_message_body_retryable = {
        "event_id": test_event_id,
        "acting_user_id": user.user_id,
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": process_workflow_context.model_dump(),
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }

    sqs_client.send_message(test_message_body_retryable)

    # Execute: create manager with max 3 batches and 0 sleep time
    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=1)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        messages_to_delete_handles, messages_to_keep_handles = workflow_manager.process_batch()

    # Change message visiblity
    response = boto_client.change_message_visibility(
        QueueUrl=workflow_sqs_queue, ReceiptHandle=messages_to_keep_handles[0], VisibilityTimeout=0
    )
    logger.info(f"Change message visibility response: {response}")

    message_post_process = sqs_client.receive_messages(max_messages=5, wait_time=2)

    # Verify: check metrics reflect 3 batches processed
    metrics = workflow_manager.metrics
    assert metrics["batches_processed"] == 1
    assert metrics["events_processed"] >= 1
    assert len(messages_to_delete_handles) == 0
    assert len(messages_to_keep_handles) == 1
    # Verify the message was not deleted and is still in the queue
    assert len(message_post_process) == 1
    assert str(json.loads(message_post_process[0].body)["event_id"]) == str(test_event_id)


def test_workflow_sqs_messages_process_batch_mix_cases(workflow_sqs_queue, app, valid_sqs_message):
    """Test process_batch() processes batches and tracks metrics correctly.
    This test includes a mix of successful processing, retryable errors, and non-retryable errors to ensure the manager handles each case as expected.
    """
    boto_client = boto3.client("sqs", region_name="us-east-1")
    sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)

    messages_to_delete_handles: list[str] = []
    messages_to_keep_handles: list[str] = []

    # Create successful instance
    test_event_id = uuid.uuid4()
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    process_workflow_context = ProcessWorkflowEventContext(
        workflow_id=workflow.workflow_id, event_to_send="middle_to_end"
    )

    test_message_body_success = {
        "event_id": str(test_event_id),
        "acting_user_id": user.user_id,
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": process_workflow_context.model_dump(),
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }
    sqs_client.send_message(test_message_body_success)

    # Create a retryable instance
    test_event_id = uuid.uuid4()
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state="not-a-valid-state",
        has_opportunity=True,
    )

    process_workflow_context = ProcessWorkflowEventContext(
        workflow_id=workflow.workflow_id, event_to_send="middle_to_end"
    )

    test_message_body_retryable = {
        "event_id": test_event_id,
        "acting_user_id": user.user_id,
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": process_workflow_context.model_dump(),
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }

    sqs_client.send_message(test_message_body_retryable)

    # Create a non-retryable instance
    test_event_id = uuid.uuid4()
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    process_workflow_context = ProcessWorkflowEventContext(
        workflow_id=workflow.workflow_id, event_to_send="middle_to_end"
    )

    # setup invalid user id for non-retryable error
    test_message_body_non_retryable = {
        "event_id": test_event_id,
        "acting_user_id": "abcded1e-8a2f-4e5a-8b1c-9d2e3f4abcde",
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": process_workflow_context.model_dump(),
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }

    sqs_client.send_message(test_message_body_non_retryable)

    # Execute: create manager with max 3 batches and 0 sleep time
    config = WorkflowManagerConfig(workflow_cycle_duration=10, workflow_maximum_batch_count=10)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        messages_to_delete_handles, messages_to_keep_handles = workflow_manager.process_batch()

    # Verify: check metrics reflect 3 batches processed
    metrics = workflow_manager.metrics
    assert metrics["batches_processed"] == 1
    assert metrics["events_processed"] >= 3
    assert len(messages_to_delete_handles) == 2
    assert len(messages_to_keep_handles) == 1


def test_process_sqs_event_success(app, db_session):
    """Test successful processing of an SQS event."""
    # Create test user and opportunity
    user = UserFactory.create()
    test_event_id = uuid.uuid4()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    sqs_container = build_process_workflow_event(
        workflow_id=workflow.workflow_id,
        user=user,
        event_to_send="middle_to_end",
        event_id=test_event_id,
        put_history_event_in_session=False,
    )

    # Process the event - should trigger UnexpectedStateError which is a RetryableWorkflowError
    with app.app_context():
        result = handle_event(sqs_container)

    # Verify the workflow event history was saved in the database
    saved_history_event = (
        db_session.query(WorkflowEventHistory)
        .filter(
            WorkflowEventHistory.event_id == test_event_id,
        )
        .first()
    )

    # Verify
    assert saved_history_event is not None
    assert result == WorkflowEventProcessingResult.SUCCESS


def test_process_sqs_event_retryable_error(app):
    """Test retryable error processing of an SQS event."""
    # Create test user and opportunity
    user = UserFactory.create()

    # setup invalid state for retryable error
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state="not-a-valid-state",
        has_opportunity=True,
    )

    sqs_container = build_process_workflow_event(
        workflow_id=workflow.workflow_id,
        user=user,
        event_to_send="middle_to_end",
        put_history_event_in_session=False,
    )

    # Process the event - should trigger UnexpectedStateError which is a RetryableWorkflowError
    with app.app_context():
        result = handle_event(sqs_container)

    # Verify the result is a retryable error
    assert result == WorkflowEventProcessingResult.RETRYABLE_ERROR


def test_process_sqs_event_non_retryable_error(app, db_session):
    """Test non-retryable error processing of an SQS event."""
    # Create test opportunity
    test_event_id = uuid.uuid4()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    sqs_container = build_process_workflow_event(
        workflow_id=workflow.workflow_id,
        user=None,
        event_to_send="middle_to_end",
        put_history_event_in_session=False,
    )

    # Process the event - should trigger non-retryable UserDoesNotExist error
    with app.app_context():
        result = handle_event(sqs_container)

    # Verify the workflow event history was saved in the database
    saved_history_event = (
        db_session.query(WorkflowEventHistory)
        .filter(
            WorkflowEventHistory.event_id == test_event_id,
            WorkflowEventHistory.is_successfully_processed.is_(False),
        )
        .first()
    )

    # Verify
    assert saved_history_event is not None
    assert result == WorkflowEventProcessingResult.NON_RETRYABLE_ERROR


@patch("src.workflow.manager.workflow_manager.EventHandler._pre_process_event")
def test_process_sqs_event_general_error(mock_event_handler_preprocess, app):
    """Test general error (any other error) processing of an SQS event."""
    # Setup mock for unexcpected error from eventhandler preprocess
    mock_event_handler_preprocess.return_value.process.side_effect = Exception("Unexpected error")

    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    sqs_container = build_process_workflow_event(
        workflow_id=workflow.workflow_id,
        user=user,
        event_to_send="middle_to_end",
        put_history_event_in_session=False,
    )

    # Execute
    with app.app_context():
        result = handle_event(sqs_container)

    # Verify
    assert result == WorkflowEventProcessingResult.GENERAL_ERROR
