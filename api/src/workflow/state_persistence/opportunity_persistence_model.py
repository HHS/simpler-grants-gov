import logging

from src.adapters import db
from src.db.models.workflow_models import Workflow
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow

logger = logging.getLogger(__name__)


class OpportunityPersistenceModel(BaseStatePersistenceModel):
    """A persistence model for workflows where the entity is an opportunity"""

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if workflow.workflow_entity.opportunity is None:
            logger.warning(
                "Expected the workflow entity to be an opportunity", extra=workflow.get_log_extra()
            )
            raise InvalidEntityForWorkflow("Expected the workflow entity to be an opportunity")

        self.opportunity = workflow.workflow_entity.opportunity
