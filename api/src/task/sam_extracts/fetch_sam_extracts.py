import logging
from datetime import datetime
from enum import StrEnum

import boto3
from botocore.client import BaseClient
from pydantic import Field
from sqlalchemy import select

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.factory import create_sam_gov_client
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SamExtractsConfig(PydanticBaseEnvConfig):
    """Configuration for SAM extracts fetching task"""

    sam_api_url: str = Field(
        alias="SAM_API_URL", default="https://api.sam.gov/data-services/v1/extracts"
    )
    s3_bucket: str = Field(alias="SAM_EXTRACTS_S3_BUCKET")
    s3_prefix: str = Field(alias="SAM_EXTRACTS_S3_PREFIX", default="sam-extracts/")


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

        # If we fetched a new monthly extract, we don't need daily extracts before its date
        if monthly_fetched:
            self._fetch_daily_extracts(after_date=monthly_fetched)
        else:
            # Get the most recent monthly extract date
            latest_monthly = self._get_latest_extract_date(SamGovExtractType.MONTHLY)
            if latest_monthly:
                # Fetch daily extracts after the most recent monthly extract
                self._fetch_daily_extracts(after_date=latest_monthly)
            else:
                # No monthly extract exists, fetch all daily extracts
                self._fetch_daily_extracts()

    def _get_latest_extract_date(self, extract_type: SamGovExtractType) -> datetime | None:
        """Get the date of the most recent extract of the specified type"""
        stmt = (
            select(SamExtractFile.extract_date)
            .where(
                SamExtractFile.extract_type == extract_type,
                SamExtractFile.status == SamGovProcessingStatus.COMPLETED,
            )
            .order_by(SamExtractFile.extract_date.desc())
            .limit(1)
        )
        result = self.db_session.execute(stmt).scalar_one_or_none()
        return result

    def _fetch_monthly_extract(self) -> datetime | None:
        """
        Fetch the latest monthly extract if it's new

        Returns the date of the extract if fetched, None otherwise
        """
        try:
            # Fetch the information about the latest monthly extract
            monthly_info = self.sam_gov_client.get_monthly_extract_info()
            if not monthly_info:
                logger.info("No monthly extract info available from SAM.gov API")
                return None

            # Check if we already have this extract
            extract_date = datetime.combine(monthly_info.updated_at.date(), datetime.min.time())
            stmt = select(SamExtractFile).where(
                SamExtractFile.extract_type == SamGovExtractType.MONTHLY,
                SamExtractFile.extract_date == extract_date,
                SamExtractFile.status == SamGovProcessingStatus.COMPLETED,
            )
            existing = self.db_session.execute(stmt).scalar_one_or_none()

            if existing:
                logger.info(
                    "Monthly extract already exists",
                    extra={"extract_date": extract_date.isoformat()},
                )
                return extract_date

            # Download and store the extract
            s3_path = self._download_and_store_extract(
                monthly_info.url, monthly_info.filename, SamGovExtractType.MONTHLY, extract_date
            )

            if s3_path:
                self.increment(self.Metrics.MONTHLY_EXTRACTS_FETCHED)
                logger.info(
                    "Successfully fetched monthly extract",
                    extra={
                        "extract_date": extract_date.isoformat(),
                        "filename": monthly_info.filename,
                        "s3_path": s3_path,
                    },
                )
                return extract_date

            return None
        except Exception as e:
            self.increment(self.Metrics.ERRORS_ENCOUNTERED)
            logger.exception("Error fetching monthly extract", extra={"error": str(e)})
            return None

    def _fetch_daily_extracts(self, after_date: datetime | None = None) -> None:
        """
        Fetch all daily extracts that haven't been processed yet

        If after_date is provided, only fetches extracts after that date
        """
        try:
            # Fetch the information about available daily extracts
            daily_info_list = self.sam_gov_client.get_daily_extract_info()
            if not daily_info_list:
                logger.info("No daily extract info available from SAM.gov API")
                return

            # Get list of all daily extracts we've already processed
            stmt = select(SamExtractFile.extract_date).where(
                SamExtractFile.extract_type == SamGovExtractType.DAILY,
                SamExtractFile.status == SamGovProcessingStatus.COMPLETED,
            )
            if after_date:
                # Only consider extracts after the specified date
                stmt = stmt.where(SamExtractFile.extract_date > after_date)

            processed_dates = {
                date.date() for date in self.db_session.execute(stmt).scalars().all()
            }

            # Sort by date
            daily_info_list.sort(key=lambda x: x.updated_at)

            # Process each daily extract
            for extract_info in daily_info_list:
                extract_datetime = datetime.combine(
                    extract_info.updated_at.date(), datetime.min.time()
                )
                extract_date = extract_info.updated_at.date()

                # Skip if we've already processed this extract or it's before our cutoff
                if extract_date in processed_dates or (
                    after_date and extract_date <= after_date.date()
                ):
                    continue

                # Download and store the extract
                s3_path = self._download_and_store_extract(
                    extract_info.url,
                    extract_info.filename,
                    SamGovExtractType.DAILY,
                    extract_datetime,
                )

                if s3_path:
                    self.increment(self.Metrics.DAILY_EXTRACTS_FETCHED)
                    logger.info(
                        "Successfully fetched daily extract",
                        extra={
                            "extract_date": extract_date.isoformat(),
                            "filename": extract_info.filename,
                            "s3_path": s3_path,
                        },
                    )
        except Exception as e:
            self.increment(self.Metrics.ERRORS_ENCOUNTERED)
            logger.exception("Error fetching daily extracts", extra={"error": str(e)})

    def _download_and_store_extract(
        self, url: str, filename: str, extract_type: SamGovExtractType, extract_date: datetime
    ) -> str | None:
        """
        Download extract from URL and store in S3

        Returns the S3 path if successful, None otherwise
        """
        # Create a record to track this extract
        extract_record = SamExtractFile(
            extract_type=extract_type,
            extract_date=extract_date,
            filename=filename,
            s3_path="",  # Will be updated later
            status=SamGovProcessingStatus.PENDING,
        )
        self.db_session.add(extract_record)
        self.db_session.flush()  # To get the id

        try:
            # In a real implementation, this would download the file
            # For now, we'll mock the process
            # response = requests.get(url, stream=True)
            # response.raise_for_status()

            # Generate S3 path
            date_str = extract_date.strftime("%Y-%m-%d")
            file_type = extract_type.value
            s3_key = f"{self.config.s3_prefix}{file_type}/{date_str}/{filename}"

            # In a real implementation, upload the file to S3
            # self.s3_client.upload_fileobj(
            #     io.BytesIO(response.content),
            #     self.config.s3_bucket,
            #     s3_key
            # )

            # Update the record
            extract_record.s3_path = s3_key
            extract_record.status = SamGovProcessingStatus.COMPLETED
            self.db_session.commit()

            return s3_key
        except Exception as e:
            # Update the record with the error
            extract_record.status = SamGovProcessingStatus.FAILED
            self.db_session.commit()

            logger.exception(
                "Failed to download and store extract",
                extra={
                    "extract_type": extract_type.value,
                    "extract_date": extract_date.isoformat(),
                    "url": url,
                    "error": str(e),
                },
            )
            return None
