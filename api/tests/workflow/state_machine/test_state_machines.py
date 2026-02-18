"""
This file contains state machines that we use in our
unit tests. This is to avoid building unit tests against
real workflows for core logic as we'd otherwise need
to keep modifying tests as we modify the real workflows.
"""

from enum import StrEnum

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import ApprovalType, Privilege, WorkflowEntityType, WorkflowType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_config import ApprovalConfig, WorkflowConfig
from src.workflow.workflow_constants import WorkflowConstants

#########################
# Basic State Machine
#########################
# For testing core functionality with a very
# basic workflow.


class BasicState(StrEnum):
    START = "start"
    MIDDLE = "middle"

    PENDING_PROGRAM_OFFICER_APPROVAL = "pending_program_officer_approval"
    PENDING_BUDGET_OFFICER_APPROVAL = "pending_budget_officer_approval"

    DECLINED = "declined"
    END = "end"


basic_test_workflow_config = WorkflowConfig(
    workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
    persistence_model_cls=OpportunityPersistenceModel,
    entity_types=[WorkflowEntityType.OPPORTUNITY],
    approval_mapping={
        # Program Officer Approvals
        BasicState.PENDING_PROGRAM_OFFICER_APPROVAL: ApprovalConfig(
            approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
            required_privileges=[Privilege.PROGRAM_OFFICER_APPROVAL],
            minimum_approvals_required=3,  # require 3 approvals
        ),
        # Budget Officer Approvals
        BasicState.PENDING_BUDGET_OFFICER_APPROVAL: ApprovalConfig(
            approval_type=ApprovalType.BUDGET_OFFICER_APPROVAL,
            required_privileges=[Privilege.BUDGET_OFFICER_APPROVAL],
        ),
    },
)


@WorkflowRegistry.register_workflow(basic_test_workflow_config)
class BasicTestStateMachine(BaseStateMachine):

    states = States.from_enum(
        BasicState,
        initial=BasicState.START,
        final=[BasicState.END, BasicState.DECLINED],
        use_enum_instance=True,
    )

    ### Events + transitions
    start_workflow = Event(
        states.START.to(states.MIDDLE),
    )

    middle_to_end = Event(
        states.MIDDLE.to(states.END),
    )

    # These need to exist even if we don't use them
    # as StateMachine doesn't like states to be unreachable from the start state.
    middle_to_program_officer_approval = Event(
        states.MIDDLE.to(states.PENDING_PROGRAM_OFFICER_APPROVAL),
    )

    middle_to_budget_officer_approval = Event(
        states.MIDDLE.to(states.PENDING_BUDGET_OFFICER_APPROVAL),
    )

    ## Program officer approvals
    receive_program_officer_approval = Event(
        # If Approved -> Add approval event and then check if enough approvals have occurred to determine next state
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
            after="check_program_officer_approval",
        )
        |
        # If Declined -> Add approval event and move to End state
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.DECLINED,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_DECLINED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_DECLINED,
        )
        |
        # If Requires Modification -> Add approval event and move back to Start
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
        )
    )

    check_program_officer_approval = Event(
        # If it has enough approvals, go to the End state
        states.PENDING_PROGRAM_OFFICER_APPROVAL.to(
            states.END, cond=WorkflowConstants.HAS_ENOUGH_APPROVALS
        )
        # If not, stay in this state
        | states.PENDING_PROGRAM_OFFICER_APPROVAL.to.itself(),
    )

    ## Budget officer approvals
    receive_budget_officer_approval = Event(
        # If Approved -> Add approval event and then check if enough approvals have occurred to determine next state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
            after="check_budget_officer_approval",
        )
        |
        # If Declined -> Add approval event and move to End state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.DECLINED,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_DECLINED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_DECLINED,
        )
        |
        # If Requires Modification -> Add approval event and move back to Start
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
        )
    )

    check_budget_officer_approval = Event(
        # If it has enough approvals, go to the End state
        states.PENDING_BUDGET_OFFICER_APPROVAL.to(
            states.END, cond=WorkflowConstants.HAS_ENOUGH_APPROVALS
        )
        # If not, stay in this state
        | states.PENDING_BUDGET_OFFICER_APPROVAL.to.itself(),
    )

    def __init__(self, model: OpportunityPersistenceModel, **kwargs):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity
        self.db_session = model.db_session

        # For testing purposes, store the transition events.
        self.transition_history: list[StateMachineEvent] = []

    def on_transition(self, state_machine_event: StateMachineEvent) -> None:
        self.transition_history.append(state_machine_event)
