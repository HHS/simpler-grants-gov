"""Tests for workflow model factories."""

from datetime import datetime, timedelta

import pytest

from src.constants.lookup_constants import ApprovalResponseType, ApprovalType, WorkflowType
from tests.src.db.models.factories import (
    WorkflowApprovalFactory,
    WorkflowAuditFactory,
    WorkflowEventHistoryFactory,
    WorkflowFactory,
)


@pytest.mark.usefixtures("enable_factory_create")
def test_workflow_factory_create(db_session):
    """Test that the WorkflowFactory can build a Workflow instance."""
    workflow = WorkflowFactory.create()
    assert workflow.workflow_id is not None
    assert workflow.current_workflow_state is not None
    assert workflow.is_active is True


@pytest.mark.usefixtures("enable_factory_create")
def test_opportunity_workflow_events_audits_approval_create(db_session):
    # 1. Create one opportunity workflow record reaching the final state
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        current_workflow_state="approved",  # Final state - approved
    )

    # 2. Define state transitions with timestamps (oldest to newest), for easy obtaining the latest transition
    now = datetime.now()
    state_transitions = [
        ("created", "under_1st_review", now - timedelta(days=5)),
        ("under_1st_review", "1st_approval", now - timedelta(days=4)),
        ("1st_approval", "under_2nd_review", now - timedelta(days=3)),
        ("under_2nd_review", "2nd_approval", now - timedelta(days=2)),
        ("2nd_approval", "approved", now - timedelta(days=1)),  # latest transition
    ]

    # 3. Create events and audits for each transition
    events = []
    audits = []

    for _i, (source, target, timestamp) in enumerate(state_transitions):
        # Create an event with timestamp
        event = WorkflowEventHistoryFactory.create(
            workflow_id=workflow.workflow_id,
            event_data={
                "event_type": "state_change",
                "details": f"Changed from {source} to {target}",
            },
            sent_at=timestamp,  # Set the timestamp for ordering
        )
        events.append(event)

        # Create the audit record
        audit = WorkflowAuditFactory.create(
            event_id=event.event_id,
            workflow_id=workflow.workflow_id,
            source_state=source,
            target_state=target,
        )
        audits.append(audit)

    # 4. Get the latest event (which would be the last one in the list)
    latest_event = events[-1]

    approval = WorkflowApprovalFactory.create(
        event_id=latest_event.event_id,  # Use the approval/latest event
        workflow_id=workflow.workflow_id,
        approval_type=ApprovalType.INITIAL_PROTOTYPE_APPROVAL,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    # 5. Create the end state in audit, with email sending
    final_audit = WorkflowAuditFactory.create(
        event_id=latest_event.event_id,
        workflow_id=workflow.workflow_id,
        source_state="approved",
        target_state="end",
        audit_metadata={
            "email_sent": True,
            "details": "Automatical transition to end state after approval",
        },
    )
    audits.append(final_audit)

    # 6. Verifications
    assert approval.workflow_id == workflow.workflow_id
    assert approval.event_id == latest_event.event_id
    assert latest_event.event_data["details"] == "Changed from 2nd_approval to approved"
    assert len(audits) == 6  # 5 transitions + 1 final auto end
    assert all(audit.workflow_id == workflow.workflow_id for audit in audits)
