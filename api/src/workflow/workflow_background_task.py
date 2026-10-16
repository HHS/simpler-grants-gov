"""Workflow-service aliases for the generic service task helpers.

The implementation lives in src/task/service_background_task.py so it can be
shared with other long-running consumers. This module keeps the original
workflow-flavored names (and the WorkflowMain transaction group) for the
workflow service.
"""

from collections.abc import Callable, Generator
from contextlib import contextmanager
from typing import ParamSpec, TypeVar

# These are re-exported for existing callers
from src.task.service_background_task import (  # ruff: ignore[unused-import]
    _init_newrelic_app,
    record_event,
    service_background_task,
    service_transaction,
)

P = ParamSpec("P")
T = TypeVar("T")


def workflow_background_task(
    task_name: str = "workflow-main",
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    return service_background_task(task_name)


@contextmanager
def workflow_transaction(event_type: str) -> Generator[None]:
    # Transactions are named "WorkflowMain/{event_type}" in New Relic APM.
    with service_transaction(event_type, group="WorkflowMain"):
        yield
