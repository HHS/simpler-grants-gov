import pytest
from sqlalchemy.exc import InvalidRequestError

from src.db.models.task_models import JobStatus
from src.task.task import Task


class SimpleTask(Task):
    """Test implementation of Task"""

    def run_task(self) -> None:
        pass


class FailingTask(Task):
    """Test implementation that fails during run_task"""

    def run_task(self) -> None:
        raise ValueError("Task failed")


class DBFailingTask(Task):
    """Test implementation that fails during DB operation"""

    def run_task(self) -> None:
        # Simulate DB operation failing
        raise InvalidRequestError("DB Error", None, None)


def test_task_handles_general_error(db_session):
    """Test that task properly handles non-DB errors and rolls back session"""
    task = FailingTask(db_session)

    with pytest.raises(ValueError):
        task.run()

    # Verify job was created and updated to failed status
    assert task.job is not None
    assert task.job.job_status == JobStatus.FAILED

    # Verify session is still usable
    db_session.begin()  # Start a new transaction
    assert db_session.is_active  # Session should be active with new transaction


def test_task_handles_db_error(db_session):
    """Test that task properly handles DB errors"""
    task = DBFailingTask(db_session)

    with pytest.raises(InvalidRequestError):
        task.run()

    # Verify session was rolled back and is usable
    db_session.begin()  # Start a new transaction
    assert db_session.is_active  # Session should be active with new transaction


def test_successful_task_completion(db_session):
    """Test that task completes successfully and updates job status"""
    task = SimpleTask(db_session)
    task.run()

    assert task.job is not None
    assert task.job.job_status == JobStatus.COMPLETED
    assert "task_duration_sec" in task.metrics

    # Verify session is still usable by starting a new transaction
    db_session.begin()  # Start a new transaction
    assert db_session.is_active  # Session should be active with new transaction
