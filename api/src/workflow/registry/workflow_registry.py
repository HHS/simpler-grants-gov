from collections.abc import Callable

from src.constants.lookup_constants import WorkflowType
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_errors import InvalidWorkflowTypeError


class WorkflowRegistry:
    """
    A global container for workflow configuration.

    Used to easily map a workflow type to a workflow
    configuration and state machine class.
    """

    _workflow_registry: dict[WorkflowType, tuple[WorkflowConfig, type[BaseStateMachine]]] = {}

    @classmethod
    def register_workflow(
        cls, config: WorkflowConfig
    ) -> Callable[[type[BaseStateMachine]], type[BaseStateMachine]]:
        """Attach the workflow config to a particular state machine.

        Can be used as::

        config = WorkflowConfig(...)

        @WorkflowRegistry.register_workflow(config)
        class MyStateMachine(BaseStateMachine):
            pass
        """

        def decorator(state_machine_cls: type[BaseStateMachine]) -> type[BaseStateMachine]:
            if config.workflow_type in cls._workflow_registry:
                raise Exception(
                    f"Cannot attach workflow config to state machine {state_machine_cls.__name__}, state machine already registered."
                )

            cls._workflow_registry[config.workflow_type] = (config, state_machine_cls)

            return state_machine_cls

        return decorator

    @classmethod
    def get_state_machine_for_workflow_type(
        cls, workflow_type: WorkflowType
    ) -> tuple[WorkflowConfig, type[BaseStateMachine]]:
        """For a given workflow type, get the workflow config + state machine class"""
        result = cls._workflow_registry.get(workflow_type)
        if result is None:
            raise InvalidWorkflowTypeError("Workflow event does not map to an actual state machine")

        return result
