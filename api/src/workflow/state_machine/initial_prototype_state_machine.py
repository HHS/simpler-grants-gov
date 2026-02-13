from enum import StrEnum
from typing import Any

from sqlalchemy import select
from statemachine import Event
from statemachine.states import States

from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    Privilege,
    WorkflowEntityType,
    WorkflowType,
)
from src.db.models.workflow_models import WorkflowApproval, WorkflowEventHistory
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.processor.approval_processor import ApprovalProcessor
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import ApprovalConfig, WorkflowConfig


class InitialPrototypeState(StrEnum):
    ### States
    START = "start"

    PENDING_PROGRAM_OFFICER_APPROVAL = "pending_program_officer_approval"
    PENDING_BUDGET_OFFICER_APPROVAL = "pending_budget_officer_approval"

    # END States
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
        )
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

    ## Program officer approval transitions
    receive_program_officer_approval = Event(
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(
            on="on_agency_approval_approved",
            # after running this event, run another that checks
            # the total count of approvals and can move the state.
            after="check_program_officer_approval"
        ),
    )

    check_program_officer_approval = Event(
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.PENDING_BUDGET_OFFICER_APPROVAL, cond="has_enough_approvals"
        )
        | states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(),
    )

    receive_program_officer_declined = Event(
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.DECLINED,
            on="on_agency_approval_declined"
        )
    )

    ## Budget officer approval transitions
    receive_budget_officer_approval = Event(
        states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(
            on="on_agency_approval_approved",
            # after running this event, run another that checks
            # the total count of approvals and can move the state.
            after="check_budget_officer_approval"
        ),
    )

    check_budget_officer_approval = Event(
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.END, cond="has_enough_approvals"
        )
        | states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(),
    )

    receive_budget_officer_declined = Event(
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.DECLINED,
            on="on_agency_approval_declined"
        )
    )


    def __init__(self, model: OpportunityPersistenceModel, **kwargs: Any):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity
