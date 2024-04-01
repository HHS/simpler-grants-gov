import abc
import logging
import time
from enum import StrEnum
from typing import Any

import src.adapters.db as db

logger = logging.getLogger(__name__)


class Task(abc.ABC, metaclass=abc.ABCMeta):
    """
    Abstract base class representing an arbitrary
    task that works with the database.

    This approach handles a few basic patterns including:
    - Simple metric aggregation & logging
    - Timing metrics
    - High-level error handling
    """

    class Metrics(StrEnum):
        # Derived classes will implement their own
        # Metrics class with metrics
        pass

    def __init__(self, db_session: db.Session) -> None:
        self.db_session = db_session
        self.metrics: dict[str, Any] = {}

    def run(self) -> None:
        try:
            logger.info("Starting %s", self.cls_name())
            start = time.perf_counter()

            # Initialize the metrics
            self.initialize_metrics()

            # Run the actual task
            self.run_task()

            # Calculate and set a duration
            end = time.perf_counter()
            duration = round((end - start), 3)
            self.set_metrics({"task_duration_sec": duration})

            logger.info("Completed %s in %s seconds", self.cls_name(), duration, extra=self.metrics)
        except Exception:
            logger.exception("Failed to run task %s", self.cls_name())
            raise

    def initialize_metrics(self) -> None:
        zero_metrics_dict: dict[str, Any] = {metric: 0 for metric in self.Metrics}
        self.set_metrics(zero_metrics_dict)

    def set_metrics(self, metrics: dict[str, Any]) -> None:
        self.metrics.update(**metrics)

    def increment(self, name: str, value: int = 1) -> None:
        if name not in self.metrics:
            self.metrics[name] = 0

        self.metrics[name] += value

    def cls_name(self) -> str:
        return self.__class__.__name__

    @abc.abstractmethod
    def run_task(self) -> None:
        """Override to define the task logic"""
        pass
