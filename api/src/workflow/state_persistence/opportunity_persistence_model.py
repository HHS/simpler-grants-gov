from src.adapters import db
from src.workflow.state_persistence.base_state_persistence_model import (
    BaseStatePersistenceModel,
    Workflow,
)
from src.workflow.workflow_errors import InvalidEntityForWorkflow


class OpportunityPersistenceModel(BaseStatePersistenceModel):
    """A persistence model for workflows where the entity
    is a single opportunity.
    """

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if len(workflow.opportunities) != 1:
            raise InvalidEntityForWorkflow()

        self.opportunity = workflow.opportunities[0]
