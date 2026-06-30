import logging
import uuid

import grants_shared.adapters.db as db
import grants_shared.util.file_util as file_util
from grants_shared.api.response import ValidationErrorDetail
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util import datetime_util
from sqlalchemy import select

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import FileScanStatus, Privilege
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def update_pending_file_scan_status(
    db_session: db.Session,
    pending_file_id: uuid.UUID,
    file_scan_status: FileScanStatus,
    file_location: str,
    user: User,
) -> None:
    verify_access(user, {Privilege.INTERNAL_S3_SCAN}, None)

    stmt = select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
    pending_file = db_session.execute(stmt).scalar_one_or_none()

    if pending_file is None:
        raise_flask_error(404, "Pending file not found")

    if not file_util.file_exists(file_location):
        raise_flask_error(
            422,
            message="File does not exist at the provided s3 path",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.FILE_NOT_FOUND_AT_LOCATION,
                    message="File does not exist at the provided s3 path",
                    field="file_location",
                )
            ],
        )

    prior_file_scan_status = pending_file.file_scan_status
    pending_file.file_scan_status = file_scan_status
    pending_file.file_location = file_location

    now = datetime_util.utcnow()
    scan_duration_seconds = (now - pending_file.created_at).total_seconds()

    # Calculate the file length of the file for logging purposes
    # If this fails for whatever reason, we don't want to fail
    # the API call, just log the error and move on.
    try:
        file_length = file_util.get_file_length_bytes(file_location)
    except Exception:
        logger.exception("Failed to get file length")
        file_length = None

    logger.info(
        "Updated pending file scan status",
        extra={
            "pending_file_id": pending_file.pending_file_id,
            "scanner_user_id": user.user_id,
            "uploader_user_id": pending_file.user_id,
            "prior_file_scan_status": prior_file_scan_status,
            "file_scan_status": file_scan_status,
            "scan_duration_seconds": scan_duration_seconds,
            "file_length_bytes": file_length,
        },
    )
