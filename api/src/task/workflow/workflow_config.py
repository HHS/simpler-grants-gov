from dataclasses import dataclass
from enum import StrEnum

class WorkflowType(StrEnum):
    # Here is where we'd define the workflows to have
    # specific values for starting a workflow.
    OPPORTUNITY_PUBLISH = "opportunity_publish"

class ApprovalType(StrEnum):
    # Here is where we'd define the types of approvals

    # Let's assume there may be different types of approvals required
    # These would have logic defined in whatever we build to support.
    OPPORTUNITY_PUBLISH_BASIC = "opportunity_publish_basic"
    OPPORTUNITY_PUBLISH_DIRECTOR = "opportunity_publish_director"

@dataclass
class ApprovalConfig:
    approval_type: ApprovalType

    # Grantors would be able to override this
    # via whatever mechanism we define
    # If only certain agencies want an approval
    # then we would make the default 0, so it auto-passes.
    default_required_approvals: int

@dataclass
class WorkflowConfig:
    # This config needs to be registered globally
    workflow_type: WorkflowType

    entity_type: str # TODO - depends on how entities end up

    # The approvals would need to say for which
    # state, which approvals are needed. That way
    # if the current state is XYZ, we can know
    # which config is relevant right now (ie. who needs to approve now)
    state_to_approvals_map: dict[str, list[ApprovalConfig]]


    can_have_multiple_active_workflows: bool = False

example_workflow_config = WorkflowConfig(
    workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
    state_to_approvals_map={
        "receive_approval": [ApprovalConfig(ApprovalType.OPPORTUNITY_PUBLISH_BASIC, default_required_approvals=3)],
    }
)