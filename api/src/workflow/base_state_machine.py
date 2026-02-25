import logging
from typing import Any, cast

from statemachine import StateMachine

from src.constants.lookup_constants import ApprovalResponseType
from src.db.models.workflow_models import Workflow
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.processor.approval_processor import ApprovalProcessor
from src.workflow.service.approval_service import get_approval_response_type
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel

logger = logging.getLogger(__name__)


class BaseStateMachine(StateMachine):
    """Base state machine for all state machines

    Contains functionality that will be useful for
    all state machines that we build.
    """

    def __init__(self, model: BaseStatePersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)
        self.db_session = model.db_session

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

    @classmethod
    def get_valid_events_for_state(cls, state: str) -> list[str]:

        s = cls.states_map.get(state, None)
        if s is None:
            return []

        return [event.id for event in s.transitions.unique_events]

    #############################
    # Event Handlers
    #############################

    def on_agency_approval_approved(self, state_machine_event: StateMachineEvent) -> None:
        """Handler for an agency approval event - when approved."""
        ApprovalProcessor(
            db_session=self.db_session, state_machine_event=state_machine_event
        ).handle_agency_approval_accepted(self.opportunity.agency_record)

    def on_agency_approval_declined(self, state_machine_event: StateMachineEvent) -> None:
        """Handler for an agency approval event - when declined."""
        ApprovalProcessor(
            db_session=self.db_session, state_machine_event=state_machine_event
        ).handle_agency_approval_declined(self.opportunity.agency_record)

    def on_agency_approval_requires_modification(
        self, state_machine_event: StateMachineEvent
    ) -> None:
        """Handler for an agency approval event - when it requires modification."""
        ApprovalProcessor(
            db_session=self.db_session, state_machine_event=state_machine_event
        ).handle_agency_approval_requires_modification(self.opportunity.agency_record)

    #############################
    # Conditionals
    #############################

    def has_enough_approvals(self, state_machine_event: StateMachineEvent) -> bool:
        """Conditional function for checking if enough approval events have been received for the current state"""
        return ApprovalProcessor(
            db_session=self.db_session, state_machine_event=state_machine_event
        ).has_enough_approvals()

    def is_approval_event_approved(self, state_machine_event: StateMachineEvent) -> bool:
        """Conditional function for checking if the approval event is Approved"""
        return get_approval_response_type(state_machine_event) == ApprovalResponseType.APPROVED

    def is_approval_event_declined(self, state_machine_event: StateMachineEvent) -> bool:
        """Conditional function for checking if the approval event is Declined"""
        return get_approval_response_type(state_machine_event) == ApprovalResponseType.DECLINED

    def is_approval_event_requires_modification(
        self, state_machine_event: StateMachineEvent
    ) -> bool:
        """Conditional function for checking if the approval event is Requires Modification"""
        return (
            get_approval_response_type(state_machine_event)
            == ApprovalResponseType.REQUIRES_MODIFICATION
        )
