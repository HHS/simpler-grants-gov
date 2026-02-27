import logging

from statemachine.event_data import EventData

from src.adapters import db
from src.db.models.workflow_models import WorkflowAudit
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.service.workflow_service import get_system_workflow_user

logger = logging.getLogger(__name__)


class WorkflowAuditListener:
    """
    Listener for state machine transitions that automatically creates
    audit records in the workflow_audit table.

    This listener is attached to state machines to track all state transitions,
    including who performed the action, what event triggered it, and the
    source and target states.

    For automatic transitions (those triggered by the 'after' parameter in state
    machine definitions), the system workflow user is used instead of the original
    acting user to make it clear in the audit history which actions were automated.
    """

    def __init__(self, db_session: db.Session):
        """
        Initialize the audit listener.
        """
        self.db_session = db_session

    def on_transition(self, state_machine_event: StateMachineEvent, event_data: EventData) -> None:
        """
        Called automatically by the state machine when a transition occurs.

        For the first transition (user-initiated), uses the acting_user from the event.
        For subsequent automatic transitions, uses the system workflow user.
        """

        # Determine which user to use for this transition
        # If this is the first transition (transition_count == 0), use the original acting user
        # Otherwise, use the system user for automatic transitions
        if state_machine_event.transition_count == 0:
            acting_user = state_machine_event.acting_user
        else:
            acting_user = get_system_workflow_user(self.db_session)

        # Increment the transition count for subsequent transitions
        state_machine_event.transition_count += 1

        # Create the audit record
        workflow_audit = WorkflowAudit(
            workflow=state_machine_event.workflow,
            acting_user=acting_user,
            transition_event=event_data.event.name,
            source_state=event_data.source.value,
            target_state=event_data.target.value,
            event=state_machine_event.workflow_history_event,
            audit_metadata=state_machine_event.metadata,
        )

        self.db_session.add(workflow_audit)

        logger.info(
            "Created workflow audit record for transition",
            extra={
                "transition_event": event_data.event.name,
                "acting_user_id": acting_user.user_id,
                "is_automatic": state_machine_event.transition_count > 1,
            },
        )
