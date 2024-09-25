import contextlib
import logging
import os
import time
import uuid
from functools import wraps
from typing import Callable, Generator, ParamSpec, TypeVar

import requests

from src.logging.flask_logger import add_extra_data_to_global_logs

logger = logging.getLogger(__name__)

P = ParamSpec("P")
T = TypeVar("T")


def ecs_background_task(task_name: str) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator for any ECS Task entrypoint function.

    This encapsulates the setup required by all ECS tasks, making it easy to:
    - add new shared initialization steps for logging
    - write new ECS task code without thinking about the boilerplate

    Usage:

        TASK_NAME = "my-cool-task"

        @task_blueprint.cli.command(TASK_NAME, help="For running my cool task")
        @ecs_background_task(TASK_NAME)
        @flask_db.with_db_session()
        def entrypoint(db_session: db.Session):
            do_cool_stuff()

    Parameters:
      task_name (str): Name of the ECS task

    IMPORTANT: Do not specify this decorator before the task command.
               Click effectively rewrites your function to be a main function
               and any decorators from before the "task_blueprint.cli.command(...)"
               line are discarded.
               See: https://click.palletsprojects.com/en/8.1.x/quickstart/#basic-concepts-creating-a-command
    """

    def decorator(f: Callable[P, T]) -> Callable[P, T]:
        @wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            with _ecs_background_task_impl(task_name):
                return f(*args, **kwargs)

        return wrapper

    return decorator


@contextlib.contextmanager
def _ecs_background_task_impl(task_name: str) -> Generator[None, None, None]:
    # The actual implementation, see the docs on the
    # decorator method above for details on usage

    start = time.perf_counter()
    _add_log_metadata(task_name)

    # initialize new relic here when we add that

    logger.info("Starting ECS task %s", task_name)

    try:
        yield
    except Exception:
        # We want to make certain that any exception will always
        # be logged as an error
        # logger.exception is just an alias for logger.error(<msg>, exc_info=True)
        logger.exception("ECS task failed", extra={"status": "error"})
        raise

    end = time.perf_counter()
    duration = round((end - start), 3)
    logger.info(
        "Completed ECS task %s",
        task_name,
        extra={"ecs_task_duration_sec": duration, "status": "success"},
    )


def _add_log_metadata(task_name: str) -> None:
    # Note we set an "aws.ecs.task_name" as well pulled from ECS
    # which may be different as that value is set based on our infra setup
    # while this one is just based on whatever we passed the @ecs_background_task decorator
    add_extra_data_to_global_logs({"task_name": task_name, "task_uuid": str(uuid.uuid4())})
    add_extra_data_to_global_logs(_get_ecs_metadata())


def _get_ecs_metadata() -> dict:
    """
    Retrieves ECS metadata from an AWS-provided metadata URI. This URI is injected to all ECS tasks by AWS as an envar.
    See https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-metadata-endpoint-v4-fargate.html for more.
    """
    ecs_metadata_uri = os.environ.get("ECS_CONTAINER_METADATA_URI_V4")

    if os.environ.get("ENVIRONMENT", "local") == "local" or ecs_metadata_uri is None:
        logger.info(
            "ECS metadata not available for local environments. Run this task on ECS to see metadata."
        )
        return {}

    task_metadata = requests.get(ecs_metadata_uri, timeout=1)  # 1sec timeout
    logger.info("Retrieved task metadata from ECS")
    metadata_json = task_metadata.json()

    ecs_task_name = metadata_json["Name"]
    ecs_task_id = metadata_json["Labels"]["com.amazonaws.ecs.task-arn"].split("/")[-1]
    ecs_taskdef = ":".join(
        [
            metadata_json["Labels"]["com.amazonaws.ecs.task-definition-family"],
            metadata_json["Labels"]["com.amazonaws.ecs.task-definition-version"],
        ]
    )
    cloudwatch_log_group = metadata_json["LogOptions"]["awslogs-group"]
    cloudwatch_log_stream = metadata_json["LogOptions"]["awslogs-stream"]

    # Step function only
    sfn_execution_id = os.environ.get("SFN_EXECUTION_ID")
    sfn_id = sfn_execution_id.split(":")[-2] if sfn_execution_id is not None else None

    return {
        "aws.ecs.task_name": ecs_task_name,
        "aws.ecs.task_id": ecs_task_id,
        "aws.ecs.task_definition": ecs_taskdef,
        # these will be added automatically by New Relic log ingester, but
        # just to be sure and for non-log usages, explicitly declare them
        "aws.cloudwatch.log_group": cloudwatch_log_group,
        "aws.cloudwatch.log_stream": cloudwatch_log_stream,
        "aws.step_function.id": sfn_id,
    }
