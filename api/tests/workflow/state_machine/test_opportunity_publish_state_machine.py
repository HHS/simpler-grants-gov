import pytest

from src.constants.lookup_constants import WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_machine.opportunity_publish_state_machine import OpportunityPublishState
from src.workflow.workflow_errors import InvalidEventError
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.workflow.workflow_test_util import build_start_workflow_event, send_process_event


def test_opportunity_publish_happy_path(db_session, enable_factory_create):
    """Verify that sending a start_workflow event will go through the whole state machine"""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    state_machine = EventHandler(db_session, sqs_container).process()

    workflow = state_machine.workflow
    assert workflow.current_workflow_state == OpportunityPublishState.END

    # No approvals
    assert len(workflow.workflow_approvals) == 0

    # Just one event
    assert len(workflow.workflow_event_history) == 1
    assert workflow.workflow_event_history[0].is_successfully_processed is True

    # Several event transitions automatically fire in sequence
    assert len(workflow.workflow_audits) == 5
    audits = sorted(workflow.workflow_audits, key=lambda audit: audit.created_at)

    assert audits[0].source_state == OpportunityPublishState.START
    assert audits[0].target_state == OpportunityPublishState.PENDING_PUBLISH

    assert audits[1].source_state == OpportunityPublishState.PENDING_PUBLISH
    assert audits[1].target_state == OpportunityPublishState.DRAFT_FLAG_FLIPPED

    assert audits[2].source_state == OpportunityPublishState.DRAFT_FLAG_FLIPPED
    assert audits[2].target_state == OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED

    assert audits[3].source_state == OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED
    assert audits[3].target_state == OpportunityPublishState.OPPORTUNITY_WRITTEN_TO_SEARCH

    assert audits[4].source_state == OpportunityPublishState.OPPORTUNITY_WRITTEN_TO_SEARCH
    assert audits[4].target_state == OpportunityPublishState.END


@pytest.mark.parametrize(
    "current_workflow_state,event_to_send",
    [
        (OpportunityPublishState.START, "not-a-real-event"),
        (OpportunityPublishState.START, "finish_publish"),
        (OpportunityPublishState.END, "start_workflow"),
        (OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED, "flip_is_draft"),
    ],
)
def test_opportunity_publish_state_machine_invalid_events(
    db_session, enable_factory_create, current_workflow_state, event_to_send
):
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        current_workflow_state=current_workflow_state,
        opportunity=opportunity,
    )

    with pytest.raises(InvalidEventError, match="Event is not valid for workflow"):
        send_process_event(
            db_session=db_session,
            event_to_send=event_to_send,
            workflow_id=workflow.workflow_id,
            user=user,
            # This won't matter as we won't check it due to the error
            expected_state=OpportunityPublishState.START,
        )
