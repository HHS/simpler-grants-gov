import logging

from src.adapters import db
from src.db.models.workflow_models import Workflow
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow

logger = logging.getLogger(__name__)


class ApplicationPersistenceModel(BaseStatePersistenceModel):
    """A persistence model for workflows where the entity is an application"""

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if workflow.application is None:
            logger.warning(
                "Expected the workflow entity to be an application", extra=workflow.get_log_extra()
            )
            raise InvalidEntityForWorkflow("Expected the workflow entity to be an application")

        self.application = workflow.application
