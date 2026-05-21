import logging
import time
import uuid
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from pydantic import Field

from src.adapters.aws.dynamodb_adapter import DynamoDBClient, DynamoDBConfig
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import FileScanStatus
from src.db.models.user_models import User
from src.util import datetime_util
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
    poll_interval_seconds: float = Field(
        default=3.0, alias="FILE_SCAN_RESULTS_POLL_INTERVAL_SECONDS"
    )
    max_duration_seconds: float = Field(
        default=60.0, alias="FILE_SCAN_RESULTS_MAX_DURATION_SECONDS"
    )


@dataclass(frozen=True)
class FileScanRecord:
    """Scan-cache record from DynamoDB with attributes pre-parsed.

    Fields are typed as Optional because a record in DynamoDB can be partially
    written or carry an unknown status value; callers decide what to do with
    a missing or unparseable field.
    """

    user_id: str | None
    status: FileScanStatus | None
    # Kept for diagnostic logging when ``status`` couldn't be parsed.
    raw_status: str | None


def _get_string_attr(item: dict[str, Any], attr: str) -> str | None:
    # DynamoDB returns items in attribute-value format: {"attr": {"S": "value"}}.
    # We only need the string-typed attributes on the scan record.
    raw = item.get(attr)
    if not isinstance(raw, dict):
        return None
    return raw.get("S")


def _parse_scan_record(item: dict[str, Any]) -> FileScanRecord:
    raw_status = _get_string_attr(item, SCAN_RECORD_STATUS_ATTR)
    status: FileScanStatus | None = None
    if raw_status is not None:
        try:
            status = FileScanStatus(raw_status)
        except ValueError:
            status = None
    return FileScanRecord(
        user_id=_get_string_attr(item, SCAN_RECORD_USER_ID_ATTR),
        status=status,
        raw_status=raw_status,
    )


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


def _resolve_status(
    record: FileScanRecord, pending_file_id: uuid.UUID, user_id: uuid.UUID
) -> FileScanStatus | None:
    """Return the record's status, or log and return None to end the stream."""
    if record.status is not None:
        return record.status

    if record.raw_status is None:
        logger.warning(
            "Scan record missing status attribute, ending stream",
            extra={"pending_file_id": pending_file_id, "user_id": user_id},
        )
    else:
        logger.warning(
            "Unable to parse file scan status from record, ending stream",
            extra={
                "pending_file_id": pending_file_id,
                "user_id": user_id,
                "raw_status": record.raw_status,
            },
        )
    return None


def _fetch_next_record(
    dynamodb_client: DynamoDBClient,
    table_name: str,
    pending_file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> FileScanRecord | None:
    """Re-query the scan record for the next poll iteration.

    Returns the record if it still exists and still belongs to ``user_id``;
    otherwise logs and returns None to signal that the stream should end.
    """
    next_record = _get_scan_record(dynamodb_client, table_name, pending_file_id)
    if next_record is None:
        logger.info(
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


def stream_file_scan_results(
    pending_file_id: uuid.UUID,
    user: User,
    dynamodb_client: DynamoDBClient,
    config: FileScanStreamConfig | None = None,
    dynamodb_config: DynamoDBConfig | None = None,
) -> Iterator[dict[str, Any]]:
    """Stream file scan status updates for the given pending file.

    The initial DynamoDB lookup happens before any chunks are yielded so we can
    return a 404 or 403 with the proper HTTP status. After streaming starts, any
    subsequent error (missing record, user mismatch) just ends the stream.

    Yields chunks shaped like ``FileScanResultsResponseSchema``; the caller is
    responsible for serializing each chunk through that schema.
    """
    if config is None:
        config = FileScanStreamConfig()
    if dynamodb_config is None:
        dynamodb_config = DynamoDBConfig()

    table_name = dynamodb_config.file_scan_cache_table_name

    # First lookup happens outside the generator so that 404/403 results in a
    # proper HTTP status code rather than a truncated stream.
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

    def generate() -> Iterator[dict[str, Any]]:
        current_record = record
        start_time = datetime_util.utcnow()

        while True:
            status = _resolve_status(current_record, pending_file_id, user.user_id)
            if status is None:
                return

            yield {"data": {"status": status.value}}

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

            next_record = _fetch_next_record(
                dynamodb_client, table_name, pending_file_id, user.user_id
            )
            if next_record is None:
                return

            current_record = next_record

    return generate()
