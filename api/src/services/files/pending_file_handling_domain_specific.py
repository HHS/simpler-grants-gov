import logging
import uuid

import grants_shared.adapters.db as db
from sqlalchemy import select

from grants_shared.api.route_utils import raise_flask_error
from src.constants.lookup_constants import FileScanStatus
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User
from src.util import file_util

logger = logging.getLogger(__name__)


def fetch_pending_file(db_session: db.Session, pending_file_id: uuid.UUID) -> PendingFile:
    stmt = select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
    pending_file = db_session.execute(stmt).scalar_one_or_none()

    if pending_file is None:
        logger.info(
            "Pending file not found",
            extra={"pending_file_id": pending_file_id},
        )
        raise_flask_error(404, message="Pending file not found")

    return pending_file


def validate_user_owns_file(pending_file: PendingFile, user: User) -> None:
    """
    Validates that the user owns the pending file.

    Raises:
        403: If the user does not own the pending file
    """
    if pending_file.user_id != user.user_id:
        logger.info(
            "User does not have permission to access pending file",
            extra={
                "pending_file_id": pending_file.pending_file_id,
                "requesting_user_id": user.user_id,
                "file_owner_user_id": pending_file.user_id,
            },
        )
        raise_flask_error(403, message="You do not have permission to access this file")


def validate_file_scan_complete(pending_file: PendingFile) -> None:
    """
    Validates that the file scan status is COMPLETE.

    Raises:
        422: If the file scan status is not COMPLETE
    """
    if pending_file.file_scan_status != FileScanStatus.COMPLETE:
        logger.info(
            "Pending file status is not valid for processing",
            extra={
                "pending_file_id": pending_file.pending_file_id,
                "file_scan_status": pending_file.file_scan_status,
            },
        )
        raise_flask_error(
            422,
            message="File is not valid for processing",
            extra_data={"file_status": pending_file.file_scan_status},
        )


def fetch_and_validate_scan_complete_file(
    db_session: db.Session, pending_file_id: uuid.UUID, user: User
) -> PendingFile:
    """
    Fetches and validates a pending file with complete scan status and authorization checks.

    This function combines:
    - Fetching the file record by ID (raises 404 if not found)
    - Verifying user ownership (raises 403 if not owned by user)
    - Verifying the file scan status is COMPLETE (raises 422 if not)
    """
    pending_file = fetch_pending_file(db_session, pending_file_id)
    validate_user_owns_file(pending_file, user)
    validate_file_scan_complete(pending_file)
    return pending_file


def move_pending_file_to_destination(pending_file: PendingFile, destination_s3_path: str) -> None:
    """
    Moves a pending file to its final destination and updates its status.

    This function:
    - Moves the file from its current S3 location to the specified destination
    - Updates the pending file record status from COMPLETE to PROCESSED

    Args:
        pending_file: The PendingFile record to process
        destination_s3_path: The full S3 path (s3://bucket/key) where the file should be moved

    Raises:
        Exception: If the file move operation fails
    """
    logger.info(
        "Moving pending file to destination",
        extra={
            "pending_file_id": pending_file.pending_file_id,
            "source_location": pending_file.file_location,
            "destination_location": destination_s3_path,
        },
    )

    file_util.move_file(pending_file.file_location, destination_s3_path)

    pending_file.file_scan_status = FileScanStatus.PROCESSED

    logger.info(
        "Successfully moved pending file and updated status",
        extra={
            "pending_file_id": pending_file.pending_file_id,
            "new_status": FileScanStatus.PROCESSED,
        },
    )
