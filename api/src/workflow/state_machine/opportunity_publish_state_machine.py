import logging
from enum import StrEnum
from typing import Any

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import WorkflowConfig

logger = logging.getLogger(__name__)


class OpportunityPublishState(StrEnum):
    START = "start"

    PENDING_PUBLISH = "pending_publish"
    DRAFT_FLAG_FLIPPED = "draft_flag_flipped"
    CURRENT_OPPORTUNITY_SUMMARY_CALCULATED = "current_opportunity_summary_calculated"
    OPPORTUNITY_WRITTEN_TO_SEARCH = "opportunity_written_to_search"

    END = "end"


opportunity_publish_state_machine_config = WorkflowConfig(
    workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
    persistence_model_cls=OpportunityPersistenceModel,
    entity_type=WorkflowEntityType.OPPORTUNITY,
    approval_mapping={},  # No approvals yet
)


@WorkflowRegistry.register_workflow(opportunity_publish_state_machine_config)
class OpportunityPublishStateMachine(BaseStateMachine):
    ### States

    states = States.from_enum(
        OpportunityPublishState,
        initial=OpportunityPublishState.START,
        final=[OpportunityPublishState.END],
    )

    ### Events + transitions
    start_workflow = Event(
        states.START.to(states.PENDING_PUBLISH, after="flip_is_draft"),
    )

    # Flip the is_draft flag and then do calculate_current_opportunity_summary
    flip_is_draft = Event(
        states.PENDING_PUBLISH.to(
            states.DRAFT_FLAG_FLIPPED, after="calculate_current_opportunity_summary"
        )
    )

    # Calculate the current opportunity summary + opportunity status
    # and then do write_opportunity_to_search
    calculate_current_opportunity_summary = Event(
        states.DRAFT_FLAG_FLIPPED.to(
            states.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED, after="write_opportunity_to_search"
        ),
    )

    # Write the opportunity to search and then
    # do finish_publish
    write_opportunity_to_search = Event(
        states.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED.to(
            states.OPPORTUNITY_WRITTEN_TO_SEARCH, after="finish_publish"
        ),
    )

    # End the publish workflow
    finish_publish = Event(
        states.OPPORTUNITY_WRITTEN_TO_SEARCH.to(states.END),
    )

    def __init__(self, model: OpportunityPersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity

    @flip_is_draft.on
    def handle_flip_is_draft(self, state_machine_event: StateMachineEvent) -> None:
        """Flip the is_draft flag to false"""
        # We shouldn't be using this workflow for non-drafts, but nothing
        # will break, so leave it alone.
        if self.opportunity.is_draft is False:
            logger.warning(
                "Opportunity that isn't currently a draft going through publishing flow.",
                extra=state_machine_event.get_log_extra(),
            )

        self.opportunity.is_draft = False
