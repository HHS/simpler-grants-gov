"""Tests for the SAM.gov extracts fetching task."""

import uuid
from datetime import date, datetime
from unittest.mock import MagicMock, call

import pytest
from freezegun import freeze_time

from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.models import SamExtractResponse
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.sam_extracts.fetch_sam_extracts import SamExtractsTask, get_first_sunday_of_month
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table

# Sample dates for testing
CURRENT_DATE = datetime(2025, 4, 10, 12, 0, 0)
MONTHLY_EXTRACT_DATE = date(2025, 4, 6)  # First Sunday of April 2025
DAILY_EXTRACT_DATE = datetime(2025, 4, 10, 0, 0, 0)
FIFTH_OF_MONTH_DATE = datetime(2025, 4, 5, 12, 0, 0)  # Before first Sunday


class TestSamExtractsTask(BaseTestClass):
    """Tests for the SAM.gov extracts fetching task."""

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
    def mock_sam_gov_client(self):
        """Mock for SamGovClient"""
        # Create a mock client directly instead of patching
        mock_client = MagicMock(spec=BaseSamGovClient)
        return mock_client

    @pytest.fixture
    def task(self, db_session, mock_s3_bucket, mock_sam_gov_client, setup_method, monkeypatch):
        """Create an instance of the task with mock dependencies

        Note: This fixture is function-scoped to work with mock_s3_bucket,
        but still benefits from the class-scoped db_session and mock_sam_gov_client.
        """
        monkeypatch.setenv("SAM_GOV_EXTRACTS_S3_BUCKET", mock_s3_bucket)
        monkeypatch.setenv("SAM_GOV_EXTRACTS_S3_PREFIX", "test-prefix/")
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://api.sam.gov")

        task = SamExtractsTask(db_session, mock_sam_gov_client)
        # Add mock for increment method to track metric calls
        task.increment = MagicMock()
        return task

    def test_task_creation(self, db_session, mock_sam_gov_client, mock_s3_bucket, monkeypatch):
        """Test the task can be created and initialized correctly"""
        # Create and check the task directly
        monkeypatch.setenv("SAM_GOV_EXTRACTS_S3_BUCKET", mock_s3_bucket)
        monkeypatch.setenv("SAM_GOV_EXTRACTS_S3_PREFIX", "test-prefix/")
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://api.sam.gov")

        task = SamExtractsTask(db_session, mock_sam_gov_client)

        # Verify the task has the expected attributes
        assert task.db_session == db_session
        assert task.sam_gov_client == mock_sam_gov_client
        assert task.config.s3_bucket == mock_s3_bucket
        assert task.config.s3_prefix == "test-prefix/"

    @freeze_time(CURRENT_DATE)
    def test_fetch_monthly_extract_new(self, task, db_session, mock_sam_gov_client):
        """Test fetching a new monthly extract on first Sunday"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Mock the download response
        filename = f"SAM_FOUO_MONTHLY_V2_{MONTHLY_EXTRACT_DATE.strftime('%Y%m%d')}.ZIP"
        download_response = SamExtractResponse(
            file_name=filename,
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client.download_extract.return_value = download_response

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result
        assert result is True

        # Verify DB record
        record = db_session.query(SamExtractFile).one()
        assert record.extract_type == SamGovExtractType.MONTHLY
        assert record.extract_date == MONTHLY_EXTRACT_DATE
        assert record.filename == filename
        assert record.processing_status == SamGovProcessingStatus.PENDING

        # Verify metric was incremented
        task.increment.assert_called_once_with(task.Metrics.MONTHLY_EXTRACTS_FETCHED)

    @freeze_time(CURRENT_DATE)
    def test_fetch_monthly_extract_already_exists(self, task, db_session, mock_sam_gov_client):
        """Test fetching a monthly extract that already exists"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Add a record for an existing monthly extract
        filename = f"SAM_FOUO_MONTHLY_V2_{MONTHLY_EXTRACT_DATE.strftime('%Y%m%d')}.ZIP"
        existing_extract = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename=filename,
            s3_path=f"test-prefix/monthly/{filename}",
            processing_status=SamGovProcessingStatus.COMPLETED,
            sam_extract_file_id=uuid.uuid4(),
        )
        db_session.add(existing_extract)
        db_session.commit()

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result
        assert result is False
        mock_sam_gov_client.download_extract.assert_not_called()
        task.increment.assert_not_called()

    @freeze_time(CURRENT_DATE)
    def test_fetch_daily_extracts(self, task, db_session, mock_sam_gov_client):
        """Test fetching daily extracts for a month."""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Mock download extract to just return a response
        mock_sam_gov_client.download_extract.return_value = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )

        # Run the daily fetch
        task._fetch_daily_extracts_for_month()

        # Check that we tried to download for each day up to the current date
        num_days = CURRENT_DATE.day

        assert mock_sam_gov_client.download_extract.call_count == num_days

        # Verify DB records
        records = db_session.query(SamExtractFile).all()
        assert len(records) == num_days
        assert all(r.extract_type == SamGovExtractType.DAILY for r in records)
        assert all(r.processing_status == SamGovProcessingStatus.PENDING for r in records)

        # Verify metrics
        assert task.increment.call_count == num_days
        task.increment.assert_has_calls([call(task.Metrics.DAILY_EXTRACTS_FETCHED)] * num_days)

    @freeze_time(CURRENT_DATE)
    def test_run_task_all_new(self, task, db_session, mock_sam_gov_client):
        """Test the main run task when all extracts are new"""
        mock_sam_gov_client.download_extract.return_value = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        task.run()

        # Check monthly
        monthly_filename = f"SAM_FOUO_MONTHLY_V2_{MONTHLY_EXTRACT_DATE.strftime('%Y%m%d')}.ZIP"
        monthly_record = (
            db_session.query(SamExtractFile).filter_by(extract_type=SamGovExtractType.MONTHLY).one()
        )
        assert monthly_record.filename == monthly_filename

        # Check daily
        num_days = CURRENT_DATE.day

        daily_records = (
            db_session.query(SamExtractFile).filter_by(extract_type=SamGovExtractType.DAILY).count()
        )
        assert daily_records == num_days

        # check downloads
        assert mock_sam_gov_client.download_extract.call_count == 1 + num_days

        # check metrics
        assert task.increment.call_count == 1 + num_days

    @freeze_time(CURRENT_DATE)
    def test_run_task_partial_existing(self, task, db_session, mock_sam_gov_client):
        """
        Test the main run task when some daily extracts for the month already exist.

        It should fetch the monthly extract and only the missing daily extracts.
        """
        # Add a couple of existing daily extracts
        for i in range(1, 3):  # April 1st and 2nd
            process_date = date(CURRENT_DATE.year, CURRENT_DATE.month, i)
            filename = f"SAM_FOUO_DAILY_V2_{process_date.strftime('%Y%m%d')}.ZIP"
            existing_extract = SamExtractFile(
                extract_type=SamGovExtractType.DAILY,
                extract_date=process_date,
                filename=filename,
                s3_path=f"test-prefix/daily/{filename}",
                processing_status=SamGovProcessingStatus.COMPLETED,
                sam_extract_file_id=uuid.uuid4(),
            )
            db_session.add(existing_extract)
        db_session.commit()

        mock_sam_gov_client.download_extract.return_value = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        task.run()

        # It should have downloaded 1 monthly + (10 - 2) daily files
        assert mock_sam_gov_client.download_extract.call_count == 1 + (CURRENT_DATE.day - 2)

        # Check total records in DB
        total_records = db_session.query(SamExtractFile).count()
        assert total_records == 1 + CURRENT_DATE.day  # 1 monthly, 10 total daily

        # Check metrics
        assert task.increment.call_count == 1 + (CURRENT_DATE.day - 2)
        task.increment.assert_any_call(task.Metrics.MONTHLY_EXTRACTS_FETCHED)

        daily_increment_calls = [
            c
            for c in task.increment.call_args_list
            if c.args[0] == task.Metrics.DAILY_EXTRACTS_FETCHED
        ]
        assert len(daily_increment_calls) == CURRENT_DATE.day - 2

    def test_get_first_sunday_of_month(self):
        """Test the helper function to get the first Sunday of a month."""
        assert get_first_sunday_of_month(2025, 4) == date(2025, 4, 6)
        assert get_first_sunday_of_month(2025, 5) == date(2025, 5, 4)
        assert get_first_sunday_of_month(2024, 2) == date(2024, 2, 4)
