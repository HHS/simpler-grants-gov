import logging
import time
import uuid
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

import grants_shared.adapters.db as db
import grants_shared.adapters.db.flask_db as flask_db
import grants_shared.util.file_util as file_util
from grants_shared.adapters.aws.dynamodb_adapter import DynamoDBClient, DynamoDBConfig
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util import datetime_util
from pydantic import Field
from sqlalchemy import select

from src.constants.lookup_constants import FileScanStatus
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


# When the status reaches one of these values, the scan is finished and we
# stop streaming further updates.
TERMINAL_STATUSES: frozenset[FileScanStatus] = frozenset(
    {FileScanStatus.COMPLETE, FileScanStatus.INFECTED}
)

# Attribute names on the DynamoDB scan-cache record. The partition key matches
# what setup_local_dynamodb.py / infra define.
SCAN_RECORD_FILE_ID_KEY = "file_id"
SCAN_RECORD_USER_ID_ATTR = "user_id"
SCAN_RECORD_STATUS_ATTR = "status"


class FileScanStreamConfig(PydanticBaseEnvConfig):
    poll_interval_seconds: float = Field(alias="FILE_SCAN_RESULTS_POLL_INTERVAL_SECONDS")
    max_duration_seconds: float = Field(alias="FILE_SCAN_RESULTS_MAX_DURATION_SECONDS")


@dataclass(frozen=True)
class FileScanRecord:
    """A fully-parsed scan-cache record from DynamoDB."""

    user_id: str
    status: FileScanStatus


@dataclass(frozen=True)
class FileMetadata:
    """File metadata returned to the caller once a scan reaches a complete status."""

    file_name: str
    file_size_bytes: int
    download_path: str


class InvalidFileScanRecordError(Exception):
    """A DynamoDB scan record is missing required attributes or has an
    unknown status value. Treated as an infrastructure error (500)."""


def _get_string_attr(item: dict[str, Any], attr: str) -> str | None:
    # DynamoDB returns items in attribute-value format: {"attr": {"S": "value"}}.
    # We only need the string-typed attributes on the scan record.
    raw = item.get(attr)
    if not isinstance(raw, dict):
        return None
    return raw.get("S")


def _parse_scan_record(item: dict[str, Any]) -> FileScanRecord:
    user_id = _get_string_attr(item, SCAN_RECORD_USER_ID_ATTR)
    if user_id is None:
        raise InvalidFileScanRecordError(
            f"Scan record missing {SCAN_RECORD_USER_ID_ATTR!r} attribute"
        )

    raw_status = _get_string_attr(item, SCAN_RECORD_STATUS_ATTR)
    if raw_status is None:
        raise InvalidFileScanRecordError(
            f"Scan record missing {SCAN_RECORD_STATUS_ATTR!r} attribute"
        )

    try:
        status = FileScanStatus(raw_status)
    except ValueError as exc:
        raise InvalidFileScanRecordError(
            f"Scan record has unknown {SCAN_RECORD_STATUS_ATTR!r} value: {raw_status!r}"
        ) from exc

    return FileScanRecord(user_id=user_id, status=status)


def _get_scan_record(
    dynamodb_client: DynamoDBClient,
    table_name: str,
    pending_file_id: uuid.UUID,
) -> FileScanRecord | None:
    response = dynamodb_client.get_item(
        table_name=table_name,
        key_name=SCAN_RECORD_FILE_ID_KEY,
        value=str(pending_file_id),
        consistent_read=True,
    )
    if response.item is None:
        return None
    return _parse_scan_record(response.item)


def _fetch_next_record(
    dynamodb_client: DynamoDBClient,
    table_name: str,
    pending_file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> FileScanRecord | None:
    """Re-query the scan record for the next poll iteration.

    Returns the record if it still exists and still belongs to ``user_id``;
    returns None (and logs) if the record was deleted between polls or now
    belongs to a different user. Raises InvalidFileScanRecordError if the
    record exists but is malformed -- the caller is expected to log + re-raise
    so the stream terminates loudly.
    """
    next_record = _get_scan_record(dynamodb_client, table_name, pending_file_id)
    if next_record is None:
        # The record existed at the start of the stream, so its disappearance
        # mid-poll is a "should never happen" state -- TTL expiry on an active
        # scan, an external delete, etc. Log loudly so the cause can be found.
        logger.error(
            "File scan record disappeared during stream, ending stream",
            extra={"pending_file_id": pending_file_id, "user_id": user_id},
        )
        return None

    if next_record.user_id != str(user_id):
        logger.warning(
            "File scan record user_id changed during stream, ending stream",
            extra={"pending_file_id": pending_file_id, "user_id": user_id},
        )
        return None

    return next_record


@flask_db.with_db_session()
def get_file_metadata(db_session: db.Session, pending_file_id: uuid.UUID) -> FileMetadata:
    """Build the file metadata returned once a scan reaches a complete status.

    The DB session is only checked out when this is called -- after the scan
    completes -- so a long-polling stream doesn't hold a connection from the
    threadpool while it waits for the scan to finish.
    """
    with db_session.begin():
        pending_file = db_session.execute(
            select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
        ).scalar_one_or_none()

        if pending_file is None:
            # The scan reached a complete status but the backing DB row is
            # missing, so fail loudly with a 500.
            raise_flask_error(500, "Pending file not found")

        file_name = pending_file.file_name
        file_location = pending_file.file_location

    return FileMetadata(
        file_name=file_name,
        file_size_bytes=file_util.get_file_length_bytes(file_location),
        download_path=file_util.pre_sign_file_location(file_location),
    )


def _metadata_for_status(status: FileScanStatus, pending_file_id: uuid.UUID) -> FileMetadata | None:
    """Look up file metadata once the scan completes; null for any other status.

    The DB session is only checked out for a complete scan, so a stream that
    sits polling a pending scan never holds a connection.
    """
    if status != FileScanStatus.COMPLETE:
        return None
    return get_file_metadata(pending_file_id)


def stream_file_scan_results(
    pending_file_id: uuid.UUID,
    user: User,
    dynamodb_client: DynamoDBClient,
    config: FileScanStreamConfig | None = None,
    dynamodb_config: DynamoDBConfig | None = None,
) -> Iterator[dict[str, Any]]:
    """Stream file scan status updates for the given pending file.

    The initial DynamoDB lookup -- and, if that scan is already complete, the
    file metadata lookup -- happens before any chunks are yielded so we can
    return a 404 / 403 / 500 with the proper HTTP status. After streaming
    starts, a missing record or user mismatch just ends the stream; a malformed
    record raises (terminating the connection) and is logged.

    Yields chunks shaped like ``FileScanResultsResponseSchema``; the caller is
    responsible for serializing each chunk through that schema. The
    ``file_metadata`` field is populated only once the scan completes.
    """
    if config is None:
        config = FileScanStreamConfig()
    if dynamodb_config is None:
        dynamodb_config = DynamoDBConfig()

    table_name = dynamodb_config.file_scan_cache_table_name

    # First lookup happens outside the generator so that 404/403/500 results in
    # a proper HTTP status code rather than a truncated stream. A malformed
    # record raised from _get_scan_record propagates as an unhandled exception,
    # which the framework converts to a 500 with stack-trace logging.
    record = _get_scan_record(dynamodb_client, table_name, pending_file_id)
    if record is None:
        raise_flask_error(404, "File scan record not found")

    if record.user_id != str(user.user_id):
        logger.warning(
            "User attempted to access another user's file scan results",
            extra={
                "pending_file_id": pending_file_id,
                "user_id": user.user_id,
                "record_user_id": record.user_id,
            },
        )
        raise_flask_error(403, "Forbidden")

    # Resolve metadata for the initial record outside the generator so that an
    # already-complete scan with a missing DB row surfaces as a proper 500 (the
    # common small-file case is complete on the very first poll) rather than a
    # truncated stream.
    initial_metadata = _metadata_for_status(record.status, pending_file_id)

    def generate() -> Iterator[dict[str, Any]]:
        current_record = record
        file_metadata = initial_metadata
        start_time = datetime_util.utcnow()

        while True:
            status = current_record.status

            yield {"data": {"status": status.value, "file_metadata": file_metadata}}

            elapsed = (datetime_util.utcnow() - start_time).total_seconds()

            if status in TERMINAL_STATUSES:
                logger.info(
                    "File scan results stream reached terminal status",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                        "file_scan_status": status,
                        "stream_duration_seconds": elapsed,
                    },
                )
                return

            if elapsed >= config.max_duration_seconds:
                logger.info(
                    "File scan results stream reached max duration",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                        "last_file_scan_status": status,
                        "stream_duration_seconds": elapsed,
                    },
                )
                return

            time.sleep(config.poll_interval_seconds)

            try:
                next_record = _fetch_next_record(
                    dynamodb_client, table_name, pending_file_id, user.user_id
                )
            except InvalidFileScanRecordError:
                # Streaming has already started so we can't change the HTTP
                # status; log explicitly (Flask's error processor only fires
                # for HTTPError) and re-raise to abort the connection.
                logger.exception(
                    "Invalid file scan record encountered mid-stream, aborting",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                        "stream_duration_seconds": elapsed,
                    },
                )
                raise

            if next_record is None:
                return

            current_record = next_record
            file_metadata = _metadata_for_status(current_record.status, pending_file_id)

    return generate()
