from .workflow_blueprint import workflow_blueprint

# Load all CLI commands used by the workflow CLI command
# so that Flask is aware of them
import src.workflow.cli.workflow_main  # noqa: F401 isort:skip

__all__ = ["workflow_blueprint"]
