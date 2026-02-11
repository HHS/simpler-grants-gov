from typing import Any, cast

from statemachine import StateMachine

from src.db.models.workflow_models import Workflow
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel


class BaseStateMachine(StateMachine):
    """Base state machine for all state machines

    Contains functionality that will be useful for
    all state machines that we build.
    """

    def __init__(self, model: BaseStatePersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)

    @property
    def workflow(self) -> Workflow:
        """Workflow property to get it from the underlying model a bit easier"""
        # Note we have to cast as self.model gets set in the StateMachine
        # We know it's our model class because we passed it in the __init__ function
        return cast(BaseStatePersistenceModel, self.model).workflow

    @classmethod
    def get_valid_events(cls) -> set[str]:
        """Utility function to get valid events (as strings) that could
        be sent to this state machine.
        """
        # Note mypy thinks events (a property that returns a list) isn't
        # iterable for some reason.
        return {e.id for e in cls.events}  # type: ignore[attr-defined]
