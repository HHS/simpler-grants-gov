"""Task to cleanup old SAM.gov extract files."""

import logging
from collections.abc import Sequence
from datetime import date, timedelta
from enum import StrEnum

from sqlalchemy import select

import src.adapters.db as db
from src.constants.lookup_constants import SamGovProcessingStatus
from src.db.models.sam_extract_models import SamExtractFile
from src.task.task import Task
from src.util import file_util

logger = logging.getLogger(__name__)


class CleanupOldSamExtractsTask(Task):
    """Task that runs daily to cleanup old SAM.gov extract files"""

    class Metrics(StrEnum):
        FILES_DELETED_COUNT = "files_deleted_count"

    def __init__(self, db_session: db.Session) -> None:
        super().__init__(db_session)

    def run_task(self) -> None:
        """Main task logic to cleanup old SAM.gov extract files"""
        logger.info("Starting cleanup of old SAM.gov extract files")

        with self.db_session.begin():

            # Get files older than 45 days that aren't already deleted
            old_files = self._get_old_files_to_cleanup()

            if not old_files:
                logger.info("No old files found to cleanup")
                return

            logger.info(f"Found {len(old_files)} old files to cleanup")

            deleted_count = 0

            for sam_extract_file in old_files:
                try:
                    self._cleanup_file(sam_extract_file)
                    deleted_count += 1
                    self.increment(self.Metrics.FILES_DELETED_COUNT)

                    logger.info(
                        "Successfully cleaned up old SAM.gov extract file",
                        extra={
                            "sam_extract_file_id": sam_extract_file.sam_extract_file_id,
                            "s3_path": sam_extract_file.s3_path,
                            "extract_date": sam_extract_file.extract_date,
                            "extract_type": sam_extract_file.extract_type,
                        },
                    )

                except Exception:
                    logger.exception(
                        "Failed to cleanup old SAM.gov extract file",
                        extra={
                            "sam_extract_file_id": sam_extract_file.sam_extract_file_id,
                            "s3_path": sam_extract_file.s3_path,
                            "extract_date": sam_extract_file.extract_date,
                            "extract_type": sam_extract_file.extract_type,
                        },
                    )
                    raise

            logger.info(
                "Completed cleanup of old SAM.gov extract files",
                extra={
                    "total_files_processed": len(old_files),
                },
            )

    def _get_old_files_to_cleanup(self) -> Sequence[SamExtractFile]:
        """Fetch all SAM.gov extract files older than 45 days that aren't already deleted"""
        cutoff_date = date.today() - timedelta(days=45)

        return (
            self.db_session.execute(
                select(SamExtractFile)
                .where(
                    SamExtractFile.extract_date < cutoff_date,
                    SamExtractFile.processing_status != SamGovProcessingStatus.DELETED,
                )
                .order_by(SamExtractFile.extract_date.asc())
            )
            .scalars()
            .all()
        )

    def _cleanup_file(self, sam_extract_file: SamExtractFile) -> None:
        """Cleanup a single SAM.gov extract file"""
        # Delete the file from S3
        file_util.delete_file(sam_extract_file.s3_path)

        # Mark the record as deleted in the database
        sam_extract_file.processing_status = SamGovProcessingStatus.DELETED
