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

    def on_transition(self, event_data: EventData) -> None:
        """
        Called automatically by the state machine when a transition occurs.
        """
        # Extract the state_machine_event from the extended_kwargs
        state_machine_event: StateMachineEvent | None = event_data.extended_kwargs.get(
            "state_machine_event"
        )

        if state_machine_event is None:
            logger.warning(
                "State machine event not found in transition data, skipping audit record creation",
                extra={
                    "source_state": event_data.source.value if event_data.source else None,
                    "target_state": event_data.target.value if event_data.target else None,
                    "event_name": event_data.event.name if event_data.event else None,
                },
            )
            return

        # Create the audit record
        workflow_audit = WorkflowAudit(
            workflow_id=state_machine_event.workflow.workflow_id,
            acting_user_id=state_machine_event.acting_user.user_id,
            transition_event=event_data.event.name,
            source_state=event_data.source.value,
            target_state=event_data.target.value,
            event_id=state_machine_event.workflow_history_event.event_id,
            audit_metadata=state_machine_event.metadata,
        )

        self.db_session.add(workflow_audit)

        logger.info(
            "Created workflow audit record for transition",
            extra={
                "workflow_id": state_machine_event.workflow.workflow_id,
                "source_state": event_data.source.value,
                "target_state": event_data.target.value,
                "transition_event": event_data.event.name,
                "acting_user_id": state_machine_event.acting_user.user_id,
            },
        )
