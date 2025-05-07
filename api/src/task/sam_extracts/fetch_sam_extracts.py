"""Task to fetch SAM.gov extracts."""

import logging
import uuid
from datetime import date, timedelta
from enum import StrEnum
from typing import Optional

import boto3
from botocore.client import BaseClient
from pydantic import Field
from sqlalchemy import select

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.factory import create_sam_gov_client
from src.adapters.sam_gov.models import SamExtractRequest
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SamExtractsConfig(PydanticBaseEnvConfig):
    """Configuration for SAM extracts fetching task"""

    sam_gov_api_url: str = Field(alias="SAM_GOV_BASE_URL", default="https://api.sam.gov")
    s3_bucket: str = Field(alias="SAM_GOV_EXTRACTS_S3_BUCKET")
    s3_prefix: str = Field(alias="SAM_GOV_EXTRACTS_S3_PREFIX", default="sam-extracts/")


@task_blueprint.cli.command("fetch-sam-extracts", help="Fetch SAM.gov daily and monthly extracts")
@ecs_background_task("fetch-sam-extracts")
@flask_db.with_db_session()
def run_fetch_sam_extracts_task(db_session: db.Session) -> None:
    """Run the SAM.gov extracts fetching task"""
    # Create the SAM.gov client using the factory
    sam_gov_client = create_sam_gov_client()

    # Initialize and run the task
    task = SamExtractsTask(db_session, sam_gov_client)
    task.run()


class SamExtractsTask(Task):
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
        self.config = SamExtractsConfig()
        self.sam_gov_client = sam_gov_client
        self.s3_client = s3_client or boto3.client("s3")

    def run_task(self) -> None:
        """Main task logic to fetch SAM.gov extracts"""
        # First check if there's a new monthly extract
        monthly_fetched = self._fetch_monthly_extract()

        # Get the most recent monthly extract date we have
        latest_monthly = self._get_latest_extract_date(SamGovExtractType.MONTHLY)

        # Get the most recent daily extract date we have
        latest_daily = self._get_latest_extract_date(SamGovExtractType.DAILY)

        # Get current date to check if we've run this month
        current_date = datetime_util.utcnow().date()

        # Check if we've processed any extracts this month
        processed_this_month = False
        for extract_date in [latest_monthly, latest_daily]:
            if (
                extract_date
                and extract_date.year == current_date.year
                and extract_date.month == current_date.month
            ):
                processed_this_month = True
                break

        # If we haven't processed any extracts this month, or if this is the first run ever,
        # fetch all available daily extracts regardless of monthly extract date
        if not processed_this_month or (not latest_monthly and not latest_daily):
            logger.info("No extracts processed this month, fetching all available daily extracts")
            self._fetch_daily_extracts()
        elif monthly_fetched:
            # If we've processed extracts this month and fetched a new monthly extract,
            # only fetch daily extracts after the monthly extract date
            logger.info("Fetching daily extracts after the monthly extract date")
            self._fetch_daily_extracts(after_date=latest_monthly)
        elif latest_monthly:
            # If we've processed extracts this month but didn't fetch a new monthly extract,
            # fetch daily extracts after the most recent monthly extract
            logger.info("Fetching daily extracts after the most recent monthly extract")
            self._fetch_daily_extracts(after_date=latest_monthly)
        else:
            # Fallback: if no monthly extract exists, fetch all daily extracts
            logger.info("No monthly extract exists, fetching all daily extracts")
            self._fetch_daily_extracts()

    def _get_latest_extract_date(self, extract_type: SamGovExtractType) -> date | None:
        """Get the date of the most recent extract of the specified type"""
        stmt = (
            select(SamExtractFile.extract_date)
            .where(
                SamExtractFile.extract_type == extract_type,
                SamExtractFile.processing_status == SamGovProcessingStatus.COMPLETED,
            )
            .order_by(SamExtractFile.extract_date.desc())
            .limit(1)
        )
        result = self.db_session.execute(stmt).scalar_one_or_none()
        return result

    def _fetch_monthly_extract(self) -> bool:
        """Fetch the latest monthly extract if needed.

        Returns:
            True if a new extract was fetched, False otherwise
        """
        # Get info about the latest monthly extract
        monthly_info = self.sam_gov_client.get_monthly_extract_info()
        if not monthly_info:
            logger.info("No monthly extract info available from SAM.gov API")
            return False

        # Get the first Sunday of the current month
        current_date = datetime_util.utcnow().date()
        target_date = get_first_sunday_of_month(current_date.year, current_date.month)

        # Check if we already have this extract
        stmt = select(SamExtractFile).where(
            SamExtractFile.extract_type == SamGovExtractType.MONTHLY,
            SamExtractFile.extract_date == target_date,
            SamExtractFile.processing_status == SamGovProcessingStatus.COMPLETED,
        )
        existing = self.db_session.execute(stmt).scalar_one_or_none()

        if existing:
            logger.info(f"Monthly extract for {target_date} already exists")
            return False

        # Download the extract
        s3_key = f"{self.config.s3_prefix}monthly/{monthly_info.filename}"
        s3_path = f"s3://{self.config.s3_bucket}/{s3_key}"

        request = SamExtractRequest(file_name=monthly_info.filename)
        response = self.sam_gov_client.download_extract(request, s3_path)

        # Record the extract in the database
        extract = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=target_date,
            filename=str(response.file_name),  # Convert to string in case it's a mock
            s3_path=s3_path,
            processing_status=SamGovProcessingStatus.PENDING,
            sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
        )
        self.db_session.add(extract)

        # Increment the metric
        self.increment(self.Metrics.MONTHLY_EXTRACTS_FETCHED)

        logger.info(f"Successfully downloaded monthly extract for {target_date}")
        return True

    def _fetch_daily_extracts(self, after_date: Optional[date] = None) -> None:
        """Fetch all daily extracts after the given date.

        Args:
            after_date: Only fetch extracts after this date. If None, fetch all available daily extracts.
        """
        # Get info about available daily extracts
        daily_info_list = self.sam_gov_client.get_daily_extract_info()
        if not daily_info_list:
            logger.info("No daily extract info available from SAM.gov API")
            return

        # Process each daily extract that's after our cutoff date
        for daily_info in daily_info_list:
            extract_date = daily_info.updated_at.date()

            # Skip if before our cutoff
            if after_date and extract_date <= after_date:
                continue

            # Check if we already have this extract
            stmt = select(SamExtractFile).where(
                SamExtractFile.extract_type == SamGovExtractType.DAILY,
                SamExtractFile.extract_date == extract_date,
            )
            existing = self.db_session.execute(stmt).scalar_one_or_none()

            if existing:
                logger.info(f"Daily extract for {extract_date} already exists")
                continue

            # Download the extract
            s3_key = f"{self.config.s3_prefix}daily/{daily_info.filename}"
            s3_path = f"s3://{self.config.s3_bucket}/{s3_key}"

            request = SamExtractRequest(file_name=daily_info.filename)
            response = self.sam_gov_client.download_extract(request, s3_path)

            # Record the extract in the database
            extract = SamExtractFile(
                extract_type=SamGovExtractType.DAILY,
                extract_date=extract_date,
                filename=str(response.file_name),  # Convert to string in case it's a mock
                s3_path=s3_path,
                processing_status=SamGovProcessingStatus.PENDING,
                sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
            )
            self.db_session.add(extract)

            # Increment the metric
            self.increment(self.Metrics.DAILY_EXTRACTS_FETCHED)

            logger.info(f"Successfully downloaded daily extract for {extract_date}")


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
