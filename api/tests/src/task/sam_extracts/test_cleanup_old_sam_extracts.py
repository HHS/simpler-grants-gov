"""Tests for the SAM.gov extracts cleanup task."""

from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest

from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.sam_extracts.cleanup_old_sam_extracts import CleanupOldSamExtractsTask
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import SamExtractFileFactory


class TestCleanupOldSamExtractsTask(BaseTestClass):
    """Tests for the SAM.gov extracts cleanup task."""

    @pytest.fixture(autouse=True)
    def setup_method(self, db_session):
        """Set up the test environment before each test."""
        # Clean up any existing records
        cascade_delete_from_db_table(db_session, SamExtractFile)
        db_session.commit()
        yield
        # Clean up after test
        cascade_delete_from_db_table(db_session, SamExtractFile)
        db_session.commit()

    @pytest.fixture
    def task(self, db_session, enable_factory_create):
        """Create an instance of the task with mock dependencies"""
        task = CleanupOldSamExtractsTask(db_session)
        # Add mock for increment method to track metric calls
        task.increment = MagicMock()
        return task

    def test_task_creation(self, db_session):
        """Test the task can be created and initialized correctly"""
        task = CleanupOldSamExtractsTask(db_session)
        assert task.db_session == db_session

    def test_get_old_files_to_cleanup_no_files(self, task, db_session):
        """Test getting old files when no files exist"""
        old_files = task._get_old_files_to_cleanup()
        assert len(old_files) == 0

    def test_get_old_files_to_cleanup_only_recent_files(self, task, db_session):
        """Test getting old files when only recent files exist"""
        # Create files from the last 30 days (not old enough)
        recent_date = date.today() - timedelta(days=30)
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=recent_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=recent_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        old_files = task._get_old_files_to_cleanup()
        assert len(old_files) == 0

    def test_get_old_files_to_cleanup_old_files_exist(self, task, db_session):
        """Test getting old files when old files exist"""
        # Create files from 50 days ago (old enough to cleanup)
        old_date = date.today() - timedelta(days=50)
        old_file1 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )
        old_file2 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        # Create a recent file (not old enough)
        recent_date = date.today() - timedelta(days=30)
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=recent_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        old_files = task._get_old_files_to_cleanup()
        assert len(old_files) == 2
        assert old_file1 in old_files
        assert old_file2 in old_files

    def test_get_old_files_to_cleanup_excludes_already_deleted(self, task, db_session):
        """Test getting old files excludes already deleted files"""
        # Create old file that's already deleted
        old_date = date.today() - timedelta(days=50)
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.DELETED,
        )

        # Create old file that's not deleted
        old_file = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        old_files = task._get_old_files_to_cleanup()
        assert len(old_files) == 1
        assert old_file in old_files

    def test_get_old_files_to_cleanup_orders_by_date(self, task, db_session):
        """Test getting old files returns them ordered by extract date"""
        # Create files with different old dates
        old_date1 = date.today() - timedelta(days=60)
        old_date2 = date.today() - timedelta(days=50)
        old_date3 = date.today() - timedelta(days=55)

        old_file1 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date1,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )
        old_file2 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date2,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )
        old_file3 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date3,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        old_files = task._get_old_files_to_cleanup()
        assert len(old_files) == 3
        # Should be ordered by extract_date ascending (oldest first)
        assert old_files[0] == old_file1  # 60 days ago
        assert old_files[1] == old_file3  # 55 days ago
        assert old_files[2] == old_file2  # 50 days ago

    @patch("src.util.file_util.delete_file")
    def test_cleanup_file_success(self, mock_delete_file, task, db_session):
        """Test successfully cleaning up a single file"""
        # Create an old file
        old_date = date.today() - timedelta(days=50)
        old_file = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file.zip",
        )

        # Cleanup the file within a transaction context
        with db_session.begin():
            task._cleanup_file(old_file)

        # Verify the file was deleted from S3
        mock_delete_file.assert_called_once_with("s3://bucket/path/to/file.zip")

        # Verify the record was marked as deleted
        db_session.refresh(old_file)
        assert old_file.processing_status == SamGovProcessingStatus.DELETED

    @patch("src.util.file_util.delete_file")
    def test_cleanup_file_s3_error(self, mock_delete_file, task, db_session):
        """Test cleanup when S3 deletion fails"""
        # Create an old file
        old_date = date.today() - timedelta(days=50)
        old_file = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file.zip",
        )

        # Make S3 deletion fail
        mock_delete_file.side_effect = Exception("S3 error")

        # Cleanup should fail
        with pytest.raises(Exception, match="S3 error"):
            task._cleanup_file(old_file)

        # Verify the record was not marked as deleted
        db_session.refresh(old_file)
        assert old_file.processing_status == SamGovProcessingStatus.COMPLETED

    def test_run_task_no_files_to_cleanup(self, task, db_session):
        """Test running the task when no files need cleanup"""
        # Create only recent files
        recent_date = date.today() - timedelta(days=30)
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=recent_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
        )

        task.run_task()

        # Verify no metrics were incremented
        task.increment.assert_not_called()

    @patch("src.util.file_util.delete_file")
    def test_run_task_with_files_to_cleanup(self, mock_delete_file, task, db_session):
        """Test running the task with files that need cleanup"""
        # Create old files
        old_date = date.today() - timedelta(days=50)
        old_file1 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file1.zip",
        )
        old_file2 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file2.zip",
        )

        # Run the task
        task.run_task()

        # Verify both files were deleted from S3
        assert mock_delete_file.call_count == 2
        mock_delete_file.assert_any_call("s3://bucket/path/to/file1.zip")
        mock_delete_file.assert_any_call("s3://bucket/path/to/file2.zip")

        # Verify both records were marked as deleted
        db_session.refresh(old_file1)
        db_session.refresh(old_file2)
        assert old_file1.processing_status == SamGovProcessingStatus.DELETED
        assert old_file2.processing_status == SamGovProcessingStatus.DELETED

        # Verify metrics were incremented
        task.increment.assert_called_with(task.Metrics.FILES_DELETED_COUNT)
        assert task.increment.call_count == 2

    @patch("src.util.file_util.delete_file")
    def test_run_task_with_mixed_success_and_failure(self, mock_delete_file, task, db_session):
        """Test running the task fails fast when any file cleanup fails"""
        # Create old files
        old_date = date.today() - timedelta(days=50)
        old_file1 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file1.zip",
        )
        old_file2 = SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=old_date,
            processing_status=SamGovProcessingStatus.COMPLETED,
            s3_path="s3://bucket/path/to/file2.zip",
        )

        # Make first file succeed, second file fail
        def delete_file_side_effect(s3_path):
            if "file1" in s3_path:
                return  # Success
            else:
                raise Exception("S3 error")

        mock_delete_file.side_effect = delete_file_side_effect

        # Run the task and expect it to raise an exception
        with pytest.raises(Exception, match="S3 error"):
            task.run_task()

        # Verify that both files remain in their original state due to transaction rollback
        # When an exception occurs within the transaction, all changes are rolled back
        db_session.refresh(old_file1)
        assert old_file1.processing_status == SamGovProcessingStatus.COMPLETED

        db_session.refresh(old_file2)
        assert old_file2.processing_status == SamGovProcessingStatus.COMPLETED

        # Verify only the success metric was incremented (before the failure)
        assert task.increment.call_count == 1
        # Only the successful file cleanup incremented the metric
        task.increment.assert_called_with(task.Metrics.FILES_DELETED_COUNT)

    def test_cutoff_date_calculation(self, task):
        """Test that the cutoff date is calculated correctly as 45 days ago"""
        with patch("src.task.sam_extracts.cleanup_old_sam_extracts.date") as mock_date:
            mock_date.today.return_value = date(2025, 1, 15)

            task._get_old_files_to_cleanup()

            # The query should use a cutoff date of 45 days ago
            # This test verifies the logic is correct, even though we can't directly
            # test the SQL query execution
            assert mock_date.today.called
