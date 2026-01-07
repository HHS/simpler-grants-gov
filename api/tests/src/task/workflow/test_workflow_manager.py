from src.task.workflow.workflow_manager import StartWorkflowEvent, handle_event, ProcessWorkflowEvent
from tests.src.db.models.factories import OpportunityFactory


def test_thing(db_session, enable_factory_create, app):
    opportunity = OpportunityFactory.create()

    start_event = StartWorkflowEvent(
        acting_user_id="Dave",
        workflow_type="TODO",
        opportunity_id=opportunity.opportunity_id
    )

    x = handle_event(db_session=db_session, event=start_event)
    print(x)

    handle_event(db_session=db_session, event=ProcessWorkflowEvent(workflow_id=x.model.workflow.workflow_id, acting_user_id="Dave", event="receive_approval"))
    handle_event(db_session=db_session, event=ProcessWorkflowEvent(workflow_id=x.model.workflow.workflow_id, acting_user_id="Steve", event="receive_approval"))
    handle_event(db_session=db_session, event=ProcessWorkflowEvent(workflow_id=x.model.workflow.workflow_id, acting_user_id="Joe", event="receive_approval"))

    print(x.model.workflow)

    for event in x.model.workflow.workflow_audits:
        print(f"{event.transition_event} [{event.user_id}] {event.source_state} -> {event.target_state}")
