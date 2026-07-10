import logging
from typing import Any

import grants_shared.adapters.db as db

from src.db.models.task_models import JobLog, JobStatus
from src.task.base_task import BaseTask

logger = logging.getLogger(__name__)


class Task(BaseTask):
    """
    Task implementation that persists job status and metrics to the JobLog table.

    All reusable functionality (DB session management, metrics, timing, and error
    handling) lives in BaseTask. This class only adds the JobLog persistence.
    """

    def __init__(self, db_session: db.Session) -> None:
        super().__init__(db_session)
        self.job: JobLog | None = None

    def start_job(self) -> None:
        # Create initial job record
        self.job = JobLog(job_type=self.cls_name(), job_status=JobStatus.STARTED)
        self.db_session.add(self.job)
        self.db_session.commit()

    def finish_job(self, job_succeeded: bool) -> None:
        job_status = JobStatus.COMPLETED if job_succeeded else JobStatus.FAILED
        self.update_job(job_status, metrics=self.metrics)

    def update_job(self, job_status: JobStatus, metrics: dict[str, Any] | None = None) -> None:
        if self.job is None:
            raise ValueError("Job is not initialized")

        self.job.job_status = job_status
        self.job.metrics = self.metrics
        self.db_session.commit()
