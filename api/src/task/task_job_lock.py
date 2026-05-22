import contextlib
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select

from src.adapters import db
from src.db.models.task_models import JobLock
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class TaskJobLockError(Exception):
    pass


class TaskJobLockIsLockedError(Exception):
    pass


class TaskJobLockInternalIDError(Exception):
    pass


class TaskJobLockNotFoundError(Exception):
    pass


class TaskJobLockConfig(PydanticBaseEnvConfig):
    enable_job_lock: bool = False


class TaskJobLock(contextlib.AbstractContextManager[None]):

    def __init__(
        self,
        db_session: db.Session,
        job_type: str,
        *,
        lock_duration_minutes: int = 60,
    ) -> None:
        """
        Context Manager for any job task in order to prevent job tasks of the same kind overriding each other.

        Usage:
            with job_lock(
                db_session,
                job_type=JobType.EXAMPLE_JOB,
                lock_duration_minutes=60
            ):
                # any logic you want to be locked can go here
                ExampleJobTask(db_session).run()

        Parameters:
          job_type (JobType): Job type of the task
          lock_duration_minutes: sets a time for the locked status
        """
        self.db_session = db_session
        self.job_type = job_type
        self.lock_duration_minutes = lock_duration_minutes
        self.internal_lock_id = uuid.uuid4()
        self.config = TaskJobLockConfig()
        self.extra = {
            "job_type": self.job_type,
            "internal_lock_id": self.internal_lock_id,
            "job_lock_enabled": self.config.enable_job_lock,
        }
        self.lock_acquired_at: datetime | None = None

    def __enter__(self) -> None:
        logger.info("Entering the lock", extra=self.extra)
        if not self.config.enable_job_lock:
            return

        self.lock_acquired_at = datetime_util.utcnow()

        with self.db_session.begin():
            job_lock = self.get_or_create_job_lock()
            now = datetime_util.utcnow()
            if job_lock.is_locked and job_lock.locked_until > now:
                logger.warning(
                    "Job is currently locked",
                    extra={
                        **self.extra,
                        "locking_job_lock_id": job_lock.job_lock_id,
                        "success": False,
                        "error": "TaskJobLockIsLockedError",
                    },
                )
                raise TaskJobLockIsLockedError
            job_lock = self.set_job_lock_to_locked(job_lock)

        with self.db_session.begin():
            refreshed_job_lock = self.get_job_lock()
            if not refreshed_job_lock:
                raise TaskJobLockNotFoundError
            self.verify_job_lock(refreshed_job_lock)

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        logger.info("Exiting the lock", extra=self.extra)

        if not self.config.enable_job_lock:
            return

        try:
            with self.db_session.begin():
                job_lock = self.get_job_lock()

                if not job_lock:
                    raise TaskJobLockNotFoundError

                self.verify_job_lock(job_lock)
                job_lock = self.set_job_lock_to_unlocked(job_lock)

                logger.info(
                    "Job lock held duration",
                    extra={
                        **self.extra,
                        "lock_duration_seconds": self.get_duration_seconds(),
                        "success": True,
                        "lock_acquired_at": self.lock_acquired_at,
                    },
                )

        except Exception as e:
            logger.exception(
                "Failed to free the job lock",
                extra={
                    **self.extra,
                    "success": False,
                    "error": type(e).__name__,
                    "lock_duration_seconds": self.get_duration_seconds(),
                },
            )
            # If the exc_type passed in was not null, don't do anything
            # as that exception will be re-raised after this method ends
            # Leave the original error alone
            if exc_type is not None:
                return
            # Otherwise raise the specific exception we encountered for the job lock update failure.
            raise TaskJobLockError from e

    def get_duration_seconds(self) -> float | None:
        if self.lock_acquired_at is not None:
            return (datetime_util.utcnow() - self.lock_acquired_at).total_seconds()
        return None

    def verify_job_lock(self, job_lock: JobLock) -> None:
        if job_lock.locked_by != self.internal_lock_id:
            logger.error(
                "Job lock ids do not match",
                extra={
                    **self.extra,
                    "locked_by": job_lock.locked_by,
                    "success": False,
                    "error": "TaskJobLockInternalIDError",
                },
            )
            raise TaskJobLockInternalIDError

    def get_job_lock(self) -> JobLock | None:
        return self.db_session.execute(
            select(JobLock).where(JobLock.job_type == self.job_type).with_for_update()
        ).scalar_one_or_none()

    def get_or_create_job_lock(self) -> JobLock:
        job_lock = self.get_job_lock()
        if job_lock is None:
            job_lock = JobLock(job_type=self.job_type, is_locked=False)
        return job_lock

    def add_job_lock(self, job_lock: JobLock) -> None:
        self.db_session.add(job_lock)

    def set_job_lock_to_locked(self, job_lock: JobLock) -> JobLock:
        job_lock.locked_until = datetime_util.utcnow() + timedelta(
            minutes=self.lock_duration_minutes
        )
        job_lock.is_locked = True
        job_lock.locked_by = self.internal_lock_id
        self.add_job_lock(job_lock)
        return job_lock

    def set_job_lock_to_unlocked(self, job_lock: JobLock) -> JobLock:
        job_lock.is_locked = False
        self.add_job_lock(job_lock)
        return job_lock
