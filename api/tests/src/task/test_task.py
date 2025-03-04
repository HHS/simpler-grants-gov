import pytest
from sqlalchemy.exc import IntegrityError, InvalidRequestError

from src.db.models.extract_models import ExtractMetadata
from src.db.models.task_models import JobLog, JobStatus
from src.task.task import Task
from tests.src.db.models.factories import ExtractMetadataFactory, ExtractType


class DuplicateKeyTask(Task):
    """Test implementation that triggers a duplicate key error"""

    def run_task(self) -> None:
        # Create first record
        extract1 = ExtractMetadataFactory.create(
            file_path="s3://test-bucket/file1.csv", extract_type=ExtractType.OPPORTUNITIES_CSV
        )

        # Attempt to create second record with same primary key
        extract2 = ExtractMetadataFactory.build(
            file_path="s3://test-bucket/file2.csv", extract_type=ExtractType.OPPORTUNITIES_CSV
        )
        extract2.extract_metadata_id = extract1.extract_metadata_id  # Force duplicate PK
        self.db_session.add(extract2)
        self.db_session.flush()  # This will trigger the duplicate key error


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


# Ignore the SAWarning that Pytest will complain about as we're intentionally causing it for the test scenario
@pytest.mark.filterwarnings("ignore::sqlalchemy.exc.SAWarning")
def test_task_handles_duplicate_key_error(db_session, enable_factory_create):
    """Test that task properly handles SQLAlchemy errors e.g. integrity errors"""
    # Clear any existing ExtractMetadata records
    db_session.query(ExtractMetadata).delete()
    db_session.commit()

    task = DuplicateKeyTask(db_session)

    with pytest.raises(IntegrityError):
        task.run()

    # Verify job was created and updated to failed status
    assert task.job is not None
    assert task.job.job_status == JobStatus.FAILED

    # Verify session was rolled back and is usable
    db_session.begin()  # Start a new transaction
    assert db_session.is_active  # Session should be active with new transaction

    # Verify only one record exists
    count = db_session.query(ExtractMetadata).count()
    assert count == 1

    # Verify the job status is persisted in the database
    db_job = db_session.query(JobLog).filter_by(job_id=task.job.job_id).first()
    assert db_job is not None
    assert db_job.job_status == JobStatus.FAILED
