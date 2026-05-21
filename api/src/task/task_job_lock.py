import contextlib
import logging
import uuid
from datetime import timedelta
from functools import cache
from typing import Any

from pydantic import Field
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
    enable_job_lock: bool = Field(alias="ENABLE_JOB_LOCK")


@cache
def get_task_job_lock_config() -> TaskJobLockConfig:
    return TaskJobLockConfig()


class TaskJobLock(contextlib.AbstractContextManager[None]):

    def __init__(
        self,
        db_session: db.Session,
        job_type: str,
        *,
        lock_duration_minutes: int = 60,
    ) -> None:
        self.db_session = db_session
        self.job_type = job_type
        self.lock_duration_minutes = lock_duration_minutes
        self.internal_lock_id = uuid.uuid4()
        self.config = get_task_job_lock_config()
        self.extra = {
            "job_type": self.job_type,
            "internal_lock_id": self.internal_lock_id,
            "job_locked_enabled": self.config.enable_job_lock,
        }

    def __enter__(self) -> None:
        logger.info("Entering the lock", extra=self.extra)
        if not self.config.enable_job_lock:
            return

        with self.db_session.begin_nested():
            job_lock = self.get_job_lock()

            if job_lock is None:
                job_lock = JobLock(job_type=self.job_type, is_locked=False)

            now = datetime_util.utcnow()
            if job_lock.is_locked and job_lock.locked_until > now:
                logger.error("Job is currently locked", extra=self.extra)
                raise TaskJobLockIsLockedError

            job_lock.locked_until = datetime_util.utcnow() + timedelta(
                minutes=self.lock_duration_minutes
            )
            job_lock.is_locked = True
            job_lock.locked_by = self.internal_lock_id
            self.db_session.add(job_lock)

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        logger.info("Exiting the lock", extra=self.extra)

        if not self.config.enable_job_lock:
            return

        try:
            with self.db_session.begin_nested():
                job_lock = self.get_job_lock()

                if not job_lock:
                    logger.error(
                        "JobLock not found",
                        extra=self.extra,
                    )
                    raise TaskJobLockNotFoundError

                if job_lock.locked_by != self.internal_lock_id:
                    updated_extra = {**self.extra, "locked_by": job_lock.locked_by}
                    logger.error(
                        "JobLock ids do not match",
                        extra=updated_extra,
                    )
                    raise TaskJobLockInternalIDError

                job_lock.is_locked = False
                self.db_session.add(job_lock)
        except Exception as e:
            logger.exception("Failed to free the job lock", extra=self.extra)
            # If the exc_type passed in was not null, don't do anything
            # as that exception will be re-raised after this method ends
            # Leave the original error alone
            if exc_type is not None:
                return
            # Otherwise raise the specific exception we encountered for the job lock update failure.
            raise TaskJobLockError from e

    def get_job_lock(self) -> JobLock | None:
        return self.db_session.execute(
            select(JobLock).where(JobLock.job_type == self.job_type)
        ).scalar_one_or_none()
