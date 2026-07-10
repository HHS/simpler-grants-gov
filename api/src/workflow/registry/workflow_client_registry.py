import dataclasses

from src.adapters.search import SearchClient


@dataclasses.dataclass
class WorkflowClientRegistry:
    """
    A registry for clients or other things we only want to initialize once
    for our workflow service. This should be considered a global registry
    that does not change once initialized at app startup.

    We do this to avoid piping through clients or utilities that need
    to be initialized at the top of the application, but are only needed
    infrequently in workflows.

    We don't do this for things like the DB session as that's needed
    in all workflows.
    """

    search_client: SearchClient


_registry: WorkflowClientRegistry | None = None


def init_workflow_client_registry(search_client: SearchClient) -> WorkflowClientRegistry:
    """Initialize the workflow client registry by passing in any globally defined clients."""
    global _registry

    # Only initialize once
    if _registry is None:
        _registry = WorkflowClientRegistry(search_client=search_client)

    return _registry


def get_workflow_client_registry() -> WorkflowClientRegistry:
    """
    Get a workflow client registry - must have called init during process first,
    which is done in the WorkflowManager during ordinary processing.
    """
    global _registry

    if _registry is None:
        raise Exception("WorkflowClientRegistry is not initialized")

    return _registry
