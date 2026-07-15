import json
import logging
import signal
import threading
import uuid
from unittest.mock import patch

import boto3
import pytest
from grants_shared.adapters.aws.sqs_adapter import SQSClient, SQSMessage
from grants_shared.api.maintenance_mode import get_maintenance_mode_config

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
    WorkflowManagerLogEvent,
    handle_event,
)
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.src.workflow.state_machine.test_state_machines import BasicState
from tests.src.workflow.workflow_test_util import build_process_workflow_event

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
def enable_maintenance_mode(monkeypatch):
    """Turn maintenance mode on for the duration of a test.

    The maintenance-mode config is @cached, so clear it around the env change.
    """
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


def test_process_events_skips_when_maintenance_mode_enabled(
    app, workflow_sqs_queue, valid_sqs_message, enable_maintenance_mode, caplog
):
    """With maintenance mode on, process_events idles without fetching from SQS or
    processing a batch, and exits cleanly once a SIGTERM has been received."""
    caplog.set_level(logging.INFO)

    boto_client = boto3.client("sqs", region_name="us-east-1")
    sqs_client = SQSClient(queue_url=workflow_sqs_queue, sqs_client=boto_client)
    sqs_client.send_message(json.loads(valid_sqs_message.body))

    config = WorkflowManagerConfig(workflow_cycle_duration=0)
    workflow_manager = WorkflowManager(config=config)
    # Simulate the SIGTERM the force-new-deployment sends, so the idle loop wakes
    # and exits instead of blocking. Exercise the real handler rather than poking
    # internal state so we cover the shutdown path end to end.
    workflow_manager.handle_exit(signal.SIGTERM, None)

    with app.app_context():
        workflow_manager.process_events()

    assert workflow_manager.sigterm_received is True

    # No batch was processed - the manager never touched SQS or the DB.
    assert workflow_manager.metrics["batches_processed"] == 0
    assert workflow_manager.metrics["events_processed"] == 0

    # The message we enqueued is still on the queue - fetch_messages was never called.
    remaining = sqs_client.receive_messages(max_messages=1, wait_time=0)
    assert len(remaining) == 1

    # A distinct, queryable skip event was logged.
    skip_records = [
        record
        for record in caplog.records
        if getattr(record, "maintenance_mode_event", None)
        == WorkflowManagerLogEvent.MAINTENANCE_MODE_SKIP
    ]
    assert len(skip_records) == 1
    assert skip_records[0].message == "Skipping workflow processing due to maintenance mode"


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
        QueueUrl=workflow_sqs_queue, MaxNumberOfMessages=10, WaitTimeSeconds=0
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
        event_id=test_event_id,
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


def test_process_batch_runs_events_concurrently(workflow_sqs_queue, app, valid_message_body):
    """Verify process_batch dispatches each event to its own thread.

    A threading.Barrier with a short timeout deterministically distinguishes
    concurrent vs. sequential execution: if the handler ran sequentially the
    first thread would block forever (the others can't arrive at the barrier),
    so the barrier's timeout would fire and the test would fail.
    """
    sqs_client = SQSClient(
        queue_url=workflow_sqs_queue, sqs_client=boto3.client("sqs", region_name="us-east-1")
    )

    num_events = 3
    for _ in range(num_events):
        body = dict(valid_message_body)
        body["event_id"] = str(uuid.uuid4())
        sqs_client.send_message(body)

    barrier = threading.Barrier(num_events, timeout=5)

    def fake_handle_event(sqs_container):
        barrier.wait()
        return WorkflowEventProcessingResult.SUCCESS

    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=1)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context(), patch(
        "src.workflow.manager.workflow_manager.handle_event", fake_handle_event
    ):
        messages_to_delete, messages_to_keep = workflow_manager.process_batch()

    assert len(messages_to_delete) == num_events
    assert len(messages_to_keep) == 0


def test_process_batch_event_timeout_keeps_message(workflow_sqs_queue, app, valid_message_body):
    """A handler that exceeds the per-event timeout has its message kept on the queue."""
    sqs_client = SQSClient(
        queue_url=workflow_sqs_queue, sqs_client=boto3.client("sqs", region_name="us-east-1")
    )
    sqs_client.send_message(valid_message_body)

    def slow_handle_event(sqs_container):
        # The handler just needs to still be running when future.result(timeout=0)
        # is called - any brief wait suffices. ThreadPoolExecutor waits for this
        # to finish on shutdown, so keep it short so the test stays fast.
        threading.Event().wait(0.05)
        return WorkflowEventProcessingResult.SUCCESS

    config = WorkflowManagerConfig(
        workflow_cycle_duration=0,
        workflow_maximum_batch_count=1,
        workflow_event_processing_timeout_sec=0,
    )
    workflow_manager = WorkflowManager(config=config)

    with app.app_context(), patch(
        "src.workflow.manager.workflow_manager.handle_event", slow_handle_event
    ):
        messages_to_delete, messages_to_keep = workflow_manager.process_batch()

    assert messages_to_delete == []
    assert len(messages_to_keep) == 1
