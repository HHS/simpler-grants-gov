from src.api.workflows.workflow_blueprint import workflow_blueprint
from src.workflow.manager.workflow_manager import WorkflowManager


@workflow_blueprint.cli.command("workflow-main")
def workflow_main() -> None:
    """Main entry-point of the workflow management."""
    WorkflowManager().process_events()
