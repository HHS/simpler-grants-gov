import uuid
from abc import ABC, abstractmethod

from sqlalchemy import select
from statemachine.contrib.diagram import DotGraphMachine
from statemachine.exceptions import TransitionNotAllowed
from statemachine.event_data import EventData
import statemachine
from statemachine.states import States
from statemachine.mixins import MachineMixin

from src.adapters import db
from src.db.models.opportunity_models import OpportunityApproval, Opportunity
from src.db.models.workflow_models import Workflow, WorkflowAudit
from src.task import task_blueprint
import dataclasses
from enum import StrEnum
import logging

logger = logging.getLogger(__name__)

@dataclasses.dataclass
class BaseWorkflowEvent:
    # TODO - this would be an actual ID
    acting_user_id: str

@dataclasses.dataclass
class StartWorkflowEvent(BaseWorkflowEvent):
    workflow_type: str

    # TODO - The entity ID structure needs to be sorted out
    opportunity_id: uuid.UUID | None = None


@dataclasses.dataclass
class ProcessWorkflowEvent(BaseWorkflowEvent):
    workflow_id: uuid.UUID

    event: str # TODO - figure out what type this would be

    # TODO - other metadata?

class ExampleState(StrEnum):
    START = "start"
    APPROVAL_NEEDED = "approval_needed"
    APPROVAL_RECEIVED = "approval_received"
    SEND_EMAIL = "send_email"
    END = "end"


class AbstractPersistentModel(ABC):
    """Abstract Base Class for persistent models.

    Subclasses should implement concrete strategies for:

    - `_read_state`: Read the state from the concrete persistent layer.
    - `_write_state`: Write the state from the concrete persistent layer.
    """

    def __init__(self, db_session: db.Session, workflow: Workflow):
        self.db_session = db_session
        self.workflow = workflow

    def __repr__(self):
        # TODO - do we need this?
        return repr(self.workflow)

    @property
    def state(self):
        return self.workflow.current_workflow_state

    @state.setter
    def state(self, value):
        """Setter for the state, anytime the state changes
           on the state machine, set that value in the workflow
           table.
        """
        self.workflow.current_workflow_state = value

    def after_transition(self, state: statemachine.state.State):
        # After each transition, check if the current state
        # is the final one, and set the is_active flag accordingly.
        self.workflow.is_active = not state.final

class OpportunityPersistentModel(AbstractPersistentModel):

    def __init__(self, db_session: db.Session, workflow: Workflow):
        super().__init__(db_session, workflow)

        if workflow.opportunity is None:
            raise Exception("TODO - want to error if the opportunity workflow has no opportunity")
        self.opportunity = workflow.opportunity



class ExampleStateMachine(statemachine.StateMachine):

    ### EVENTS

    states = States.from_enum(
        ExampleState,
        initial=ExampleState.START,
        final=ExampleState.END,
        use_enum_instance=True
    )

    ### TRANSITIONS

    # ALL workflows should have a start_workflow transition
    # So that we make an event even if the workflow can't do anything yet.
    start_workflow = states.START.to(states.APPROVAL_NEEDED)

    receive_approval = states.APPROVAL_NEEDED.to(states.APPROVAL_RECEIVED, after="check_approvers")

    check_approvers = states.APPROVAL_RECEIVED.to(states.SEND_EMAIL, after="do_email_send", cond="has_enough_approvers") | states.APPROVAL_RECEIVED.to(states.APPROVAL_NEEDED)
    do_email_send = states.SEND_EMAIL.to(states.END)

    def __init__(self, model: OpportunityPersistentModel, **kwargs):
        super().__init__(model=model, **kwargs)
        self.opportunity = model.opportunity
        self.db_session = model.db_session

    def has_enough_approvers(self):
        return len(self.opportunity.approvers) >= 3

    @do_email_send.on
    def send_email(self, event_metadata):
        # Pretend this actually sends an email
        # But importantly, despite this being a different event
        # because they're daisy-chained, we can pass who was that last approver
        # to another state if needed.
        print(f"SENDING AN EMAIL TO THE LAST APPROVER {event_metadata}")

    @receive_approval.on
    def handle_receive_approval(self, event_metadata):
        self.opportunity.approvers.append(OpportunityApproval(opportunity=self.opportunity, approver=event_metadata.acting_user_id))


class AuditListener:

    def __init__(self):
        self.user_id = None

    def on_transition(self, event_data: EventData, model: OpportunityPersistentModel):
        print("----")
        print(event_data)
        print("----")

        # TODO - is there a better way?
        event_metadata = event_data.extended_kwargs.get("event_metadata")
        if event_metadata is not None:
            user_id = event_metadata.acting_user_id
        else:
            user_id = None

        # TODO - how would we determine the user?
        logger.info("Workflow event occurred", extra={"workflow_id": model.workflow.workflow_id, "event": event_data.event.name, "source_state": event_data.source.value, "target_state": event_data.target.value})
        model.db_session.add(WorkflowAudit(workflow=model.workflow, source_state=event_data.source.value, target_state=event_data.target.value, transition_event=event_data.event.name, user_id=user_id))


def get_listeners() -> list:
    return [AuditListener()]

def _handle_event(db_session: db.Session, event_metadata: StartWorkflowEvent | ProcessWorkflowEvent) -> statemachine.StateMachine:

    if isinstance(event_metadata, StartWorkflowEvent):

        # TODO - Find the entity with some variability
        # assuming opportunity for now
        opportunity = db_session.execute(select(Opportunity).where(Opportunity.opportunity_id == event_metadata.opportunity_id)).scalar_one_or_none()
        if opportunity is None:
            raise Exception("Opportunity not found")

        # TODO - probably some sort of check on whether
        # we can create the workflow.
        # Probably by checking some defined workflow config stapled to a workflow?

        # Create the workflow
        workflow = Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type=event_metadata.workflow_type,
            # TODO - need logic to determine the state machine
            # before this
            current_workflow_state=ExampleStateMachine.initial_state.value,
            # is_active will be added by the state machine
            # TODO - how to handle is_active
            opportunity=opportunity,
        )
        db_session.add(workflow)
        event = "start_workflow"
    else:
        # Fetch the workflow

        workflow = db_session.execute(select(Workflow).where(Workflow.workflow_id == event_metadata.workflow_id)).scalar_one_or_none()
        if workflow is None:
            # TODO - logging / better errors
            raise Exception(f"No workflow found with ID {event_metadata.workflow_id}")

        event = event_metadata.event

    # Run the workflow
    # TODO - mapping for model types and grabbing workflow
    model = OpportunityPersistentModel(db_session=db_session, workflow=workflow)
    example = ExampleStateMachine(model, listeners=get_listeners())

    # TODO - this naming is terrible
    example.send(event=event, event_metadata=event_metadata)

    return example

def handle_event(db_session: db.Session, event: StartWorkflowEvent | ProcessWorkflowEvent) -> statemachine.StateMachine:
    # TODO - do we need to fetch DB sessions separately for each event handler? Probably.

    # TODO - a context object would be nice to shove stuff into to make things like logging nicer
    with db_session.begin():
        return _handle_event(db_session, event)



# TODO
# Error handling - think about it
# Locking a workflow?
# Queue approach - SQS versus a DB table versus ??
# Daemon, how to set that up
# Do we want to consider asyncio (advantages versus added complexity?)
# DB table schema (workflows, events, audit history, anything else?)
# Event schema - regardless of approach, need a generic way to define and deserialize events into many different types (mapper class?)
