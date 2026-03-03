import dataclasses

from src.constants.lookup_constants import ApprovalType, Privilege, WorkflowEntityType, WorkflowType
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel


@dataclasses.dataclass
class ApprovalConfig:
    approval_type: ApprovalType
    required_privileges: list[Privilege]
    minimum_approvals_required: int = 1


@dataclasses.dataclass
class WorkflowConfig:

    workflow_type: WorkflowType

    persistence_model_cls: type[BaseStatePersistenceModel]

    entity_type: WorkflowEntityType

    # A mapping of events to approval configs
    approval_mapping: dict[str, ApprovalConfig] = dataclasses.field(default_factory=dict)
