import logging

from statemachine.event_data import EventData

from src.adapters import db
from src.db.models.workflow_models import WorkflowAudit
from src.workflow.config.workflow_service_config import WorkflowServiceConfig
from src.workflow.event.state_machine_event import StateMachineEvent

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

        The listener tracks how many transitions have occurred to determine
        if subsequent transitions are automatic (via 'after' parameter).
        """
        self.db_session = db_session
        self.transition_count = 0

    def on_transition(self, state_machine_event: StateMachineEvent, event_data: EventData) -> None:
        """
        Called automatically by the state machine when a transition occurs.

        For the first transition (user-initiated), uses the acting_user from the event.
        For subsequent automatic transitions, uses the system workflow user ID from config.
        """

        # Determine which user to use for this transition
        # If this is the first transition (transition_count == 0), use the original acting user
        # Otherwise, use the system user ID for automatic transitions
        if self.transition_count == 0:
            # First transition - use the actual user who triggered the workflow
            audit_kwargs = {
                "workflow": state_machine_event.workflow,
                "acting_user": state_machine_event.acting_user,
                "transition_event": event_data.event.name,
                "source_state": event_data.source.value,
                "target_state": event_data.target.value,
                "event": state_machine_event.workflow_history_event,
                "audit_metadata": state_machine_event.metadata,
            }
            acting_user_id = state_machine_event.acting_user.user_id
        else:
            # Subsequent automatic transitions - use the system user ID from config
            # This avoids a DB query and will fail at commit time if the user doesn't exist
            config = WorkflowServiceConfig()
            audit_kwargs = {
                "workflow": state_machine_event.workflow,
                "acting_user_id": config.workflow_service_internal_user_id,
                "transition_event": event_data.event.name,
                "source_state": event_data.source.value,
                "target_state": event_data.target.value,
                "event": state_machine_event.workflow_history_event,
                "audit_metadata": state_machine_event.metadata,
            }
            acting_user_id = config.workflow_service_internal_user_id

        # Increment the transition count for subsequent transitions
        self.transition_count += 1

        # Create the audit record
        workflow_audit = WorkflowAudit(**audit_kwargs)

        self.db_session.add(workflow_audit)

        logger.info(
            "Created workflow audit record for transition",
            extra={
                "transition_event": event_data.event.name,
                "acting_user_id": acting_user_id,
                "is_automatic": self.transition_count > 1,
            },
        )
