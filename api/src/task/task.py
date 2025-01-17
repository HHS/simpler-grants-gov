import abc
import logging
import time
import uuid
from enum import StrEnum
from typing import Any

import src.adapters.db as db
from src.db.models.task_models import JobStatus, JobTable

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
        self.job: JobTable | None = None

    def run(self) -> None:
        try:
            # Create initial job record
            job_id = uuid.uuid4()
            self.job = JobTable(
                job_id=job_id, job_type=self.cls_name(), job_status=JobStatus.STARTED
            )
            self.db_session.add(self.job)
            self.db_session.commit()

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

            # Update job status to completed
            self.update_job(JobStatus.COMPLETED, metrics=self.metrics)
            self.job.metrics = self.metrics
            self.db_session.commit()

            logger.info("Completed %s in %s seconds", self.cls_name(), duration, extra=self.metrics)
        except Exception:
            # Update job status to failed
            self.update_job(JobStatus.FAILED, metrics=self.metrics)

            logger.exception("Failed to run task %s", self.cls_name())
            raise

    def initialize_metrics(self) -> None:
        zero_metrics_dict: dict[str, Any] = {metric: 0 for metric in self.Metrics}
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

    def cls_name(self) -> str:
        return self.__class__.__name__

    def update_job(self, job_status: JobStatus, metrics: dict[str, Any] | None = None) -> None:
        if self.job is None:
            raise ValueError("Job is not initialized")

        self.job.job_status = job_status
        self.job.metrics = metrics
        self.db_session.commit()

    @abc.abstractmethod
    def run_task(self) -> None:
        """Override to define the task logic"""
        pass
