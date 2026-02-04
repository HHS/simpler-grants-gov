import logging

from src.adapters import db
from src.workflow.state_persistence.base_state_persistence_model import (
    BaseStatePersistenceModel,
    Workflow,
)
from src.workflow.workflow_errors import InvalidEntityForWorkflow

logger = logging.getLogger(__name__)


class OpportunityPersistenceModel(BaseStatePersistenceModel):
    """A persistence model for workflows where the entity
    is a single opportunity.
    """

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if len(workflow.opportunities) != 1:
            logger.warning(
                "Expected only a single opportunity for workflow",
                extra=workflow.get_log_extra()
                | {
                    "opportunity_ids": ",".join(
                        [str(o.opportunity_id) for o in workflow.opportunities]
                    )
                },
            )
            raise InvalidEntityForWorkflow("Expected only a single opportunity for workflow")

        self.opportunity = workflow.opportunities[0]
