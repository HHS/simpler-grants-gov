import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.util import datetime_util
from sqlalchemy import select

from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import FileScanStatus, Privilege
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def update_pending_file_scan_status(
    db_session: db.Session,
    pending_file_id: uuid.UUID,
    file_scan_status: FileScanStatus,
    user: User,
) -> None:
    verify_access(user, {Privilege.INTERNAL_S3_SCAN}, None)

    stmt = select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
    pending_file = db_session.execute(stmt).scalar_one_or_none()

    if pending_file is None:
        raise_flask_error(404, "Pending file not found")

    prior_file_scan_status = pending_file.file_scan_status
    pending_file.file_scan_status = file_scan_status

    now = datetime_util.utcnow()
    scan_duration_seconds = (now - pending_file.created_at).total_seconds()

    logger.info(
        "Updated pending file scan status",
        extra={
            "pending_file_id": pending_file.pending_file_id,
            "user_id": user.user_id,
            "prior_file_scan_status": prior_file_scan_status,
            "file_scan_status": file_scan_status,
            "scan_duration_seconds": scan_duration_seconds,
        },
    )
