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
from src.task.sam_extracts.fetch_sam_extracts import (
    FetchSamExtractsTask,
    get_first_sunday_of_month,
    get_monthly_extract_date,
)
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import SamExtractFileFactory

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
    def task(
        self,
        db_session,
        mock_s3_bucket,
        mock_sam_gov_client,
        setup_method,
        monkeypatch,
        enable_factory_create,
    ):
        """Create an instance of the task with mock dependencies

        Note: This fixture is function-scoped to work with mock_s3_bucket,
        but still benefits from the class-scoped db_session and mock_sam_gov_client.
        """
        monkeypatch.setenv("DRAFT_FILES_BUCKET", mock_s3_bucket)
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://api.sam.gov")

        task = FetchSamExtractsTask(db_session, mock_sam_gov_client)
        # Add mock for increment method to track metric calls
        task.increment = MagicMock()
        return task

    def test_task_creation(self, db_session, mock_sam_gov_client, mock_s3_bucket, monkeypatch):
        """Test the task can be created and initialized correctly"""
        # Create and check the task directly
        monkeypatch.setenv("DRAFT_FILES_BUCKET", mock_s3_bucket)
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://api.sam.gov")

        task = FetchSamExtractsTask(db_session, mock_sam_gov_client)

        # Verify the task has the expected attributes
        assert task.db_session == db_session
        assert task.sam_gov_client == mock_sam_gov_client
        assert task.s3_config.draft_files_bucket_path == mock_s3_bucket

    @freeze_time(CURRENT_DATE)
    def test_fetch_monthly_extract_new(self, task, db_session, mock_sam_gov_client):
        """Test fetching a new monthly extract on first Sunday"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        filename = f"SAM_FOUO_MONTHLY_V2_{MONTHLY_EXTRACT_DATE.strftime('%Y%m%d')}.ZIP"

        # A prior failed file exists but won't be seen by the fetch
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename=filename,
            s3_path=f"s3://test-bucket/sam-extracts/monthly/{filename}",
            processing_status=SamGovProcessingStatus.FAILED,
        )

        # Mock the download response
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
        assert result == MONTHLY_EXTRACT_DATE

        # Verify DB record
        record = (
            db_session.query(SamExtractFile)
            .where(
                SamExtractFile.extract_date == MONTHLY_EXTRACT_DATE,
                SamExtractFile.processing_status == SamGovProcessingStatus.PENDING,
            )
            .one_or_none()
        )
        assert record.extract_type == SamGovExtractType.MONTHLY
        assert record.extract_date == MONTHLY_EXTRACT_DATE
        assert record.filename == filename
        assert record.processing_status == SamGovProcessingStatus.PENDING

        # Verify metric was incremented
        task.increment.assert_called_once_with(task.Metrics.MONTHLY_EXTRACTS_FETCHED)

    @freeze_time(CURRENT_DATE)
    @pytest.mark.parametrize(
        "current_status", [SamGovProcessingStatus.COMPLETED, SamGovProcessingStatus.PENDING]
    )
    def test_fetch_monthly_extract_already_exists(
        self, task, db_session, mock_sam_gov_client, current_status
    ):
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
            s3_path=f"s3://test-bucket/sam-extracts/monthly/{filename}",
            processing_status=current_status,
            sam_extract_file_id=uuid.uuid4(),
        )
        db_session.add(existing_extract)
        db_session.commit()

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result
        assert result == MONTHLY_EXTRACT_DATE
        mock_sam_gov_client.download_extract.assert_not_called()
        task.increment.assert_not_called()

    @freeze_time(CURRENT_DATE)
    def test_fetch_daily_extracts(self, task, db_session, mock_sam_gov_client):
        """Test fetching daily extracts from a given monthly extract date."""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # An existing failed extract from the 9th won't be seen
        SamExtractFileFactory.create(
            extract_type=SamGovExtractType.DAILY,
            extract_date=date(2025, 4, 9),
            processing_status=SamGovProcessingStatus.FAILED,
        )

        # Mock download extract to just return a response
        mock_sam_gov_client.download_extract.return_value = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )

        # Run the daily fetch starting from monthly extract date
        task._fetch_daily_extracts(MONTHLY_EXTRACT_DATE)

        # Calculate expected number of calls - only weekdays (Tue-Sat) from April 7 to April 10
        # April 6 (Sunday) is the monthly extract date
        # April 7 (Monday) - skipped
        # April 8 (Tuesday) - included
        # April 9 (Wednesday) - included
        # April 10 (Thursday) - included
        expected_calls = 3

        assert mock_sam_gov_client.download_extract.call_count == expected_calls

        # Verify DB records
        records = (
            db_session.query(SamExtractFile)
            .where(SamExtractFile.processing_status == SamGovProcessingStatus.PENDING)
            .all()
        )
        assert len(records) == expected_calls
        assert all(r.extract_type == SamGovExtractType.DAILY for r in records)
        assert all(r.processing_status == SamGovProcessingStatus.PENDING for r in records)

        # Verify the dates are correct (excluding Sunday and Monday)
        record_dates = {r.extract_date for r in records}
        expected_dates = {date(2025, 4, 8), date(2025, 4, 9), date(2025, 4, 10)}
        assert record_dates == expected_dates

        # Verify metrics
        assert task.increment.call_count == expected_calls
        task.increment.assert_has_calls(
            [call(task.Metrics.DAILY_EXTRACTS_FETCHED)] * expected_calls
        )

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

        # Check daily - should be 3 weekdays from April 7-10 (excluding Sunday 6th and Monday 7th)
        expected_daily_count = 3

        daily_records = (
            db_session.query(SamExtractFile).filter_by(extract_type=SamGovExtractType.DAILY).count()
        )
        assert daily_records == expected_daily_count

        # check downloads
        assert mock_sam_gov_client.download_extract.call_count == 1 + expected_daily_count

        # check metrics
        assert task.increment.call_count == 1 + expected_daily_count

    @freeze_time(CURRENT_DATE)
    def test_run_task_partial_existing(self, task, db_session, mock_sam_gov_client):
        """
        Test the main run task when some daily extracts already exist.

        It should fetch the monthly extract and only the missing daily extracts.
        """
        # Add an existing daily extract for April 8th (Tuesday)
        process_date = date(2025, 4, 8)
        filename = f"SAM_FOUO_DAILY_V2_{process_date.strftime('%Y%m%d')}.ZIP"
        existing_extract = SamExtractFile(
            extract_type=SamGovExtractType.DAILY,
            extract_date=process_date,
            filename=filename,
            s3_path=f"s3://test-bucket/sam-extracts/daily/{filename}",
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

        # It should have downloaded 1 monthly + 2 remaining daily files (April 9, 10)
        expected_new_daily = 2
        assert mock_sam_gov_client.download_extract.call_count == 1 + expected_new_daily

        # Check total records in DB (1 existing daily + 1 new monthly + 2 new daily)
        total_records = db_session.query(SamExtractFile).count()
        assert total_records == 4

        # Check metrics
        assert task.increment.call_count == 1 + expected_new_daily
        task.increment.assert_any_call(task.Metrics.MONTHLY_EXTRACTS_FETCHED)

        daily_increment_calls = [
            c
            for c in task.increment.call_args_list
            if c.args[0] == task.Metrics.DAILY_EXTRACTS_FETCHED
        ]
        assert len(daily_increment_calls) == expected_new_daily

    def test_get_first_sunday_of_month(self):
        """Test the helper function to get the first Sunday of a month."""
        assert get_first_sunday_of_month(2025, 4) == date(2025, 4, 6)
        assert get_first_sunday_of_month(2025, 5) == date(2025, 5, 4)
        assert get_first_sunday_of_month(2024, 2) == date(2024, 2, 4)

    def test_get_monthly_extract_date_current_month(self):
        """Test getting monthly extract date when current date is after first Sunday"""
        # April 10th is after April 6th (first Sunday), so should return April 6th
        current_date = date(2025, 4, 10)
        result = get_monthly_extract_date(current_date)
        assert result == date(2025, 4, 6)

    def test_get_monthly_extract_date_previous_month(self):
        """Test getting monthly extract date when current date is before first Sunday"""
        # April 5th is before April 6th (first Sunday), so should return March 2nd (first Sunday of March)
        current_date = date(2025, 4, 5)
        result = get_monthly_extract_date(current_date)
        assert result == date(2025, 3, 2)

    def test_get_monthly_extract_date_january_edge_case(self):
        """Test getting monthly extract date when in January before first Sunday"""
        # January 4th 2025 is before January 5th (first Sunday), so should return December 1st 2024
        current_date = date(2025, 1, 4)
        result = get_monthly_extract_date(current_date)
        assert result == date(2024, 12, 1)

    @freeze_time(FIFTH_OF_MONTH_DATE)
    def test_fetch_monthly_extract_previous_month(self, task, db_session, mock_sam_gov_client):
        """Test fetching monthly extract when current date is before first Sunday of month"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Expected date should be March 2nd (first Sunday of March)
        expected_date = date(2025, 3, 2)

        # Mock the download response
        filename = f"SAM_FOUO_MONTHLY_V2_{expected_date.strftime('%Y%m%d')}.ZIP"
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
        assert result == expected_date

        # Verify DB record
        record = db_session.query(SamExtractFile).one()
        assert record.extract_type == SamGovExtractType.MONTHLY
        assert record.extract_date == expected_date
        assert record.filename == filename
        assert record.processing_status == SamGovProcessingStatus.PENDING
