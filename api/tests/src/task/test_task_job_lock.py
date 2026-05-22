import logging
import uuid
from datetime import timedelta
from unittest import mock

import pytest
from sqlalchemy import delete, select

import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import JobType
from src.db.models.task_models import JobLock
from src.task.task_job_lock import (
    TaskJobLock,
    TaskJobLockError,
    TaskJobLockInternalIDError,
    TaskJobLockIsLockedError,
    TaskJobLockNotFoundError,
)
from tests.src.db.models.factories import JobLockFactory


@mock.patch("src.task.task_job_lock.TaskJobLock.get_or_create_job_lock")
def test_task_job_lock__does_not_create_a_job_lock_if_enable_job_lock_is_false(
    mock_get_or_create_job_lock, monkeypatch, db_session, enable_factory_create
):
    monkeypatch.setenv("ENABLE_JOB_LOCK", "False")
    with TaskJobLock(db_session, job_type=JobType.MIGRATE_UP, lock_duration_minutes=60):
        pass
    mock_get_or_create_job_lock.assert_not_called()


@mock.patch("src.task.task_job_lock.TaskJobLock.set_job_lock_to_locked")
def test_task_job_lock_does_not_modify_a_job_lock_if_enable_job_lock_is_false(
    mock_set_job_lock_to_locked, monkeypatch, db_session, enable_factory_create
):
    monkeypatch.setenv("ENABLE_JOB_LOCK", "False")
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(job_type=JobType.MIGRATE_UP, updated_at=old_date)
    with TaskJobLock(db_session, job_type=JobType.MIGRATE_UP, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    mock_set_job_lock_to_locked.assert_not_called()


def test_task_job_lock_creates_job_lock_if_one_does_not_exist(
    db_session, enable_factory_create
) -> None:
    with mock.patch("src.task.task_job_lock.TaskJobLock.get_job_lock", return_value=None):
        context_manager = TaskJobLock(
            db_session, job_type=JobType.MIGRATE_DOWN, lock_duration_minutes=60
        )
        context_manager.get_or_create_job_lock()
    job_lock = db_session.execute(
        select(JobLock).where(
            JobLock.job_type == JobType.MIGRATE_DOWN,
            JobLock.locked_by == context_manager.internal_lock_id,
        )
    ).scalar_one_or_none()
    assert job_lock is not None


def test_task_job_lock_updates_a_job_lock_if_enable_job_lock_is_true(
    caplog, db_session, enable_factory_create
):
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(job_type=JobType.MIGRATE_DOWNALL, updated_at=old_date)
    with TaskJobLock(db_session, job_type=JobType.MIGRATE_DOWNALL, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.MIGRATE_DOWNALL
    record = next(r for r in caplog.records if r.message == "Job lock released")
    assert record.lock_duration_seconds > 0
    assert record.success is True


def test_task_job_lock_handles_when_locked_until_is_in_the_past(db_session, enable_factory_create):
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(
        job_type=JobType.LOAD_TRANSFORM,
        updated_at=old_date,
        is_locked=True,
        locked_until=now - timedelta(days=2),
    )
    db_session.commit()
    with TaskJobLock(db_session, job_type=JobType.LOAD_TRANSFORM, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.LOAD_TRANSFORM
    assert job_lock.is_locked is False


def test_task_job_lock_when_job_lock_locked_until_is_in_the_past(
    caplog, db_session, enable_factory_create
):
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(
        job_type=JobType.SETUP_FOREIGN_TABLES,
        updated_at=old_date,
        is_locked=False,
        locked_until=now - timedelta(days=2),
    )
    db_session.commit()
    with TaskJobLock(db_session, job_type=JobType.SETUP_FOREIGN_TABLES, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.is_locked is False
    assert job_lock.job_type == JobType.SETUP_FOREIGN_TABLES


def test_task_job_lock_when_is_locked_is_true_and_locked_until_is_in_future_raises_exc(
    caplog, db_session, enable_factory_create
):
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(
        job_type=JobType.LOAD_OPPORTUNITY_DATA_OPENSEARCH,
        updated_at=old_date,
        is_locked=True,
        locked_until=now + timedelta(days=2),
    )
    db_session.commit()
    with pytest.raises(TaskJobLockIsLockedError):
        with TaskJobLock(
            db_session, job_type=JobType.LOAD_OPPORTUNITY_DATA_OPENSEARCH, lock_duration_minutes=60
        ):
            pass
    record = next(r for r in caplog.records if r.message == "Job is currently locked")
    assert record.success is False
    assert record.locking_job_lock_id == job_lock.job_lock_id
    assert record.error == "TaskJobLockIsLockedError"


def test_verify_job_lock_raises_when_locked_by_does_not_match(
    caplog, db_session, enable_factory_create
):
    caplog.set_level(logging.INFO)
    job_lock = JobLockFactory.create(
        job_type=JobType.SETUP_LOWER_ENV_AGENCIES, locked_by=uuid.uuid4()
    )
    db_session.commit()

    task_job_lock = TaskJobLock(db_session, job_type=JobType.CREATE_ANALYTICS_DB_CSVS)

    with pytest.raises(TaskJobLockInternalIDError):
        task_job_lock.verify_job_lock(job_lock)
    record = next(r for r in caplog.records if r.message == "Job lock ids do not match")
    assert record.success is False
    assert record.locked_by == job_lock.locked_by
    assert record.error == "TaskJobLockInternalIDError"


def test_job_lock_raises_when_lock_deleted_between_enter_and_exit(
    caplog, db_session, enable_factory_create
):
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    JobLockFactory.create(job_type=JobType.CREATE_APPLICATION_SUBMISSION, updated_at=old_date)

    context_manager = TaskJobLock(
        db_session, job_type=JobType.CREATE_APPLICATION_SUBMISSION, lock_duration_minutes=60
    )
    context_manager.__enter__()
    db_session.execute(
        delete(JobLock).where(JobLock.job_type == JobType.CREATE_APPLICATION_SUBMISSION)
    )
    db_session.commit()

    with pytest.raises(TaskJobLockError) as excinfo:
        context_manager.__exit__(None, "y", "z")

    assert isinstance(excinfo.value.__cause__, TaskJobLockNotFoundError)
    record = next(r for r in caplog.records if r.message == "Failed to free the job lock")
    assert record.success is False
    assert record.error == "TaskJobLockNotFoundError"
    assert record.lock_duration_seconds > 0
