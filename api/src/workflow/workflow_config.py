import dataclasses

from src.constants.lookup_constants import ApprovalType, Privilege, WorkflowEntityType, WorkflowType
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel


@dataclasses.dataclass
class ApprovalConfig:
    approval_type: ApprovalType
    approval_state: str
    required_privileges: list[Privilege]
    minimum_approvals_required: int = 1


@dataclasses.dataclass
class WorkflowConfig:

    workflow_type: WorkflowType

    persistence_model_cls: type[BaseStatePersistenceModel]

    entity_type: WorkflowEntityType

    # A mapping of events to approval configs
    approval_mapping: dict[str, ApprovalConfig] = dataclasses.field(default_factory=dict)

    # A mapping of states to approval configs
    # This is a slightly reoriented of the approval_mapping
    # and is automatically calculated in the post_init below.
    state_approval_mapping: dict[str, ApprovalConfig] = dataclasses.field(
        init=False, default_factory=dict
    )

    def __post_init__(self) -> None:
        self.state_approval_mapping = {}

        for approval_config in self.approval_mapping.values():
            self.state_approval_mapping[approval_config.approval_state] = approval_config
