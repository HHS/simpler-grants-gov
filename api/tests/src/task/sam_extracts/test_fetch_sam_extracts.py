"""Tests for the SAM.gov extracts fetching task."""

import uuid
from datetime import date, datetime
from unittest.mock import MagicMock, call, patch

import pytest
from freezegun import freeze_time

from src.adapters.sam_gov.client import BaseSamGovClient, SamExtractInfo
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

        # Mock the monthly extract for first Sunday
        monthly_info = SamExtractInfo(
            url="https://example.com/monthly",
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",  # Updated to first Sunday
            updated_at=MONTHLY_EXTRACT_DATE,
        )
        mock_client.get_monthly_extract_info.return_value = monthly_info

        # Mock the daily extracts (starting after first Sunday)
        daily_info_1 = SamExtractInfo(
            url="https://example.com/daily1",
            filename="SAM_FOUO_DAILY_V2_20250407.ZIP",  # Day after first Sunday
            updated_at=datetime(2025, 4, 7),
        )
        daily_info_2 = SamExtractInfo(
            url="https://example.com/daily2",
            filename="SAM_FOUO_DAILY_V2_20250410.ZIP",
            updated_at=datetime(2025, 4, 10),
        )
        mock_client.get_daily_extract_info.return_value = [daily_info_1, daily_info_2]

        return mock_client

    @pytest.fixture
    def mock_sam_gov_client_for_fifth(self):
        """Mock for SamGovClient with daily extracts up to the 5th"""
        mock_client = MagicMock(spec=BaseSamGovClient)

        # Mock the monthly extract for April
        monthly_info = SamExtractInfo(
            url="https://example.com/monthly/april",
            filename="SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            updated_at=datetime(2025, 4, 1, 0, 0, 0),
        )
        mock_client.get_monthly_extract_info.return_value = monthly_info

        # Mock daily extracts for days 1, 3, and 5 of April
        daily_info_1 = SamExtractInfo(
            url="https://example.com/daily/20250401",
            filename="SAM_FOUO_DAILY_V2_20250401.ZIP",
            updated_at=datetime(2025, 4, 1, 0, 0, 0),
        )
        daily_info_3 = SamExtractInfo(
            url="https://example.com/daily/20250403",
            filename="SAM_FOUO_DAILY_V2_20250403.ZIP",
            updated_at=datetime(2025, 4, 3, 0, 0, 0),
        )
        daily_info_5 = SamExtractInfo(
            url="https://example.com/daily/20250405",
            filename="SAM_FOUO_DAILY_V2_20250405.ZIP",
            updated_at=datetime(2025, 4, 5, 0, 0, 0),
        )

        # Include an extract from March which should be filtered out
        daily_info_old = SamExtractInfo(
            url="https://example.com/daily/20250331",
            filename="SAM_FOUO_DAILY_V2_20250331.ZIP",
            updated_at=datetime(2025, 3, 31, 0, 0, 0),
        )

        mock_client.get_daily_extract_info.return_value = [
            daily_info_old,
            daily_info_1,
            daily_info_3,
            daily_info_5,
        ]

        return mock_client

    @pytest.fixture
    def task(self, db_session, mock_s3_bucket, mock_sam_gov_client, setup_method):
        """Create an instance of the task with mock dependencies

        Note: This fixture is function-scoped to work with mock_s3_bucket,
        but still benefits from the class-scoped db_session and mock_sam_gov_client.
        """
        with patch.dict(
            "os.environ",
            {
                "SAM_GOV_EXTRACTS_S3_BUCKET": mock_s3_bucket,
                "SAM_GOV_EXTRACTS_S3_PREFIX": "test-prefix/",
                "SAM_GOV_BASE_URL": "https://api.sam.gov",
            },
        ):
            task = SamExtractsTask(db_session, mock_sam_gov_client)
            # Add mock for increment method to track metric calls
            task.increment = MagicMock()
            return task

    @pytest.fixture
    def task_for_fifth(
        self, db_session, mock_s3_bucket, mock_sam_gov_client_for_fifth, setup_method
    ):
        """Create a task instance specifically for the fifth of the month test"""
        with patch.dict(
            "os.environ",
            {
                "SAM_GOV_EXTRACTS_S3_BUCKET": mock_s3_bucket,
                "SAM_GOV_EXTRACTS_S3_PREFIX": "test-prefix/",
                "SAM_GOV_BASE_URL": "https://api.sam.gov",
            },
        ):
            task = SamExtractsTask(db_session, mock_sam_gov_client_for_fifth)
            # Add mock for increment method to track metric calls
            task.increment = MagicMock()
            return task

    def test_task_creation(self, db_session, mock_sam_gov_client, mock_s3_bucket):
        """Test the task can be created and initialized correctly"""
        # Create and check the task directly
        with patch.dict(
            "os.environ",
            {
                "SAM_GOV_EXTRACTS_S3_BUCKET": mock_s3_bucket,
                "SAM_GOV_EXTRACTS_S3_PREFIX": "test-prefix/",
                "SAM_GOV_BASE_URL": "https://api.sam.gov",
            },
        ):
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

        # Mock the monthly extract info
        monthly_info = SamExtractInfo(
            url="https://example.com/extract.zip",
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            updated_at=datetime.combine(MONTHLY_EXTRACT_DATE, datetime.min.time()),
        )
        mock_sam_gov_client.get_monthly_extract_info.return_value = monthly_info

        # Mock the download response
        download_response = SamExtractResponse(
            file_name=monthly_info.filename,
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.combine(MONTHLY_EXTRACT_DATE, datetime.min.time()),
        )
        mock_sam_gov_client.download_extract.return_value = download_response

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result
        assert result is True

    @freeze_time(CURRENT_DATE)
    def test_fetch_monthly_extract_already_exists(self, task, db_session, mock_sam_gov_client):
        """Test fetching a monthly extract that already exists"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Add a record for an existing monthly extract
        existing_extract = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            s3_path="test-prefix/monthly/2025-04-06/SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
            sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
        )
        db_session.add(existing_extract)
        db_session.commit()

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result
        assert result is False

    @freeze_time(CURRENT_DATE)
    def test_fetch_daily_extracts(self, task, db_session, mock_sam_gov_client):
        """Test fetching daily extracts after first Sunday monthly extract"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Add a record for an existing monthly extract from first Sunday
        existing_monthly = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            s3_path="test-prefix/monthly/2025-04-06/SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
            sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
        )
        db_session.add(existing_monthly)
        db_session.commit()

        # Mock daily extract info
        daily_extracts = [
            SamExtractInfo(
                url=f"https://example.com/daily_{i}.zip",
                filename=f"SAM_PUBLIC_DAILY_V2_2025040{i}.ZIP",
                updated_at=datetime(2025, 4, i),
            )
            for i in range(7, 11)  # April 7-10
        ]
        mock_sam_gov_client.get_daily_extract_info.return_value = daily_extracts

        # Mock the download response
        download_response = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client.download_extract.return_value = download_response

        # Run the function
        task._fetch_daily_extracts(after_date=MONTHLY_EXTRACT_DATE)

        # Verify that extracts were fetched
        assert mock_sam_gov_client.get_daily_extract_info.call_count == 1
        assert mock_sam_gov_client.download_extract.call_count == 4  # April 7-10

    @freeze_time(CURRENT_DATE)
    def test_run_task_new_monthly(self, task):
        """Test the run_task method with a new monthly extract"""
        # Mock the fetch methods
        with patch.object(task, "_fetch_monthly_extract", return_value=True) as mock_fetch_monthly:
            # Mock _get_latest_extract_date to return a date in the current month
            # This ensures the task knows it has already processed extracts this month
            with patch.object(
                task, "_get_latest_extract_date", return_value=MONTHLY_EXTRACT_DATE
            ) as mock_get_latest:
                with patch.object(task, "_fetch_daily_extracts") as mock_fetch_daily:
                    # Run the task
                    task.run_task()

                    # Verify methods were called correctly
                    mock_fetch_monthly.assert_called_once()
                    # Assert _get_latest_extract_date was called twice (once for monthly, once for daily)
                    assert mock_get_latest.call_count == 2
                    # Since monthly_fetched is True, it should call with after_date=monthly_fetched
                    mock_fetch_daily.assert_called_once_with(after_date=MONTHLY_EXTRACT_DATE)

    @freeze_time(CURRENT_DATE)
    def test_run_task_no_new_monthly(self, task, db_session):
        """Test the run_task method with no new monthly extract"""
        # Add a record for an existing monthly extract
        existing_monthly = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            s3_path="test-prefix/monthly/2025-04-06/SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
        )
        db_session.add(existing_monthly)
        db_session.commit()

        # Mock the fetch methods
        with patch.object(task, "_fetch_monthly_extract", return_value=False) as mock_fetch_monthly:
            with patch.object(task, "_get_latest_extract_date", return_value=MONTHLY_EXTRACT_DATE):
                with patch.object(task, "_fetch_daily_extracts") as mock_fetch_daily:
                    # Run the task
                    task.run_task()

                    # Verify methods were called correctly
                    mock_fetch_monthly.assert_called_once()
                    # Here we explicitly check that _fetch_daily_extracts is called with the date from _get_latest_extract_date
                    mock_fetch_daily.assert_called_once_with(after_date=MONTHLY_EXTRACT_DATE)

        # Clean up
        db_session.delete(existing_monthly)
        db_session.commit()

    @freeze_time(CURRENT_DATE)
    def test_run_task_no_extracts(self, task):
        """Test the run_task method with no existing extracts"""
        # Mock the fetch methods
        with patch.object(task, "_fetch_monthly_extract", return_value=False) as mock_fetch_monthly:
            with patch.object(task, "_get_latest_extract_date", return_value=None):
                with patch.object(task, "_fetch_daily_extracts") as mock_fetch_daily:
                    # Run the task
                    task.run_task()

                    # Verify methods were called correctly
                    mock_fetch_monthly.assert_called_once()
                    # This test is expecting fetch_daily_extracts to be called with no arguments
                    mock_fetch_daily.assert_called_once_with()

    @freeze_time(FIFTH_OF_MONTH_DATE)
    def test_run_task_on_fifth_of_month(self, task_for_fifth, mock_sam_gov_client_for_fifth):
        """Test running the task on the 5th of the month with no previous runs this month"""
        # Reset the mocks
        mock_sam_gov_client_for_fifth.reset_mock()
        task_for_fifth.increment.reset_mock()

        # Mock the monthly extract info
        monthly_info = SamExtractInfo(
            url="https://example.com/monthly",
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",  # First Sunday
            updated_at=datetime(2025, 4, 6),
        )
        mock_sam_gov_client_for_fifth.get_monthly_extract_info.return_value = monthly_info

        # Mock daily extract info
        daily_extracts = [
            SamExtractInfo(
                url=f"https://example.com/daily_{i}",
                filename=f"SAM_PUBLIC_DAILY_V2_202504{i:02d}.ZIP",
                updated_at=datetime(2025, 4, i),
            )
            for i in range(7, 10)  # Only after first Sunday
        ]
        mock_sam_gov_client_for_fifth.get_daily_extract_info.return_value = daily_extracts

        # Mock the download response
        download_response = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client_for_fifth.download_extract.return_value = download_response

        # Run the task
        task_for_fifth.run_task()

        # Verify monthly extract was fetched for first Sunday
        mock_sam_gov_client_for_fifth.get_monthly_extract_info.assert_called_once()

        # Verify daily extracts were fetched only after first Sunday
        mock_sam_gov_client_for_fifth.get_daily_extract_info.assert_called_once()

        # Verify metrics were incremented properly
        assert task_for_fifth.increment.call_count >= 4
        task_for_fifth.increment.assert_any_call(task_for_fifth.Metrics.MONTHLY_EXTRACTS_FETCHED)
        daily_increments = [
            call
            for call in task_for_fifth.increment.call_args_list
            if call.args[0] == task_for_fifth.Metrics.DAILY_EXTRACTS_FETCHED
        ]
        assert len(daily_increments) == 3, "Should have incremented daily metric 3 times"

    @freeze_time(FIFTH_OF_MONTH_DATE)
    def test_run_task_before_first_sunday(self, task_for_fifth, mock_sam_gov_client_for_fifth):
        """Test running the task before first Sunday of the month"""
        # Reset the mocks
        mock_sam_gov_client_for_fifth.reset_mock()
        task_for_fifth.increment.reset_mock()

        # Mock the monthly extract info
        monthly_info = SamExtractInfo(
            url="https://example.com/monthly",
            filename="SAM_PUBLIC_MONTHLY_V2_20250406.ZIP",  # First Sunday
            updated_at=datetime(2025, 4, 6),
        )
        mock_sam_gov_client_for_fifth.get_monthly_extract_info.return_value = monthly_info

        # Mock daily extract info
        daily_extracts = [
            SamExtractInfo(
                url=f"https://example.com/daily_{i}",
                filename=f"SAM_PUBLIC_DAILY_V2_202504{i:02d}.ZIP",
                updated_at=datetime(2025, 4, i),
            )
            for i in range(7, 10)  # Only after first Sunday
        ]
        mock_sam_gov_client_for_fifth.get_daily_extract_info.return_value = daily_extracts

        # Mock the download response
        download_response = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client_for_fifth.download_extract.return_value = download_response

        # Run the task
        task_for_fifth.run_task()

        # Verify monthly extract was fetched for first Sunday
        mock_sam_gov_client_for_fifth.get_monthly_extract_info.assert_called_once()

        # Verify daily extracts were fetched
        mock_sam_gov_client_for_fifth.get_daily_extract_info.assert_called_once()

        # Verify metrics were incremented properly
        assert task_for_fifth.increment.call_count >= 4
        task_for_fifth.increment.assert_any_call(task_for_fifth.Metrics.MONTHLY_EXTRACTS_FETCHED)
        daily_increments = [
            call
            for call in task_for_fifth.increment.call_args_list
            if call.args[0] == task_for_fifth.Metrics.DAILY_EXTRACTS_FETCHED
        ]
        assert len(daily_increments) == 3, "Should have incremented daily metric 3 times"

    def test_get_first_sunday_of_month(self):
        """Test getting the first Sunday of a month."""
        # Test for January 2024 (first Sunday is Jan 7)
        assert get_first_sunday_of_month(2024, 1) == date(2024, 1, 7)

        # Test for February 2024 (first Sunday is Feb 4)
        assert get_first_sunday_of_month(2024, 2) == date(2024, 2, 4)

        # Test for March 2024 (first Sunday is Mar 3)
        assert get_first_sunday_of_month(2024, 3) == date(2024, 3, 3)

    def test_fetch_monthly_extract_first_sunday(self, task, mock_sam_gov_client):
        """Test that monthly extracts are fetched for the first Sunday of the month."""
        # Mock the current date to be in the middle of the month
        current_date = date(2024, 3, 15)
        with patch("src.task.sam_extracts.fetch_sam_extracts.datetime_util.utcnow") as mock_now:
            mock_now.return_value = datetime.combine(current_date, datetime.min.time())

            # Mock the monthly extract info
            monthly_info = SamExtractInfo(
                url="https://example.com/extract.zip",
                filename="SAM_PUBLIC_MONTHLY_V2_20240303.ZIP",
                updated_at=datetime(2024, 3, 3),
            )
            mock_sam_gov_client.get_monthly_extract_info.return_value = monthly_info

            # Mock the download response
            download_response = SamExtractResponse(
                file_name=monthly_info.filename,
                file_size=1024,
                content_type="application/zip",
                download_date=datetime.now(),
            )
            mock_sam_gov_client.download_extract.return_value = download_response

            # Execute the task
            task._fetch_monthly_extract()

            # Verify that the extract was recorded with the first Sunday's date
            # First Sunday of March 2024 is March 3
            mock_sam_gov_client.get_monthly_extract_info.assert_called_once()
            mock_sam_gov_client.download_extract.assert_called_once()

    def test_fetch_daily_extracts_after_monthly(self, task, mock_sam_gov_client):
        """Test that daily extracts are fetched after the last monthly extract."""
        # Mock the latest monthly extract date
        latest_monthly = date(2024, 3, 3)  # First Sunday of March
        task._get_latest_extract_date = MagicMock(return_value=latest_monthly)

        # Mock daily extract info for March 4-6
        daily_extracts = [
            SamExtractInfo(
                url=f"https://example.com/daily_{i}.zip",
                filename=f"SAM_PUBLIC_DAILY_V2_2024030{i}.ZIP",
                updated_at=datetime(2024, 3, i),
            )
            for i in range(4, 7)
        ]
        mock_sam_gov_client.get_daily_extract_info.return_value = daily_extracts

        # Mock the download response
        download_response = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client.download_extract.return_value = download_response

        # Execute the task
        task._fetch_daily_extracts(after_date=latest_monthly)

        # Verify that extracts were recorded for March 4-6
        assert mock_sam_gov_client.get_daily_extract_info.call_count == 1
        assert mock_sam_gov_client.download_extract.call_count == 3

    def test_fetch_daily_extracts_no_monthly(self, task, mock_sam_gov_client):
        """Test that daily extracts are fetched even if no monthly extract exists."""
        # Mock no monthly extract
        task._get_latest_extract_date = MagicMock(return_value=None)

        # Mock daily extract info
        daily_extracts = [
            SamExtractInfo(
                url=f"https://example.com/daily_{i}",
                filename=f"SAM_PUBLIC_DAILY_V2_202504{i:02d}.ZIP",
                updated_at=datetime(2025, 4, i),
            )
            for i in range(7, 10)  # Only after first Sunday
        ]
        mock_sam_gov_client.get_daily_extract_info.return_value = daily_extracts

        # Mock the download response
        download_response = SamExtractResponse(
            file_name="test.zip",
            file_size=1024,
            content_type="application/zip",
            download_date=datetime.now(),
        )
        mock_sam_gov_client.download_extract.return_value = download_response

        # Execute the task
        task._fetch_daily_extracts()

        # Verify that daily extracts were fetched
        mock_sam_gov_client.get_daily_extract_info.assert_called_once()
        assert mock_sam_gov_client.download_extract.call_count == 3
        assert task.increment.call_count == 3
        task.increment.assert_has_calls(
            [
                call(task.Metrics.DAILY_EXTRACTS_FETCHED),
                call(task.Metrics.DAILY_EXTRACTS_FETCHED),
                call(task.Metrics.DAILY_EXTRACTS_FETCHED),
            ]
        )
