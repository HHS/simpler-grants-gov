import logging
import uuid
from datetime import timedelta

import pytest

import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import JobType
from src.db.models.task_models import JobLock
from src.task.certificates.setup_cert_user_task import SetupCertUserTask
from src.task.task_job_lock import (
    TaskJobLock,
    TaskJobLockError,
    TaskJobLockInternalIDError,
    TaskJobLockIsLockedError,
    TaskJobLockNotFoundError,
    get_task_job_lock_config,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    JobLockFactory,
    RoleFactory,
    StagingTcertificatesFactory,
)


def get_or_create_job_lock(db_session, update_date=None, locked_until_date=None, is_locked=None):
    is_locked = is_locked or False
    if update_date:
        updated_at = update_date
    else:
        now = datetime_util.utcnow()
        updated_at = now - timedelta(days=366)
    job_lock = (
        db_session.query(JobLock).where(JobLock.job_type == JobType.SETUP_CERT_USER).one_or_none()
    )
    if not job_lock:
        job_lock = JobLockFactory.create(
            job_type=JobType.SETUP_CERT_USER, updated_at=updated_at, is_locked=is_locked
        )
    else:
        job_lock.is_locked = is_locked
        job_lock.updated_at = updated_at
    if locked_until_date:
        job_lock.locked_until = locked_until_date
    db_session.flush()
    return job_lock


def test_task_job_lock__does_not_create_a_job_lock_if_enable_job_lock_is_false(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "False")
    caplog.set_level(logging.INFO)
    db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
    db_session.flush()
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    job_lock = (
        db_session.query(JobLock).where(JobLock.job_type == JobType.SETUP_CERT_USER).one_or_none()
    )
    assert job_lock is None


def test_task_job_lock_does_not_modify_a_job_lock_if_enable_job_lock_is_false(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "False")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = get_or_create_job_lock(db_session, update_date=old_date)
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    db_session.refresh(job_lock)
    assert job_lock.updated_at == old_date


def test_task_job_lock_creates_job_lock_if_one_does_not_exist(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    job_lock = (
        db_session.query(JobLock).where(JobLock.job_type == JobType.SETUP_CERT_USER).one_or_none()
    )
    assert job_lock is not None
    assert job_lock.job_type == JobType.SETUP_CERT_USER


def test_task_job_lock_updates_a_job_lock_if_enable_job_lock_is_false(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = get_or_create_job_lock(db_session, update_date=old_date)
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.SETUP_CERT_USER


def test_task_job_lock_handles_when_locked_until_is_in_the_past(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = get_or_create_job_lock(
        db_session, update_date=old_date, is_locked=True, locked_until_date=now - timedelta(days=2)
    )
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.job_type == JobType.SETUP_CERT_USER
    assert job_lock.is_locked is False


def test_task_job_lock_when_job_lock_locked_until_is_in_the_past(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    job_lock = get_or_create_job_lock(
        db_session, update_date=old_date, is_locked=False, locked_until_date=now - timedelta(days=2)
    )
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
        SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    db_session.refresh(job_lock)
    assert job_lock.updated_at > old_date
    assert job_lock.is_locked is False
    assert job_lock.job_type == JobType.SETUP_CERT_USER


def test_task_job_lock_when_is_locked_is_true_and_locked_until_is_in_future_raises_exc(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    get_or_create_job_lock(
        db_session, update_date=old_date, is_locked=True, locked_until_date=now + timedelta(days=2)
    )
    role = RoleFactory.create(is_agency_role=True)
    agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
    tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
    tcert_id = str(tcertificate.tcertificates_id)
    with pytest.raises(TaskJobLockIsLockedError):
        with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
            SetupCertUserTask(db_session, tcert_id, [str(role.role_id)]).setup_cert()
    assert "Job is currently locked" in caplog.messages


def test_task_job_lock_will_raise_exc_if_logged_by_id_does_not_match_internal_id(
    caplog, monkeypatch_session, db_session, enable_factory_create
):
    get_task_job_lock_config.cache_clear()
    monkeypatch_session.setenv("ENABLE_JOB_LOCK", "True")
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    get_or_create_job_lock(db_session, update_date=old_date)
    db_session.commit()

    with pytest.raises(TaskJobLockError) as excinfo:  # noqa
        with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
            job_lock = get_or_create_job_lock(db_session, update_date=old_date)
            job_lock.locked_by = uuid.uuid4()
            db_session.flush()

    assert isinstance(excinfo.value.__cause__, TaskJobLockInternalIDError)
    assert "JobLock ids do not match" in caplog.messages
    assert "Failed to free the job lock" in caplog.messages


def test_job_lock_raises_when_lock_deleted_between_enter_and_exit(
    db_session, enable_factory_create, caplog
):
    caplog.set_level(logging.INFO)
    now = datetime_util.utcnow()
    old_date = now - timedelta(days=366)
    get_or_create_job_lock(db_session, update_date=old_date)

    with pytest.raises(TaskJobLockError) as excinfo:  # noqa
        with TaskJobLock(db_session, job_type=JobType.SETUP_CERT_USER, lock_duration_minutes=60):
            db_session.query(JobLock).filter_by(job_type=JobType.SETUP_CERT_USER).delete()
            db_session.flush()

    assert isinstance(excinfo.value.__cause__, TaskJobLockNotFoundError)
    assert "JobLock not found" in caplog.messages
