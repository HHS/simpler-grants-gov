"""
This file contains various utilities for helping test workflows
including setting up data and validation.
"""

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_config import WorkflowConfig


def build_workflow_config(
    workflow_type: WorkflowType = WorkflowType.INITIAL_PROTOTYPE,
    persistence_model: type[BaseStatePersistenceModel] = BaseStatePersistenceModel,
    entity_types: list[WorkflowEntityType] | None = None,
) -> WorkflowConfig:
    """Build a workflow config"""

    if entity_types is None:
        entity_types = []

    config = WorkflowConfig(
        workflow_type=workflow_type,
        persistence_model=persistence_model,
        entity_types=entity_types,
        approval_mapping={},
    )
    return config
