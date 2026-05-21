import json
import logging
import time
import uuid
from collections.abc import Iterator

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


def _get_scan_record(
    dynamodb_client: DynamoDBClient,
    table_name: str,
    pending_file_id: uuid.UUID,
) -> dict | None:
    response = dynamodb_client.get_item(
        table_name=table_name,
        key_name=SCAN_RECORD_FILE_ID_KEY,
        value=str(pending_file_id),
        consistent_read=True,
    )
    return response.item


def _get_string_attr(record: dict, attr: str) -> str | None:
    # DynamoDB returns items in attribute-value format: {"attr": {"S": "value"}}.
    # We only need the string-typed attributes on the scan record.
    raw = record.get(attr)
    if not isinstance(raw, dict):
        return None
    return raw.get("S")


def stream_file_scan_results(
    pending_file_id: uuid.UUID,
    user: User,
    dynamodb_client: DynamoDBClient,
    config: FileScanStreamConfig | None = None,
    dynamodb_config: DynamoDBConfig | None = None,
) -> Iterator[str]:
    """Stream file scan status updates for the given pending file.

    The initial DynamoDB lookup happens before any chunks are yielded so we can
    return a 404 or 403 with the proper HTTP status. After streaming starts, any
    subsequent error (missing record, user mismatch) just ends the stream.
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

    record_user_id = _get_string_attr(record, SCAN_RECORD_USER_ID_ATTR)
    if record_user_id != str(user.user_id):
        logger.info(
            "User attempted to access another user's file scan results",
            extra={
                "pending_file_id": pending_file_id,
                "user_id": user.user_id,
                "record_user_id": record_user_id,
            },
        )
        raise_flask_error(403, "Forbidden")

    def generate() -> Iterator[str]:
        current_record = record
        start_time = datetime_util.utcnow()

        while True:
            raw_status = _get_string_attr(current_record, SCAN_RECORD_STATUS_ATTR)
            if raw_status is None:
                logger.warning(
                    "Scan record missing status attribute, ending stream",
                    extra={"pending_file_id": pending_file_id},
                )
                return

            try:
                status = FileScanStatus(raw_status)
            except ValueError:
                logger.warning(
                    "Unable to parse file scan status from record, ending stream",
                    extra={
                        "pending_file_id": pending_file_id,
                        "raw_status": raw_status,
                    },
                )
                return

            yield json.dumps({"data": {"status": status.value}}) + "\n"

            if status in TERMINAL_STATUSES:
                logger.info(
                    "File scan results stream reached terminal status",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                        "file_scan_status": status,
                    },
                )
                return

            elapsed = (datetime_util.utcnow() - start_time).total_seconds()
            if elapsed >= config.max_duration_seconds:
                logger.info(
                    "File scan results stream reached max duration",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                        "last_file_scan_status": status,
                    },
                )
                return

            time.sleep(config.poll_interval_seconds)

            next_record = _get_scan_record(dynamodb_client, table_name, pending_file_id)
            if next_record is None or _get_string_attr(
                next_record, SCAN_RECORD_USER_ID_ATTR
            ) != str(user.user_id):
                logger.info(
                    "File scan record disappeared or user no longer authorized, ending stream",
                    extra={
                        "pending_file_id": pending_file_id,
                        "user_id": user.user_id,
                    },
                )
                return

            current_record = next_record

    return generate()
