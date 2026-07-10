from .workflow_blueprint import workflow_blueprint

# import workflow_routes module to register the API routes on the blueprint
import src.api.workflows.workflow_routes  # noqa: F401 isort:skip

# Load all CLI commands used by the workflow CLI command
# so that Flask is aware of them
import src.workflow.cli.workflow_main  # noqa: F401 isort:skip

__all__ = ["workflow_blueprint"]
