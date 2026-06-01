import logging
import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from grants_shared.util import datetime_util
from pydantic import Field
from sqlalchemy import func, select

import src.adapters.db as db
import src.util.file_util as file_util
from src.adapters.aws import S3Config
from src.adapters.aws.dynamodb_adapter import DynamoDBClient, DynamoDBConfig
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import FileScanStatus
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User
from src.util.env_config import PydanticBaseEnvConfig
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


class PresignedUploadConfig(PydanticBaseEnvConfig):
    pending_file_upload_rate_window_hours: int = Field(
        default=1, alias="PENDING_FILE_UPLOAD_RATE_WINDOW_HOURS"
    )
    pending_file_upload_rate_limit: int = Field(default=100, alias="PENDING_FILE_UPLOAD_RATE_LIMIT")


@dataclass(frozen=True)
class PresignedUploadResult:
    pending_file_id: uuid.UUID
    url: str
    body: dict[str, Any]


def _count_recent_pending_files(
    db_session: db.Session, user_id: uuid.UUID, window_hours: int
) -> int:
    cutoff = datetime_util.utcnow() - timedelta(hours=window_hours)
    stmt = (
        select(func.count())
        .select_from(PendingFile)
        .where(PendingFile.user_id == user_id, PendingFile.created_at >= cutoff)
    )
    return db_session.execute(stmt).scalar_one()


def _build_s3_file_location(s3_config: S3Config, pending_file_id: uuid.UUID, file_name: str) -> str:
    return file_util.join(
        s3_config.file_scan_bucket_path,
        "unscanned",
        str(pending_file_id),
        file_name,
    )


def _write_scan_record(
    dynamodb_client: DynamoDBClient,
    dynamodb_config: DynamoDBConfig,
    pending_file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    dynamodb_client.put_item(
        table_name=dynamodb_config.file_scan_cache_table_name,
        item={
            "file_id": {"S": str(pending_file_id)},
            "user_id": {"S": str(user_id)},
            "status": {"S": FileScanStatus.PENDING.value},
        },
    )


def create_presigned_upload(
    db_session: db.Session,
    user: User,
    request_data: dict,
    s3_config: S3Config | None = None,
    dynamodb_client: DynamoDBClient | None = None,
    dynamodb_config: DynamoDBConfig | None = None,
    config: PresignedUploadConfig | None = None,
) -> PresignedUploadResult:
    if s3_config is None:
        s3_config = S3Config()
    if dynamodb_client is None:
        dynamodb_client = DynamoDBClient()
    if dynamodb_config is None:
        dynamodb_config = DynamoDBConfig()
    if config is None:
        config = PresignedUploadConfig()

    file_name = request_data["file_name"]
    mime_type = request_data["mime_type"]

    recent_count = _count_recent_pending_files(
        db_session, user.user_id, config.pending_file_upload_rate_window_hours
    )
    if recent_count >= config.pending_file_upload_rate_limit:
        logger.info(
            "User exceeded pending file upload rate limit",
            extra={
                "user_id": user.user_id,
                "recent_pending_file_count": recent_count,
                "pending_file_upload_rate_limit": config.pending_file_upload_rate_limit,
                "pending_file_upload_rate_window_hours": (
                    config.pending_file_upload_rate_window_hours
                ),
            },
        )
        raise_flask_error(
            429,
            message="Too many pending file uploads",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.PENDING_FILE_UPLOAD_LIMIT_EXCEEDED,
                    message=(
                        f"User has uploaded more than "
                        f"{config.pending_file_upload_rate_limit} files in the past "
                        f"{config.pending_file_upload_rate_window_hours} hour(s)"
                    ),
                )
            ],
        )

    # secure_filename makes the file safe for path operations and strips
    # non-ascii characters before we hand it to s3.
    secure_file_name = file_util.get_secure_file_name(file_name)

    pending_file_id = uuid.uuid4()
    s3_file_location = _build_s3_file_location(s3_config, pending_file_id, secure_file_name)

    pending_file = PendingFile(
        pending_file_id=pending_file_id,
        user=user,
        file_name=file_name,
        file_location=s3_file_location,
        mime_type=mime_type,
        file_scan_status=FileScanStatus.PENDING,
    )
    db_session.add(pending_file)

    presigned = file_util.pre_sign_upload(
        file_path=s3_file_location,
        content_type=mime_type,
        metadata={
            "file-id": str(pending_file_id),
            "user-id": str(user.user_id),
        },
        s3_config=s3_config,
    )

    _write_scan_record(
        dynamodb_client=dynamodb_client,
        dynamodb_config=dynamodb_config,
        pending_file_id=pending_file_id,
        user_id=user.user_id,
    )

    logger.info(
        "Created presigned upload for pending file",
        extra={
            "pending_file_id": pending_file_id,
            "user_id": user.user_id,
            "file_scan_status": FileScanStatus.PENDING,
        },
    )

    return PresignedUploadResult(
        pending_file_id=pending_file_id,
        url=presigned["url"],
        body=presigned["fields"],
    )
