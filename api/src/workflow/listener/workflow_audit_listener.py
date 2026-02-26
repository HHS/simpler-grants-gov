import logging

from statemachine.event_data import EventData

from src.adapters import db
from src.db.models.workflow_models import WorkflowAudit
from src.workflow.event.state_machine_event import StateMachineEvent

logger = logging.getLogger(__name__)


class WorkflowAuditListener:
    """
    Listener for state machine transitions that automatically creates
    audit records in the workflow_audit table.

    This listener is attached to state machines to track all state transitions,
    including who performed the action, what event triggered it, and the
    source and target states.
    """

    def __init__(self, db_session: db.Session):
        """
        Initialize the audit listener.
        """
        self.db_session = db_session

    def on_transition(self, state_machine_event: StateMachineEvent, event_data: EventData) -> None:
        """
        Called automatically by the state machine when a transition occurs.
        """

        # Create the audit record
        workflow_audit = WorkflowAudit(
            workflow=state_machine_event.workflow,
            acting_user=state_machine_event.acting_user,
            transition_event=event_data.event.name,
            source_state=event_data.source.value,
            target_state=event_data.target.value,
            event=state_machine_event.workflow_history_event,
            audit_metadata=state_machine_event.metadata,
        )

        self.db_session.add(workflow_audit)

        logger.info("Created workflow audit record for transition")
