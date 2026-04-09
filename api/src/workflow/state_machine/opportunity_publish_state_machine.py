import logging
from enum import StrEnum
from typing import Any, cast

from opensearchpy import ConnectionTimeout, TransportError
from statemachine import Event
from statemachine.states import States

from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import OpportunityStatus, WorkflowEntityType, WorkflowType
from src.db.models.opportunity_models import CurrentOpportunitySummary
from src.search.search_config import SearchConfig
from src.services.current_opportunity.determine_current_opportunity_summary import (
    determine_current_and_status,
    is_opportunity_changed,
)
from src.util.datetime_util import get_now_us_eastern_date
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_client_registry import get_workflow_client_registry
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

    class Metrics(StrEnum):
        OPP_PUBLISH_WRITTEN_TO_SEARCH_INDEX = "opp_publish_written_to_search_index"
        OPP_PUBLISH_NOT_WRITTEN_TO_SEARCH_INDEX = "opp_publish_not_written_to_search_index"
        OPP_PUBLISH_ERROR_WRITING_TO_SEARCH_INDEX = "opp_publish_error_writing_to_search_index"

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

    @calculate_current_opportunity_summary.on
    def handle_calculate_current_opportunity_summary(
        self, state_machine_event: StateMachineEvent
    ) -> None:
        """Handle calculating the opportunity summary + opportunity status for an opportunity."""
        current_date = get_now_us_eastern_date()

        current_summary, status = determine_current_and_status(self.opportunity, current_date)
        log_extra = state_machine_event.get_log_extra() | {
            "opportunity_id": self.opportunity.opportunity_id,
            "current_opportunity_status": (
                self.opportunity.current_opportunity_summary.opportunity_status
                if self.opportunity.current_opportunity_summary
                else None
            ),
            "current_opportunity_summary": (
                self.opportunity.current_opportunity_summary.opportunity_summary_id
                if self.opportunity.current_opportunity_summary
                else None
            ),
            "new_opportunity_status": status,
            "new_opportunity_summary": (
                current_summary.opportunity_summary_id if current_summary else None
            ),
        }

        if is_opportunity_changed(self.opportunity, current_summary, status):
            logger.info(
                "Opportunity summary / status changed", extra=log_extra | {"is_updated": True}
            )
        else:
            logger.info(
                "Opportunity summary / status not changed", extra=log_extra | {"is_updated": False}
            )
            return

        if current_summary is None:
            if self.opportunity.current_opportunity_summary is not None:
                logger.info("Removing existing current opportunity summary", extra=log_extra)
                self.db_session.delete(self.opportunity.current_opportunity_summary)

            # Whether or not we needed to delete a record or if it was already null
            # we can safely return here as there isn't anything to do
            return

        # If the current opportunity summary doesn't already exist, create it first
        if self.opportunity.current_opportunity_summary is None:
            logger.info("Creating new current opportunity summary", extra=log_extra)
            self.opportunity.current_opportunity_summary = CurrentOpportunitySummary(
                opportunity=self.opportunity
            )
        else:
            logger.info("Updating current opportunity summary", extra=log_extra)

        self.opportunity.current_opportunity_summary.opportunity_summary = current_summary
        self.opportunity.current_opportunity_summary.opportunity_status = cast(
            OpportunityStatus, status
        )

    @write_opportunity_to_search.on
    def handle_write_opportunity_to_search(self, state_machine_event: StateMachineEvent) -> None:
        """Handle writing the opportunity to the search index if it has a status/current summary"""
        log_extra = state_machine_event.get_log_extra()

        if self.opportunity.current_opportunity_summary is None:
            logger.info(
                "Opportunity has no current opportunity summary / status - not writing to search index",
                extra=log_extra,
            )
            state_machine_event.increment(self.Metrics.OPP_PUBLISH_NOT_WRITTEN_TO_SEARCH_INDEX)
            return

        schema = OpportunityV1Schema()
        records = [schema.dump(self.opportunity)]
        config = SearchConfig()
        search_client = get_workflow_client_registry().search_client

        log_extra |= {"search_index_alias": config.opportunity_search_index_alias}
        logger.info("Writing opportunity to search index", extra=log_extra)

        # Writing to the search index is a nice-to-have, in the event there
        # is any issue, we aren't going to error the whole workflow and block
        # publish. We have an hourly job that loads everything to the search index
        # that can handle retrying.
        try:
            # We upsert against the alias of the index
            # as we change the index name hourly.
            search_client.bulk_upsert(
                index_name=config.opportunity_search_index_alias,
                records=records,
                primary_key_field="opportunity_id",
                refresh=True,
            )
            state_machine_event.increment(self.Metrics.OPP_PUBLISH_WRITTEN_TO_SEARCH_INDEX)

        except (TransportError, ConnectionTimeout):
            # These are pretty generic network blips that
            # we have retries for when loading elsewhere.
            logger.warning(
                "Couldn't write opportunity to search index to due to intermittent issue",
                extra=log_extra,
                exc_info=True,
            )
            state_machine_event.increment(self.Metrics.OPP_PUBLISH_ERROR_WRITING_TO_SEARCH_INDEX)
        except Exception:
            logger.exception("Failed to write opportunity to search index", extra=log_extra)
            state_machine_event.increment(self.Metrics.OPP_PUBLISH_ERROR_WRITING_TO_SEARCH_INDEX)
