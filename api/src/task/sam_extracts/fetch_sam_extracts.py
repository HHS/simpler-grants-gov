"""Task to fetch SAM.gov extracts."""

import logging
import uuid
from datetime import date, timedelta
from enum import StrEnum

from botocore.client import BaseClient
from pydantic import Field
from sqlalchemy import select

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.adapters.aws.s3_adapter import get_s3_client
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
        self.s3_client = s3_client or get_s3_client()

    def run_task(self) -> None:
        """Main task logic to fetch SAM.gov extracts"""
        with self.db_session.begin():
            logger.info("Attempting to fetch monthly extract.")
            self._fetch_monthly_extract()

            logger.info("Attempting to fetch daily extracts for the current month.")
            self._fetch_daily_extracts_for_month()

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

        # Construct the filename based on the target date
        filename = f"SAM_FOUO_MONTHLY_V2_{target_date.strftime('%Y%m%d')}.ZIP"

        # Download the extract
        s3_key = f"{self.config.s3_prefix}monthly/{filename}"
        s3_path = f"s3://{self.config.s3_bucket}/{s3_key}"

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
        return True

    def _fetch_daily_extracts_for_month(self) -> None:
        """Fetch all daily extracts for the current month that we don't already have."""
        current_date = datetime_util.utcnow().date()
        start_of_month = current_date.replace(day=1)

        # Iterate through each day of the current month
        for day_offset in range(current_date.day):
            process_date = start_of_month + timedelta(days=day_offset)

            # Construct the filename for the daily extract
            filename = f"SAM_FOUO_DAILY_V2_{process_date.strftime('%Y%m%d')}.ZIP"

            # Check if we already have this extract by filename
            stmt = select(SamExtractFile).where(SamExtractFile.filename == filename)
            existing = self.db_session.execute(stmt).scalar_one_or_none()

            if existing:
                logger.info(
                    f"Daily extract for {process_date} (file: {filename}) already has been processed."
                )
                continue

            # Download the extract
            logger.info(
                f"New daily extract found for {process_date} (file: {filename}). Downloading."
            )
            s3_key = f"{self.config.s3_prefix}daily/{filename}"
            s3_path = f"s3://{self.config.s3_bucket}/{s3_key}"

            request = SamExtractRequest(file_name=filename)
            self.sam_gov_client.download_extract(request, s3_path)

            # Record the extract in the database
            extract = SamExtractFile(
                extract_type=SamGovExtractType.DAILY,
                extract_date=process_date,
                filename=filename,
                s3_path=s3_path,
                processing_status=SamGovProcessingStatus.PENDING,
                sam_extract_file_id=uuid.uuid4(),  # Set UUID explicitly to avoid flush
            )
            self.db_session.add(extract)

            # Increment the metric
            self.increment(self.Metrics.DAILY_EXTRACTS_FETCHED)

            logger.info(f"Successfully downloaded daily extract for {process_date}")


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
