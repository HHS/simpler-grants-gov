import pytest

from src.constants.lookup_constants import ApprovalType, Privilege, WorkflowEntityType, WorkflowType
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import ApprovalConfig, WorkflowConfig
from tests.src.workflow.state_machine.test_state_machines import BasicState


def test_workflow_config_cannot_have_duplicate_approval_states():
    with pytest.raises(
        Exception,
        match="Approval state pending_program_officer_approval is configured on two separate approvals",
    ):
        WorkflowConfig(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            persistence_model_cls=OpportunityPersistenceModel,
            entity_type=WorkflowEntityType.OPPORTUNITY,
            approval_mapping={
                "receive_budget_officer_approval": ApprovalConfig(
                    approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
                    approval_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
                    required_privileges=[Privilege.BUDGET_OFFICER_APPROVAL],
                ),
                "receive_budget_officer_approval_dupe": ApprovalConfig(
                    approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
                    approval_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
                    required_privileges=[Privilege.BUDGET_OFFICER_APPROVAL],
                ),
            },
        )
