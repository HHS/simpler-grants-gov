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
    """Initialize the New Relic app for a long-running service task.

    Note that we can't just do this above as New Relic says not
    to do it during global import lock:
    https://docs.newrelic.com/docs/apm/agents/python-agent/python-agent-api/registerapplication-python-agent-api/#globl-lock

    So we call this at the start of the service_background_task
    decorator function.
    """
    global _newrelic_application
    _newrelic_application = newrelic.agent.register_application(timeout=10.0)


def _newrelic_app() -> newrelic.api.application.Application:
    global _newrelic_application
    if _newrelic_application is None:
        raise Exception("New Relic app has not been initialized, cannot proceed.")

    return _newrelic_application


def service_background_task(task_name: str) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator for a long-running (always-on) ECS service task. This is very
    similar to our ecs_background_task, but doesn't setup a transaction
    as we want each unit of work (e.g. each queue message) treated as its
    own transaction, which can be done with the service_transaction
    function below.
    """

    def decorator(f: Callable[P, T]) -> Callable[P, T]:
        @wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Initialize the New Relic app - unlike ecs_background_task
            # we don't start transactions here, that will instead wrap the
            # per-unit processing logic.
            _init_newrelic_app()
            # Wrap with our own logging (timing/general logs)
            with _service_background_task_impl(task_name):
                # Finally actually run the task
                return f(*args, **kwargs)

        return wrapper

    return decorator


@contextlib.contextmanager
def _service_background_task_impl(task_name: str) -> Generator[None]:
    start = time.perf_counter()
    # Reuse the same log_metadata approach as other ECS tasks
    _add_log_metadata(task_name)
    logger.info("Starting %s", task_name)

    try:
        yield
    except Exception:
        logger.exception("Service task failed", extra={"service_task_name": task_name})
        raise
    finally:
        end = time.perf_counter()
        duration = round((end - start), 3)
        logger.info(
            "Service task finished running",
            extra={"service_task_name": task_name, "service_task_uptime_sec": duration},
        )


@contextlib.contextmanager
def service_transaction(name: str, group: str) -> Generator[None]:
    """Record a transaction for one unit of work in a long-running service.

    The group and name are used to define a transaction type.

    The group serves as the prefix (eg. a group of "WorkflowMain" will prefix every transaction)
    and the name serves as the end of the transaction.

    Usage:
       with service_transaction("transaction-type", group="MyService"):
          ...
    """
    # As configured, transactions will be named as
    # "{group}/{name}" in APM in New Relic.
    with newrelic.agent.BackgroundTask(_newrelic_app(), name=name, group=group):
        yield


def record_event(event_type: str, params: dict) -> None:
    newrelic.agent.record_custom_event(event_type, params, application=_newrelic_app())
