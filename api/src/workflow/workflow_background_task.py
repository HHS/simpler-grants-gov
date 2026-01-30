import contextlib
import logging
import time
from collections.abc import Callable, Generator
from functools import wraps
from typing import ParamSpec, TypeVar

import newrelic.agent
import newrelic.api.application

from src.task.ecs_background_task import _add_log_metadata

logger = logging.getLogger(__name__)

P = ParamSpec("P")
T = TypeVar("T")

_newrelic_application: newrelic.api.application.Application | None = None


def _init_newrelic_app() -> None:
    """Initialize the New Relic app for the workflow task.

    Note that we can't just do this above as New Relic says not
    to do it during global import lock:
    https://docs.newrelic.com/docs/apm/agents/python-agent/python-agent-api/registerapplication-python-agent-api/#globl-lock

    So we call this at the start of the workflow_background_task
    decorator function.
    """
    global _newrelic_application
    _newrelic_application = newrelic.agent.register_application(timeout=10.0)


def _newrelic_app() -> newrelic.api.application.Application:
    global _newrelic_application
    if _newrelic_application is None:
        raise Exception("New Relic app has not been initialized, cannot proceed.")

    return _newrelic_application


def workflow_background_task(
    task_name: str = "workflow-main",
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator for a workflow ECS task. This is very similar
    to our ecs_background_task, but doesn't setup a transaction
    as we want to have each event processed treated as a transaction
    which can be done with the workflow_transaction function below.
    """

    def decorator(f: Callable[P, T]) -> Callable[P, T]:
        @wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Initialize the New Relic app - unlike ecs_background_task
            # we don't start transactions here, that will instead wrap the
            # events processing logic.
            _init_newrelic_app()
            # Wrap with our own logging (timing/general logs)
            with _workflow_background_task_impl(task_name):
                # Finally actually run the task
                return f(*args, **kwargs)

        return wrapper

    return decorator


@contextlib.contextmanager
def _workflow_background_task_impl(task_name: str) -> Generator[None]:
    start = time.perf_counter()
    # Reuse the same log_metadata approach as other ECS tasks
    _add_log_metadata(task_name)
    logger.info("Starting Workflow Management")

    try:
        yield
    except Exception:
        logger.exception("Workflow management failed")
        raise
    finally:
        end = time.perf_counter()
        duration = round((end - start), 3)
        logger.info(
            "Workflow management finished running",
            extra={"workflow_management_uptime_sec": duration},
        )


@contextlib.contextmanager
def workflow_transaction(event_type: str) -> Generator[None]:
    """Record a workflow transaction.

    The group and name are used to define a transaction type.

    The group serves as the prefix (eg. a group of "WorkflowMain" will prefix every transaction).
    and the name serves as the end of the transaction.

    The group is also used to give the transaction type a specific
    name separate from the API requests.

    Usage:
       with workflow_transaction("transaction-type"):
          ...
    """
    # As configured, transactions will be named as
    # "WorkflowMain/{event_type}" in apm in New Relic.
    with newrelic.agent.BackgroundTask(_newrelic_app(), name=event_type, group="WorkflowMain"):
        yield
