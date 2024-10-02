import abc
import logging
import time
from typing import Any

import src.adapters.db as db
from src.task.task import Task

logger = logging.getLogger(__name__)


class SubTask(abc.ABC, metaclass=abc.ABCMeta):
    """
    A SubTask is a class that defines a set of behavior
    that can be seen as a subset of a Task.

    This object has access to the same internal metrics
    and reporting attributes as its Task, but can be defined
    as a separate class which can help with organizing large
    complex tasks that can't be easily broken down.
    """

    def __init__(self, task: Task):
        self.task = task

    def run(self) -> None:
        try:
            logger.info("Starting subtask %s", self.cls_name())
            start = time.perf_counter()

            # Run the actual subtask
            self.run_subtask()

            # Calculate and set a duration
            end = time.perf_counter()
            duration = round((end - start), 3)
            self.set_metrics({f"{self.cls_name()}_subtask_duration_sec": duration})

            logger.info("Completed subtask %s in %s seconds", self.cls_name(), duration)

        except Exception:
            logger.exception("Failed to run subtask %s", self.cls_name())
            raise

    def set_metrics(self, metrics: dict[str, Any]) -> None:
        # Passthrough method to the task set_metrics function
        self.task.set_metrics(metrics)

    def increment(self, name: str, value: int = 1, prefix: str | None = None) -> None:
        # Passthrough method to the task increment function
        self.task.increment(name, value, prefix)

    def cls_name(self) -> str:
        return self.__class__.__name__

    @abc.abstractmethod
    def run_subtask(self) -> None:
        """Override to define the subtask logic"""
        pass

    @property
    def db_session(self) -> db.Session:
        # Property to make it so the subtask can reference the db_session
        # as if it were the task itself
        return self.task.db_session

    @property
    def metrics(self) -> dict[str, Any]:
        return self.task.metrics
