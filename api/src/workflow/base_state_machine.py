from statemachine import StateMachine

from src.workflow.state_persistence.base_state_persistence_model import (
    BaseStatePersistenceModel,
    Workflow,
)


class BaseStateMachine(StateMachine):
    """Base state machine for all state machines

    Contains functionality that will be useful for
    all state machines that we build.
    """

    def __init__(self, model: BaseStatePersistenceModel, **kwargs):
        super().__init__(model=model, **kwargs)

    @property
    def workflow(self) -> Workflow:
        return self.model.workflow

    @classmethod
    def get_valid_events(cls) -> set[str]:
        """Utility function to get valid events (as strings) that could
        be sent to this state machine.
        """
        return {e.id for e in cls.events}
