from enum import StrEnum

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import WorkflowConfig


class InitialPrototypeState(StrEnum):
    # At the moment, keep the states simple
    # we'll change these as we add more features.
    START = "start"
    MIDDLE = "middle"
    END = "end"


initial_prototype_state_machine_config = WorkflowConfig(
    workflow_type=WorkflowType.INITIAL_PROTOTYPE,
    persistence_model=OpportunityPersistenceModel,
    entity_types=[WorkflowEntityType.OPPORTUNITY],
    approval_mapping={},
)


@WorkflowRegistry.register_workflow(initial_prototype_state_machine_config)
class InitialPrototypeStateMachine(BaseStateMachine):
    states = States.from_enum(
        InitialPrototypeState,
        initial=InitialPrototypeState.START,
        final=[InitialPrototypeState.END],
        use_enum_instance=True,
    )

    ### TRANSITIONS
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
