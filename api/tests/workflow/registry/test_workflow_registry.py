import pytest

from src.constants.lookup_constants import WorkflowType
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_machine.initial_prototype_state_machine import (
    InitialPrototypeStateMachine,
    initial_prototype_state_machine_config,
)
from src.workflow.workflow_errors import InvalidWorkflowTypeError
from tests.workflow.state_machine.test_state_machines import (
    BasicTestStateMachine,
    basic_test_workflow_config,
)


def test_get_state_machine_for_workflow():
    config, state_machine_cls = WorkflowRegistry.get_state_machine_for_workflow_type(
        WorkflowType.INITIAL_PROTOTYPE
    )

    assert state_machine_cls is InitialPrototypeStateMachine
    assert config is initial_prototype_state_machine_config

    config, state_machine_cls = WorkflowRegistry.get_state_machine_for_workflow_type(
        WorkflowType.BASIC_TEST_WORKFLOW
    )

    assert state_machine_cls is BasicTestStateMachine
    assert config is basic_test_workflow_config

    # Pass in a workflow that doesn't exist
    with pytest.raises(
        InvalidWorkflowTypeError, match="Workflow event does not map to an actual state machine"
    ):
        WorkflowRegistry.get_state_machine_for_workflow_type("something-else")


def test_workflow_registry_duplicate_error():
    """Test that trying to register a workflow type that already has been registered will error."""
    with pytest.raises(Exception, match="Cannot attach workflow config to state machine"):
        # This is the equivalent of
        #
        # @WorkflowRegistry.register_workflow(basic_test_workflow_config)
        # class BasicTestStateMachine(StateMachine):
        #    ...
        #
        # But works around the class already being defined.
        WorkflowRegistry.register_workflow(basic_test_workflow_config)(BasicTestStateMachine)
