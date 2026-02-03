import dataclasses

from src.db.models.user_models import User
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.state_persistence.base_state_persistence_model import Workflow
from src.workflow.workflow_config import WorkflowConfig


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

    # Metadata for processing an event.
    metadata: dict | None = None
