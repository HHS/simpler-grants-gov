import dataclasses

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel


@dataclasses.dataclass
class ApprovalConfig:
    pass


@dataclasses.dataclass
class WorkflowConfig:

    workflow_type: WorkflowType

    persistence_model_cls: type[BaseStatePersistenceModel]

    # Likely we'll want entity type to be a bit more flexible in the future
    # if we want to limit to 1 or more of a given entity type
    # For now, this assumes exactly 1 of the entity type
    entity_types: list[WorkflowEntityType] = dataclasses.field(default_factory=list)

    approval_mapping: dict[str, ApprovalConfig] = dataclasses.field(default_factory=dict)
