import dataclasses
from typing import TYPE_CHECKING, Any

from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowEventHistory
from src.workflow.workflow_config import WorkflowConfig

if TYPE_CHECKING:
    from src.workflow.base_state_machine import BaseStateMachine


@dataclasses.dataclass
class StateMachineEvent:
    """
    An event for sending to the state machine.

    This is a slightly reorganized version of the events
    we process from SQS. We do this for a few reasons:

    * Several fields in an event are used for looking
      things up like the user or state machine class.
      This is the object we make after doing all the validation
      and have verified that the event is valid / the DB records exist.
    * It's easier to work with a user record rather than an ID,
      especially if we have to keep going back to the DB.
    * Info added by our logic (like the config) will be appended
      to the event for using during processing logic.
    """

    event_to_send: str

    acting_user: User

    # These likely aren't going to be used in the state machine
    # but are used to setup the state machine record and actually
    # run it.
    workflow: Workflow
    config: WorkflowConfig
    state_machine_cls: type[BaseStateMachine]

    workflow_history_event: WorkflowEventHistory

    # Metadata for processing an event.
    metadata: dict | None = None

    # Track the number of transitions that have occurred for this event.
    # This is used to determine if we're in an automatic transition (e.g., via 'after' parameter)
    # versus the initial user-triggered transition. Mutable so it can be incremented.
    # Value of 0 = first transition (user-initiated), >0 = automatic transitions
    transition_count: int = dataclasses.field(default=0)

    def get_log_extra(self) -> dict[str, Any]:
        return {
            "acting_user_id": self.acting_user.user_id,
            "event_to_send": self.event_to_send,
            "event_id": self.workflow_history_event.event_id,
        } | self.workflow.get_log_extra()

    def get_metadata_value(self, field: str) -> Any:
        """Util method for getting the value from the metadata."""
        if self.metadata is None:
            return None

        return self.metadata.get(field, None)
