import logging
import pathlib

from statemachine.contrib.diagram import DotGraphMachine

import src.logging
from src.util.local import error_if_not_local
from src.workflow.registry.workflow_registry import WorkflowRegistry

# We import the state_machine directory so the module is loaded
# and the workflows are populated into the WorkflowRegistry
import src.workflow.state_machine  # noqa: F401 isort:skip


logger = logging.getLogger(__name__)


def create_workflow_diagrams() -> None:
    """Create workflow diagrams for each of our configured state machines

    See: https://python-statemachine.readthedocs.io/en/latest/diagram.html
    """
    # Only let this run locally,
    # making files non-locally wouldn't make much sense
    error_if_not_local()
    logger.info("Creating workflow diagrams")

    # Get the path of the parent directory (the /api directory)
    parent_folder = pathlib.Path(__file__).parent.parent.resolve()
    # We want to put these in state_machine/diagrams
    diagram_folder = parent_folder / "src" / "workflow" / "state_machine" / "diagrams"

    # Use the workflow registry to get state machines that we want
    for _, state_machine_cls in WorkflowRegistry._workflow_registry.values():
        file_name = f"{state_machine_cls.__name__}.png"
        path = diagram_folder / file_name

        logger.info(f"Creating workflow diagram for {state_machine_cls.__name__} at {path}")

        DotGraphMachine(state_machine_cls)().write_png(path)  # type: ignore[arg-type]


def main() -> None:
    with src.logging.init(__package__):
        create_workflow_diagrams()
