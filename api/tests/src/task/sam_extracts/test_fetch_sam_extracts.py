from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from freezegun import freeze_time

from src.adapters.sam_gov.client import BaseSamGovClient, SamExtractInfo
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.sam_extracts.fetch_sam_extracts import SamExtractsTask
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table

# Sample dates for testing
CURRENT_DATE = datetime(2025, 4, 10, 12, 0, 0)
MONTHLY_EXTRACT_DATE = datetime(2025, 4, 1, 0, 0, 0)
DAILY_EXTRACT_DATE = datetime(2025, 4, 10, 0, 0, 0)
FIFTH_OF_MONTH_DATE = datetime(2025, 4, 5, 12, 0, 0)


class TestSamExtractsTask(BaseTestClass):
    """Tests for the SAM.gov extract fetching task"""

    @pytest.fixture(scope="class")
    def setup_data(self, db_session):
        """Clean up any existing data before the tests"""
        # Delete any existing SAM extract records to ensure clean state
        cascade_delete_from_db_table(db_session, SamExtractFile)
        yield
        # Clean up after tests
        cascade_delete_from_db_table(db_session, SamExtractFile)

    @pytest.fixture
    def mock_sam_gov_client(self):
        """Mock for SamGovClient"""
        # Create a mock client directly instead of patching
        mock_client = MagicMock(spec=BaseSamGovClient)

        # Mock the monthly extract
        monthly_info = SamExtractInfo(
            url="https://example.com/monthly",
            filename="SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            updated_at=MONTHLY_EXTRACT_DATE,
        )
        mock_client.get_monthly_extract_info.return_value = monthly_info

        # Mock the daily extracts
        daily_info_1 = SamExtractInfo(
            url="https://example.com/daily1",
            filename="SAM_FOUO_DAILY_V2_20250405.ZIP",
            updated_at=datetime(2025, 4, 5),
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
    def task(self, db_session, mock_s3_bucket, mock_sam_gov_client, setup_data):
        """Create an instance of the task with mock dependencies

        Note: This fixture is function-scoped to work with mock_s3_bucket,
        but still benefits from the class-scoped db_session and mock_sam_gov_client.
        """
        task = SamExtractsTask(db_session, mock_sam_gov_client)
        # Set up the task with necessary config for testing
        task.config.s3_bucket = mock_s3_bucket
        task.config.s3_prefix = "test-prefix/"
        # Add mock for increment method to track metric calls
        task.increment = MagicMock()
        return task

    @pytest.fixture
    def task_for_fifth(self, db_session, mock_s3_bucket, mock_sam_gov_client_for_fifth, setup_data):
        """Create a task instance specifically for the fifth of the month test"""
        task = SamExtractsTask(db_session, mock_sam_gov_client_for_fifth)
        # Set up the task with necessary config for testing
        task.config.s3_bucket = mock_s3_bucket
        task.config.s3_prefix = "test-prefix/"
        # Add mock for increment method to track metric calls
        task.increment = MagicMock()
        return task

    def test_task_creation(self, db_session, mock_sam_gov_client):
        """Test the task can be created and initialized correctly"""
        # Create and check the task directly
        task = SamExtractsTask(db_session, mock_sam_gov_client)

        # Verify the task has the expected attributes
        assert task.db_session == db_session
        assert task.sam_gov_client == mock_sam_gov_client

    @freeze_time(CURRENT_DATE)
    def test_fetch_monthly_extract_new(self, task, db_session, mock_sam_gov_client):
        """Test fetching a new monthly extract"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Mock the actual download function to avoid making network requests
        with patch.object(
            task,
            "_download_and_store_extract",
            return_value="test-prefix/monthly/2025-04-01/SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
        ):
            # Run the function
            result = task._fetch_monthly_extract()

            # Check the result - needs to compare datetimes, not date to datetime
            assert result == MONTHLY_EXTRACT_DATE

            # Verify the client was called
            mock_sam_gov_client.get_monthly_extract_info.assert_called_once()

            # Verify metrics were incremented
            task.increment.assert_called_once_with(task.Metrics.MONTHLY_EXTRACTS_FETCHED)

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
            filename="SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            s3_path="test-prefix/monthly/2025-04-01/SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
        )
        db_session.add(existing_extract)
        db_session.commit()

        # Run the function
        result = task._fetch_monthly_extract()

        # Check the result - needs to compare datetimes, not date to datetime
        assert result == MONTHLY_EXTRACT_DATE

        # Verify the client was called
        mock_sam_gov_client.get_monthly_extract_info.assert_called_once()

        # Verify metrics were not incremented
        task.increment.assert_not_called()

        # Clean up
        db_session.delete(existing_extract)
        db_session.commit()

    @freeze_time(CURRENT_DATE)
    def test_fetch_daily_extracts(self, task, db_session, mock_sam_gov_client):
        """Test fetching daily extracts"""
        # Reset the mocks before starting the test
        mock_sam_gov_client.reset_mock()
        task.increment.reset_mock()

        # Add a record for an existing monthly extract
        existing_monthly = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename="SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            s3_path="test-prefix/monthly/2025-04-01/SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
        )
        db_session.add(existing_monthly)
        db_session.commit()

        # Mock the actual download function
        with patch.object(
            task,
            "_download_and_store_extract",
            return_value="test-prefix/daily/2025-04-10/SAM_FOUO_DAILY_V2_20250410.ZIP",
        ):
            # Run the function
            task._fetch_daily_extracts(after_date=MONTHLY_EXTRACT_DATE)

            # Verify the client was called
            mock_sam_gov_client.get_daily_extract_info.assert_called_once()

            # Verify extract was processed and metrics were incremented
            assert task._download_and_store_extract.call_count == 2
            task.increment.assert_called_with(task.Metrics.DAILY_EXTRACTS_FETCHED)

        # Clean up
        db_session.delete(existing_monthly)
        db_session.commit()

    @freeze_time(CURRENT_DATE)
    def test_run_task_new_monthly(self, task):
        """Test the run_task method with a new monthly extract"""
        # Mock the fetch methods
        with patch.object(
            task, "_fetch_monthly_extract", return_value=MONTHLY_EXTRACT_DATE
        ) as mock_fetch_monthly:
            # Mock _get_latest_extract_date to return a date in the current month
            # This ensures the task knows it has already processed extracts this month
            with patch.object(
                task, "_get_latest_extract_date", return_value=CURRENT_DATE
            ) as mock_get_latest:
                with patch.object(task, "_fetch_daily_extracts") as mock_fetch_daily:
                    # Run the task
                    task.run_task()

                    # Verify methods were called correctly
                    mock_fetch_monthly.assert_called_once()
                    # Assert _get_latest_extract_date was called twice (once for monthly, once for daily)
                    assert mock_get_latest.call_count == 2
                    # Since monthly_fetched is not None, it should call with after_date=monthly_fetched
                    mock_fetch_daily.assert_called_once_with(after_date=MONTHLY_EXTRACT_DATE)

    @freeze_time(CURRENT_DATE)
    def test_run_task_no_new_monthly(self, task, db_session):
        """Test the run_task method with no new monthly extract"""
        # Add a record for an existing monthly extract
        existing_monthly = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=MONTHLY_EXTRACT_DATE,
            filename="SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            s3_path="test-prefix/monthly/2025-04-01/SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            status=SamGovProcessingStatus.COMPLETED,
        )
        db_session.add(existing_monthly)
        db_session.commit()

        # Mock the fetch methods
        with patch.object(task, "_fetch_monthly_extract", return_value=None) as mock_fetch_monthly:
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
        with patch.object(task, "_fetch_monthly_extract", return_value=None) as mock_fetch_monthly:
            with patch.object(task, "_get_latest_extract_date", return_value=None):
                with patch.object(task, "_fetch_daily_extracts") as mock_fetch_daily:
                    # Run the task
                    task.run_task()

                    # Verify methods were called correctly
                    mock_fetch_monthly.assert_called_once()
                    # This test is expecting fetch_daily_extracts to be called with no arguments
                    mock_fetch_daily.assert_called_once_with()

    @freeze_time(FIFTH_OF_MONTH_DATE)
    def test_run_task_on_fifth_of_month(
        self, task_for_fifth, db_session, mock_sam_gov_client_for_fifth
    ):
        """Test running the task on the 5th of the month with no previous runs this month"""
        # Reset the mocks
        mock_sam_gov_client_for_fifth.reset_mock()
        task_for_fifth.increment.reset_mock()

        # Create a mock for _download_and_store_extract to return appropriate paths
        download_return_values = [
            # Monthly return value
            "test-prefix/monthly/2025-04-01/SAM_PUBLIC_MONTHLY_V2_20250401.ZIP",
            # Daily return values (for days 1, 3, and 5)
            "test-prefix/daily/2025-04-01/SAM_FOUO_DAILY_V2_20250401.ZIP",
            "test-prefix/daily/2025-04-03/SAM_FOUO_DAILY_V2_20250403.ZIP",
            "test-prefix/daily/2025-04-05/SAM_FOUO_DAILY_V2_20250405.ZIP",
        ]

        download_mock = MagicMock(side_effect=download_return_values)

        # Run the task with our mocks
        with patch.object(task_for_fifth, "_download_and_store_extract", download_mock):
            # Run the task
            task_for_fifth.run_task()

            # Verify monthly extract was fetched
            mock_sam_gov_client_for_fifth.get_monthly_extract_info.assert_called_once()

            # Verify daily extracts were fetched
            mock_sam_gov_client_for_fifth.get_daily_extract_info.assert_called_once()

            # Verify the downloads happened 4 times (1 monthly + 3 daily for April)
            # March extract should NOT be downloaded because it's before the first of the month
            assert download_mock.call_count == 4

            # Verify metrics were incremented properly
            assert task_for_fifth.increment.call_count >= 4

            # Check that MONTHLY_EXTRACTS_FETCHED was incremented
            task_for_fifth.increment.assert_any_call(
                task_for_fifth.Metrics.MONTHLY_EXTRACTS_FETCHED
            )

            # Check that DAILY_EXTRACTS_FETCHED was incremented for each daily extract
            daily_increments = [
                call
                for call in task_for_fifth.increment.call_args_list
                if call.args[0] == task_for_fifth.Metrics.DAILY_EXTRACTS_FETCHED
            ]
            assert len(daily_increments) == 3, "Should have incremented daily metric 3 times"
