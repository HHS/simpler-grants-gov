from sqlalchemy import select

from src.constants.lookup_constants import ApprovalResponseType, WorkflowType
from src.db.models.workflow_models import WorkflowAudit
from src.workflow.handler.event_handler import EventHandler
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState
from tests.workflow.workflow_test_util import (
    build_process_workflow_event,
    build_start_workflow_event,
)


def test_workflow_audit_created_on_start_workflow(db_session, enable_factory_create):
    """Test that a workflow audit record is created when starting a workflow."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=user,
        entity=opportunity,
    )

    event_handler = EventHandler(db_session, event, history_event)
    state_machine = event_handler.process()

    # Query for the audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit).where(
                WorkflowAudit.workflow_id == state_machine.workflow.workflow_id
            )
        ).scalars()
    )

    # Should have exactly one audit record for the start_workflow transition
    assert len(audit_records) == 1
    audit_record = audit_records[0]

    # Verify the audit record fields
    assert audit_record.workflow_id == state_machine.workflow.workflow_id
    assert audit_record.acting_user_id == user.user_id
    assert audit_record.transition_event == "Start workflow"
    assert audit_record.source_state == BasicState.START
    assert audit_record.target_state == BasicState.MIDDLE
    assert audit_record.event_id == history_event.event_id


def test_workflow_audit_created_on_process_workflow(db_session, enable_factory_create):
    """Test that a workflow audit record is created when processing a workflow event."""
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    event, history_event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="middle_to_end"
    )

    event_handler = EventHandler(db_session, event, history_event)
    event_handler.process()

    # Query for the audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit).where(WorkflowAudit.workflow_id == workflow.workflow_id)
        ).scalars()
    )

    # Should have exactly one audit record for the middle_to_end transition
    assert len(audit_records) == 1
    audit_record = audit_records[0]

    # Verify the audit record fields
    assert audit_record.workflow_id == workflow.workflow_id
    assert audit_record.acting_user_id == user.user_id
    assert audit_record.transition_event == "Middle to end"
    assert audit_record.source_state == BasicState.MIDDLE
    assert audit_record.target_state == BasicState.END
    assert audit_record.event_id == history_event.event_id


def test_workflow_audit_captures_metadata(db_session, enable_factory_create):
    """Test that workflow audit records capture metadata from the state machine event."""
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        has_opportunity=True,
    )

    # Create event with metadata
    test_metadata = {"test_key": "test_value", "another_key": 123}
    event, history_event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="middle_to_end", metadata=test_metadata
    )

    event_handler = EventHandler(db_session, event, history_event)
    event_handler.process()

    # Query for the audit record
    audit_record = db_session.execute(
        select(WorkflowAudit).where(WorkflowAudit.workflow_id == workflow.workflow_id)
    ).scalar_one()

    # Verify metadata was captured
    assert audit_record.audit_metadata == test_metadata


def test_workflow_audit_multiple_transitions(db_session, enable_factory_create):
    """Test that multiple audit records are created for multiple transitions."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # Start the workflow
    event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=user,
        entity=opportunity,
    )

    event_handler = EventHandler(db_session, event, history_event)
    state_machine = event_handler.process()
    workflow_id = state_machine.workflow.workflow_id

    # Process another event
    event2, history_event2 = build_process_workflow_event(
        workflow_id, user=user, event_to_send="middle_to_end"
    )

    event_handler2 = EventHandler(db_session, event2, history_event2)
    event_handler2.process()

    # Query for all audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit)
            .where(WorkflowAudit.workflow_id == workflow_id)
            .order_by(WorkflowAudit.created_at)
        ).scalars()
    )

    # Should have two audit records
    assert len(audit_records) == 2

    # Verify first transition (start_workflow)
    assert audit_records[0].transition_event == "Start workflow"
    assert audit_records[0].source_state == BasicState.START
    assert audit_records[0].target_state == BasicState.MIDDLE

    # Verify second transition (middle_to_end)
    assert audit_records[1].transition_event == "Middle to end"
    assert audit_records[1].source_state == BasicState.MIDDLE
    assert audit_records[1].target_state == BasicState.END


def test_workflow_audit_with_approval_workflow(db_session, enable_factory_create):
    """Test that audit records are created for approval workflows with multiple transitions."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # Start the workflow
    event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=user,
        entity=opportunity,
    )

    event_handler = EventHandler(db_session, event, history_event)
    state_machine = event_handler.process()
    workflow_id = state_machine.workflow.workflow_id

    # Move to program officer approval state
    event2, history_event2 = build_process_workflow_event(
        workflow_id, user=user, event_to_send="middle_to_program_officer_approval"
    )

    event_handler2 = EventHandler(db_session, event2, history_event2)
    event_handler2.process()

    # Query for all audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit)
            .where(WorkflowAudit.workflow_id == workflow_id)
            .order_by(WorkflowAudit.created_at)
        ).scalars()
    )

    # Should have two audit records
    assert len(audit_records) == 2

    # Verify first transition
    assert audit_records[0].transition_event == "Start workflow"
    assert audit_records[0].source_state == BasicState.START
    assert audit_records[0].target_state == BasicState.MIDDLE

    # Verify second transition
    assert audit_records[1].transition_event == "Middle to program officer approval"
    assert audit_records[1].source_state == BasicState.MIDDLE
    assert audit_records[1].target_state == BasicState.PENDING_PROGRAM_OFFICER_APPROVAL


def test_workflow_audit_different_users(db_session, enable_factory_create):
    """Test that audit records correctly track different users performing actions."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # Start workflow with user1
    event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=user1,
        entity=opportunity,
    )

    event_handler = EventHandler(db_session, event, history_event)
    state_machine = event_handler.process()
    workflow_id = state_machine.workflow.workflow_id

    # Process event with user2
    event2, history_event2 = build_process_workflow_event(
        workflow_id, user=user2, event_to_send="middle_to_end"
    )

    event_handler2 = EventHandler(db_session, event2, history_event2)
    event_handler2.process()

    # Query for all audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit)
            .where(WorkflowAudit.workflow_id == workflow_id)
            .order_by(WorkflowAudit.created_at)
        ).scalars()
    )

    # Should have two audit records with different users
    assert len(audit_records) == 2
    assert audit_records[0].acting_user_id == user1.user_id
    assert audit_records[1].acting_user_id == user2.user_id


def test_workflow_audit_automatic_transitions_use_system_user(
    db_session, enable_factory_create, workflow_user
):
    """Test that automatic transitions (via 'after' parameter) use the system user."""
    # The workflow_user fixture automatically creates the system user and sets up the env var

    # Create a regular user who will initiate the workflow
    regular_user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # Start the workflow - this will create one audit record
    event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=regular_user,
        entity=opportunity,
    )

    event_handler = EventHandler(db_session, event, history_event)
    state_machine = event_handler.process()
    workflow_id = state_machine.workflow.workflow_id

    # Move to program officer approval state
    event2, history_event2 = build_process_workflow_event(
        workflow_id, user=regular_user, event_to_send="middle_to_program_officer_approval"
    )

    event_handler2 = EventHandler(db_session, event2, history_event2)
    event_handler2.process()

    # Now send an approval event that will trigger an automatic transition via 'after'
    # This approval event should create 2 audit records:
    # 1. The approval itself (user-initiated) - should use regular_user
    # 2. The check_program_officer_approval (automatic via 'after') - should use system_user
    event3, history_event3 = build_process_workflow_event(
        workflow_id,
        user=regular_user,
        event_to_send="receive_program_officer_approval",
        metadata={
            "approval_response_type": ApprovalResponseType.APPROVED,
        },
    )

    event_handler3 = EventHandler(db_session, event3, history_event3)
    event_handler3.process()

    # Query for all audit records
    audit_records = list(
        db_session.execute(
            select(WorkflowAudit)
            .where(WorkflowAudit.workflow_id == workflow_id)
            .order_by(WorkflowAudit.created_at)
        ).scalars()
    )

    # We should have 4 audit records total:
    # 1. start_workflow -> regular_user
    # 2. middle_to_program_officer_approval -> regular_user
    # 3. receive_program_officer_approval (stays in same state) -> regular_user
    # 4. check_program_officer_approval (automatic) -> system_user
    assert len(audit_records) == 4

    # Verify first three transitions use the regular user
    assert audit_records[0].acting_user_id == regular_user.user_id
    assert audit_records[0].transition_event == "Start workflow"

    assert audit_records[1].acting_user_id == regular_user.user_id
    assert audit_records[1].transition_event == "Middle to program officer approval"

    assert audit_records[2].acting_user_id == regular_user.user_id
    assert audit_records[2].transition_event == "Receive program officer approval"

    # Verify the automatic transition uses the system user (from the workflow_user fixture)
    assert audit_records[3].acting_user_id == workflow_user.user_id
    assert audit_records[3].transition_event == "Check program officer approval"
    assert audit_records[3].source_state == BasicState.PENDING_PROGRAM_OFFICER_APPROVAL
    # The target state depends on whether has_enough_approvals is true
    # In this test, it likely stays in the same state since we need 3 approvals
    assert audit_records[3].target_state == BasicState.PENDING_PROGRAM_OFFICER_APPROVAL
