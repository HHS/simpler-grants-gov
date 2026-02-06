"""
This file contains state machines that we use in our
unit tests. This is to avoid building unit tests against
real workflows for core logic as we'd otherwise need
to keep modifying tests as we modify the real workflows.
"""

from enum import StrEnum

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import WorkflowEntityType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import WorkflowConfig

#########################
# Basic State Machine
#########################
# For testing core functionality with a very
# basic workflow.


class BasicState(StrEnum):
    START = "start"
    MIDDLE = "middle"
    END = "end"


basic_test_workflow_config = WorkflowConfig(
    workflow_type="basic_test_workflow",
    persistence_model_cls=OpportunityPersistenceModel,
    entity_types=[WorkflowEntityType.OPPORTUNITY],
    approval_mapping={},
)


@WorkflowRegistry.register_workflow(basic_test_workflow_config)
class BasicTestStateMachine(BaseStateMachine):

    states = States.from_enum(
        BasicState,
        initial=BasicState.START,
        final=[BasicState.END],
        use_enum_instance=True,
    )

    ### Events + transitions
    start_workflow = Event(
        states.START.to(states.MIDDLE),
    )

    middle_to_end = Event(
        states.MIDDLE.to(states.END),
    )

    def __init__(self, model: OpportunityPersistenceModel, **kwargs):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity
        self.db_session = model.db_session

        # For testing purposes, store the transition events.
        self.transition_history: list[StateMachineEvent] = []

    def on_transition(self, state_machine_event: StateMachineEvent) -> None:
        self.transition_history.append(state_machine_event)
