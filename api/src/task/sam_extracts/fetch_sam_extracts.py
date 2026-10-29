"""Task to fetch SAM.gov extracts."""

import logging
import uuid
from datetime import date, timedelta
from enum import StrEnum

from botocore.client import BaseClient
from sqlalchemy import select

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.adapters.aws.s3_adapter import get_s3_client
from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.models import SamExtractRequest
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.task import Task
from src.util import datetime_util

logger = logging.getLogger(__name__)


class FetchSamExtractsTask(Task):
    """Task that runs daily to fetch SAM.gov extract files"""

    class Metrics(StrEnum):
        MONTHLY_EXTRACTS_FETCHED = "monthly_extracts_fetched"
        DAILY_EXTRACTS_FETCHED = "daily_extracts_fetched"
        ERRORS_ENCOUNTERED = "errors_encountered"

    def __init__(
        self,
        db_session: db.Session,
        sam_gov_client: BaseSamGovClient,
        s3_client: BaseClient | None = None,
    ) -> None:
        super().__init__(db_session)
        self.s3_config = S3Config()
        self.sam_gov_client = sam_gov_client
        self.s3_client = s3_client or get_s3_client()

    def run_task(self) -> None:
        """Main task logic to fetch SAM.gov extracts"""
        with self.db_session.begin():
            logger.info("Attempting to fetch monthly extract.")
            monthly_extract_date = self._fetch_monthly_extract()

            logger.info("Attempting to fetch daily extracts.")
            self._fetch_daily_extracts(monthly_extract_date)

    def _fetch_monthly_extract(self) -> date:
        """Fetch the latest monthly extract if needed.

        Returns:
            The date of the monthly extract that should be used as the base for daily extracts
        """
        # Get the appropriate monthly extract date for the current time
        current_date = datetime_util.utcnow().date()
        target_date = get_monthly_extract_date(current_date)

        # Check if we already have this extract
        stmt = select(SamExtractFile).where(
            SamExtractFile.extract_type == SamGovExtractType.MONTHLY,
            SamExtractFile.extract_date == target_date,
            SamExtractFile.processing_status != SamGovProcessingStatus.FAILED,
        )
        existing = self.db_session.execute(stmt).scalar_one_or_none()

        if existing:
            logger.info(f"Monthly extract for {target_date} already exists")
            return target_date

        # Construct the filename based on the target date
        filename = f"SAM_FOUO_MONTHLY_V2_{target_date.strftime('%Y%m%d')}.ZIP"

        # Build the s3 path using the draft bucket
        s3_path = f"{self.s3_config.draft_files_bucket_path}/sam-extracts/monthly/{filename}"

        request = SamExtractRequest(file_name=filename)
        self.sam_gov_client.download_extract(request, s3_path)

        # Record the extract in the database
        extract = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=target_date,
            filename=filename,
            s3_path=s3_path,
            processing_status=SamGovProcessingStatus.PENDING,
            sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
        )
        self.db_session.add(extract)

        # Increment the metric
        self.increment(self.Metrics.MONTHLY_EXTRACTS_FETCHED)

        logger.info(f"Successfully downloaded monthly extract for {target_date}")
        return target_date

    def _fetch_daily_extracts(self, monthly_extract_date: date) -> None:
        """Fetch all daily extracts since the monthly extract date that we don't already have.

        Daily extracts are produced Tuesday-Saturday, so we skip Sundays and Mondays.
        """
        current_date = datetime_util.utcnow().date()

        # Start from the day after the monthly extract
        date_to_process = monthly_extract_date

        while date_to_process <= current_date:
            date_to_process = date_to_process + timedelta(days=1)

            # Skip if we've gone past the current date
            if date_to_process > current_date:
                break

            # Skip Sundays (6) and Mondays (0) as daily extracts are only produced Tuesday-Saturday
            if date_to_process.weekday() in (0, 6):
                continue

            # Construct the filename for the daily extract
            filename = f"SAM_FOUO_DAILY_V2_{date_to_process.strftime('%Y%m%d')}.ZIP"

            # Check if we already have this extract by date and type for safety
            stmt = select(SamExtractFile).where(
                SamExtractFile.extract_type == SamGovExtractType.DAILY,
                SamExtractFile.extract_date == date_to_process,
                SamExtractFile.processing_status != SamGovProcessingStatus.FAILED,
            )
            existing = self.db_session.execute(stmt).scalar_one_or_none()

            if existing:
                logger.info(
                    f"Daily extract for {date_to_process} (file: {filename}) already has been processed."
                )
                continue

            # Download the extract
            logger.info(
                f"New daily extract found for {date_to_process} (file: {filename}). Downloading."
            )
            s3_path = f"{self.s3_config.draft_files_bucket_path}/sam-extracts/daily/{filename}"

            request = SamExtractRequest(file_name=filename)
            self.sam_gov_client.download_extract(request, s3_path)

            # Record the extract in the database
            extract = SamExtractFile(
                extract_type=SamGovExtractType.DAILY,
                extract_date=date_to_process,
                filename=filename,
                s3_path=s3_path,
                processing_status=SamGovProcessingStatus.PENDING,
                sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
            )
            self.db_session.add(extract)

            # Increment the metric
            self.increment(self.Metrics.DAILY_EXTRACTS_FETCHED)

            logger.info(f"Successfully downloaded daily extract for {date_to_process}")


def get_monthly_extract_date(current_date: date) -> date:
    """Get the appropriate monthly extract date for the given current date.

    If the current date is before the first Sunday of the current month,
    return the first Sunday of the previous month. Otherwise, return the
    first Sunday of the current month.

    Args:
        current_date: The current date

    Returns:
        The date of the monthly extract that should be used
    """
    # Get the first Sunday of the current month
    first_sunday_current = get_first_sunday_of_month(current_date.year, current_date.month)

    # If the current date is on or after the first Sunday, use it
    if current_date >= first_sunday_current:
        return first_sunday_current

    # Otherwise, go to the previous month
    if current_date.month == 1:
        # January -> December of previous year
        return get_first_sunday_of_month(current_date.year - 1, 12)
    else:
        # Any other month -> previous month of same year
        return get_first_sunday_of_month(current_date.year, current_date.month - 1)


def get_first_sunday_of_month(year: int, month: int) -> date:
    """Get the first Sunday of the given month.

    Args:
        year: The year
        month: The month (1-12)

    Returns:
        The date of the first Sunday
    """
    # Start with the first of the month
    d = date(year, month, 1)

    # Add days until we hit a Sunday (where weekday() == 6)
    while d.weekday() != 6:
        d += timedelta(days=1)

    return d
