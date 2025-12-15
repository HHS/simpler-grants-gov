from abc import ABC, abstractmethod
from statemachine.contrib.diagram import DotGraphMachine
from statemachine.exceptions import TransitionNotAllowed
import statemachine
from statemachine.states import States
from statemachine.mixins import MachineMixin
from src.task import task_blueprint
import dataclasses
from enum import StrEnum

class ExampleState(StrEnum):
    APPROVAL_NEEDED = "approval_needed"
    APPROVAL_RECEIVED = "approval_received"
    SEND_EMAIL = "send_email"
    END = "end"


@dataclasses.dataclass
class FakeOpportunity:
    # Imagine this is the opportunity model object
    title: str
    approvers: list[str] = dataclasses.field(default_factory=list)

    # Imagine this is a config being pulled from elsewhere
    required_approvers: int = 3

    history: list[str] = dataclasses.field(default_factory=list)

    # TODO - this would probably be a separate set of tables
    # and probably store a list of values
    opportunity_state: str = "approval_needed"

class AbstractPersistentModel(ABC):
    """Abstract Base Class for persistent models.

    Subclasses should implement concrete strategies for:

    - `_read_state`: Read the state from the concrete persistent layer.
    - `_write_state`: Write the state from the concrete persistent layer.
    """

    def __init__(self):
        self._state = None

    def __repr__(self):
        return f"{type(self).__name__}(state={self.state})"

    @property
    def state(self):
        if self._state is None:
            self._state = self._read_state()
        return self._state

    @state.setter
    def state(self, value):
        self._state = value
        self._write_state(value)

    @abstractmethod
    def _read_state(self): ...

    @abstractmethod
    def _write_state(self, value): ...

class OpportunityPersistentModel(AbstractPersistentModel):

    def __init__(self, opportunity: FakeOpportunity):
        super().__init__()
        self.opportunity = opportunity

    def _read_state(self):
        return self.opportunity.opportunity_state

    def _write_state(self, value):
        self.opportunity.history.append(value)
        self.opportunity.opportunity_state = value


class Example(statemachine.StateMachine):
    _states = States.from_enum(ExampleState, initial=ExampleState.APPROVAL_NEEDED, final=ExampleState.END)

    # TRANSITIONS
    # TODO - while the enum is nice for
    # the purposes of defining a value, using
    # an enum is a bit clunky.
    receive_approval = (_states.APPROVAL_NEEDED.to(_states.APPROVAL_RECEIVED, after="check_approvers"))
    check_approvers = _states.APPROVAL_RECEIVED.to(_states.SEND_EMAIL, after="do_email_send", cond="has_enough_approvers") | _states.APPROVAL_RECEIVED.to(_states.APPROVAL_NEEDED)
    do_email_send = _states.SEND_EMAIL.to(_states.END)

    def __init__(self, model: OpportunityPersistentModel):
        super().__init__(model=model)
        self.db_session = None # TODO

        self.opportunity = model.opportunity
        self.calls = []

    def on_transition(self, event_data, event):
        self.calls.append(str(event))
        return ""

    def has_enough_approvers(self):
        print(len(self.opportunity.approvers))
        return len(self.opportunity.approvers) >= 3

    def on_enter_send_email(self, approver: str):
        # Pretend this actually sends an email
        # But importantly, despite this being a different event
        # because they're daisy-chained, we can pass who was that last approver
        # to another state if needed.
        print(f"SENDING AN EMAIL TO THE LAST APPROVER {approver}")

    @receive_approval.on
    def handle_receive_approval(self, approver):
        print("in receive")
        self.opportunity.approvers.append(approver)
        print(self.opportunity.approvers)


@task_blueprint.cli.command("prototype")
def run():

    # Pretend this is an event queue we're constantly reading from
    events = [
        {"event": "receive_approval", "approver": "bob"},
        {"event": "receive_approval", "approver": "joe"},
        {"event": "receive_approval", "approver": "steve"},
    ]

    opp = FakeOpportunity("a title")

    e = Example(model=OpportunityPersistentModel(opp))

    for event in events:
        e.send(**event)

    # If we try to send an extra event
    # It'll error as that wouldn't be a valid
    # state transition. We'd have to build some sort
    # of support for this
    try:
        e.send("receive_approval", approver="joe")
    except TransitionNotAllowed:
        print("Transition not allowed")

    print("--------")
    print(e.current_state_value)

    print(e.calls)

    print(opp.__dict__)

    # If you want to output the workflow diagram as an image
    # Requires you to have installed dependencies first yourself
    if False:
        graph = DotGraphMachine(e)
        dot = graph()
        dot.write_png("example.png")


# TODO
# Error handling - think about it
# Locking a workflow?
# Queue approach - SQS versus a DB table versus ??
# Daemon, how to set that up
# Do we want to consider asyncio (advantages versus added complexity?)
# DB table schema (workflows, events, audit history, anything else?)
# Event schema - regardless of approach, need a generic way to define and deserialize events into many different types (mapper class?)
