from enum import StrEnum
from typing import Any

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import ApprovalType, Privilege, WorkflowEntityType, WorkflowType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import ApprovalConfig, WorkflowConfig


class InitialPrototypeState(StrEnum):
    START = "start"

    PENDING_PROGRAM_OFFICER_APPROVAL = "pending_program_officer_approval"
    PENDING_BUDGET_OFFICER_APPROVAL = "pending_budget_officer_approval"

    # End States
    DECLINED = "declined"
    END = "end"


initial_prototype_state_machine_config = WorkflowConfig(
    workflow_type=WorkflowType.INITIAL_PROTOTYPE,
    persistence_model_cls=OpportunityPersistenceModel,
    entity_types=[WorkflowEntityType.OPPORTUNITY],
    approval_mapping={
        # Program Officer Approvals
        InitialPrototypeState.PENDING_PROGRAM_OFFICER_APPROVAL: ApprovalConfig(
            approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
            required_privileges=[Privilege.PROGRAM_OFFICER_APPROVAL],
        ),
        # Budget Officer Approvals
        InitialPrototypeState.PENDING_BUDGET_OFFICER_APPROVAL: ApprovalConfig(
            approval_type=ApprovalType.BUDGET_OFFICER_APPROVAL,
            required_privileges=[Privilege.BUDGET_OFFICER_APPROVAL],
        ),
    },
)


@WorkflowRegistry.register_workflow(initial_prototype_state_machine_config)
class InitialPrototypeStateMachine(BaseStateMachine):
    ### States
    states = States.from_enum(
        InitialPrototypeState,
        initial=InitialPrototypeState.START,
        final=[InitialPrototypeState.END, InitialPrototypeState.DECLINED],
        use_enum_instance=True,
    )

    ### Events + transitions
    start_workflow = Event(
        states.START.to(states.PENDING_PROGRAM_OFFICER_APPROVAL),
    )

    ## Program officer approvals
    receive_program_officer_approval = Event(
        # If Approved -> Add approval event and then check if enough approvals have occurred to determine next state
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(
            cond="is_approval_event_approved",
            on="on_agency_approval_approved",
            after="check_program_officer_approval",
        )
        |
        # If Declined -> Add approval event and move to Declined state
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.DECLINED, cond="is_approval_event_declined", on="on_agency_approval_declined"
        )
        |
        # If Requires Modification -> Add approval event and move back to Start
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.START,
            cond="is_approval_event_requires_modification",
            on="on_agency_approval_requires_modification",
        )
    )

    check_program_officer_approval = Event(
        # If it has enough approvals, go to the Budget officer approval
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.PENDING_BUDGET_OFFICER_APPROVAL, cond="has_enough_approvals"
        )
        # If not, stay in this state
        | states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(),
    )

    ## Budget officer approvals
    receive_budget_officer_approval = Event(
        # If Approved -> Add approval event and then check if enough approvals have occurred to determine next state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(
            cond="is_approval_event_approved",
            on="on_agency_approval_approved",
            after="check_budget_officer_approval",
        )
        |
        # If Declined -> Add approval event and move to End state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.DECLINED, cond="is_approval_event_declined", on="on_agency_approval_declined"
        )
        |
        # If Requires Modification -> Add approval event and move back to Start
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.START,
            cond="is_approval_event_requires_modification",
            on="on_agency_approval_requires_modification",
        )
    )

    check_budget_officer_approval = Event(
        # If it has enough approvals, go to the End state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(states.END, cond="has_enough_approvals")
        # If not, stay in this state
        | states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(),
    )

    def __init__(self, model: OpportunityPersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity
