import logging

from src.adapters import db
from src.db.models.workflow_models import Workflow
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow

logger = logging.getLogger(__name__)


class AwardRecommendationPersistenceModel(BaseStatePersistenceModel):
    """A persistence model for workflows where the entity is an award recommendation"""

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if workflow.award_recommendation is None:
            logger.warning(
                "Expected the workflow entity to be an award recommendation",
                extra=workflow.get_log_extra(),
            )
            raise InvalidEntityForWorkflow(
                "Expected the workflow entity to be an award recommendation"
            )

        self.award_recommendation = workflow.award_recommendation
