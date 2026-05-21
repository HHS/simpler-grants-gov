import logging
import uuid
from datetime import timedelta

import pytest

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


def test_task_job_lock__does_not_create_a_job_lock_if_enable_job_lock_is_false(
    monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "False")
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    db_session.flush()
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    job_lock = (
        db_session.query(JobLock).where(JobLock.job_type == JobType.SETUP_CERT_USER).one_or_none()
    )
    assert job_lock is None


def test_task_job_lock_does_not_modify_a_job_lock_if_enable_job_lock_is_false(
    monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "False")
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = JobLockFactory.create(job_type=JobType.SETUP_CERT_USER, updated_at=old_date)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at == old_date


def test_task_job_lock_creates_job_lock_if_one_does_not_exist(
    monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    job_lock = (
        db_session.query(JobLock).where(JobLock.job_type == JobType.SETUP_CERT_USER).one_or_none()
    )
    assert job_lock is not None
    assert job_lock.job_type == JobType.SETUP_CERT_USER


def test_task_job_lock_updates_a_job_lock_if_enable_job_lock_is_true(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    job_lock = JobLockFactory.create(job_type=JobType.SETUP_CERT_USER, updated_at=old_date)
    db_session.commit()
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.SETUP_CERT_USER
    record = next(r for r in caplog.records if r.message == "Job lock held duration")
    assert record.lock_duration_seconds > 0
    assert record.success is True


def test_task_job_lock_handles_when_locked_until_is_in_the_past(
    monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    job_lock = JobLockFactory.create(
        job_type=JobType.SETUP_CERT_USER,
        updated_at=old_date,
        is_locked=True,
        locked_until=now - timedelta(days=2),
    )
    db_session.commit()
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.SETUP_CERT_USER
    assert job_lock.is_locked is False


def test_task_job_lock_when_job_lock_locked_until_is_in_the_past(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    job_lock = JobLockFactory.create(
        job_type=JobType.SETUP_CERT_USER,
        updated_at=old_date,
        is_locked=False,
        locked_until=now - timedelta(days=2),
    )
    db_session.commit()
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        pass
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.is_locked is False
    assert job_lock.job_type == JobType.SETUP_CERT_USER


def test_task_job_lock_when_is_locked_is_true_and_locked_until_is_in_future_raises_exc(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    job_lock = JobLockFactory.create(
        job_type=JobType.SETUP_CERT_USER,
        updated_at=old_date,
        is_locked=True,
        locked_until=now + timedelta(days=2),
    )
    db_session.commit()
    with pytest.raises(TaskJobLockIsLockedError):
        with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
            pass
    record = next(r for r in caplog.records if r.message == "Job is currently locked")
    assert record.success is False
    assert record.locking_job_lock_id == job_lock.job_lock_id
    assert record.error == "TaskJobLockIsLockedError"


def test_verify_job_lock_raises_when_locked_by_does_not_match(
    caplog, db_session, enable_factory_create
):
    caplog.set_level(logging.INFO)
    job_lock = JobLockFactory.create(job_type=JobType.SETUP_CERT_USER, locked_by=uuid.uuid4())
    db_session.commit()

    task_job_lock = TaskJobLock(db_session, job_type=JobType.MIGRATE_UP)

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
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    JobLockFactory.create(job_type=JobType.SETUP_CERT_USER, updated_at=old_date)
    db_session.commit()
    with pytest.raises(TaskJobLockError) as excinfo:  # noqa
        with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
            db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
            db_session.flush()
            db_session.commit()

    assert isinstance(excinfo.value.__cause__, TaskJobLockNotFoundError)
    record = next(r for r in caplog.records if r.message == "Failed to free the job lock")
    assert record.success is False
    assert record.error == "TaskJobLockNotFoundError"
    assert record.lock_duration_seconds > 0
