import abc
import itertools
import logging
import time
from enum import StrEnum
from typing import Any

import grants_shared.adapters.db as db

logger = logging.getLogger(__name__)

TASK_CLASS_KEY = "task_class"


class BaseTask(abc.ABC, metaclass=abc.ABCMeta):
    """
    Abstract base class representing an arbitrary
    task that works with the database.

    This approach handles a few basic patterns including:
    - Simple metric aggregation & logging
    - Timing metrics
    - High-level error handling

    The persistence of job status/metrics is delegated to the abstract
    ``start_job`` and ``finish_job`` methods so this class has no direct
    dependency on any particular database table.
    """

    class Metrics(StrEnum):
        # Derived classes will implement their own
        # Metrics class with metrics
        pass

    def __init__(self, db_session: db.Session) -> None:
        self.db_session = db_session
        self.metrics: dict[str, Any] = {}

    def run(self) -> None:
        job_succeeded = True

        try:
            # Record the start of the job
            self.start_job()

            # Initialize the metrics
            self.initialize_metrics()

            # Start the timer
            logger.info("Starting %s", self.cls_name())
            start = time.perf_counter()

            # Run the actual task
            self.run_task()

            # Calculate and set a duration
            end = time.perf_counter()
            duration = round((end - start), 3)
            self.set_metrics({"task_duration_sec": duration})

            self._log_metrics(duration)
        except Exception:
            job_succeeded = False
            raise
        finally:
            # Rollback if the session is not active due to error above
            if not self.db_session.is_active:
                self.db_session.rollback()

            self.finish_job(job_succeeded)

    def initialize_metrics(self) -> None:
        zero_metrics_dict: dict[str, Any] = {metric: 0 for metric in self.Metrics}
        zero_metrics_dict[TASK_CLASS_KEY] = self.cls_name()
        self.set_metrics(zero_metrics_dict)

    def set_metrics(self, metrics: dict[str, Any]) -> None:
        self.metrics.update(**metrics)

    def increment(self, name: str, value: int = 1, prefix: str | None = None) -> None:
        if name not in self.metrics:
            self.metrics[name] = 0

        self.metrics[name] += value

        if prefix is not None:
            # Rather than re-implement the above, just re-use the function without a prefix
            self.increment(f"{prefix}.{name}", value, prefix=None)

    def _log_metrics(self, duration: float) -> None:
        """Log metrics out, handling metrics if they exceed the maximum number of reportable metrics."""

        # New Relic has a limit of 255 metrics maximum. It won't ingest the logs
        # if there are more than that number of key-value pairs. In addition to the metrics
        # we've added, we add various other attributes to the logs (environment, ecs info),
        # so we should assume a chunk of that 255 is already reserved. For simplicity,
        # if there are more than 100 metrics, we'll be careful and batch the log message.
        if len(self.metrics) > 100:
            # add a warning, we should probably refactor something if this is regularly
            # happening, but we'll account for it below.
            logger.warning(
                "A large number of metrics are being added for this task - batching them together",
                extra={TASK_CLASS_KEY: self.cls_name(), "metric_count": len(self.metrics)},
            )

            metric_batches: list[dict[str, Any]] = []

            # Since a lot of our dashboards depend on pulling values out by the task_class
            # make sure that's included in every batch automatically.
            iter_metrics = {k: v for k, v in self.metrics.items() if k != TASK_CLASS_KEY}
            for batch in itertools.batched(iter_metrics.items(), n=100, strict=False):
                metric_batch = dict(batch)
                metric_batch[TASK_CLASS_KEY] = self.cls_name()
                metric_batches.append(metric_batch)

        else:  # By default, batch of 1 of everything
            metric_batches = [self.metrics]

        for metric_batch in metric_batches:
            logger.info("Completed %s in %s seconds", self.cls_name(), duration, extra=metric_batch)

    def cls_name(self) -> str:
        return self.__class__.__name__

    @abc.abstractmethod
    def start_job(self) -> None:
        """Override to record the start of the job (e.g. persist a job record)."""
        pass

    @abc.abstractmethod
    def finish_job(self, job_succeeded: bool) -> None:
        """Override to record the completion of the job, including final metrics."""
        pass

    @abc.abstractmethod
    def run_task(self) -> None:
        """Override to define the task logic"""
        pass
