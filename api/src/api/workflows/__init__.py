from .workflow_blueprint import workflow_blueprint

# import workflow_routes module to register the API routes on the blueprint
import src.api.workflows.workflow_routes  # ruff: ignore[unused-import] isort:skip

# Load all CLI commands used by the workflow CLI command
# so that Flask is aware of them
import src.workflow.cli.workflow_main  # ruff: ignore[unused-import] isort:skip

__all__ = ["workflow_blueprint"]
