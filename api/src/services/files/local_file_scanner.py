import json
import logging
import threading
import time
import uuid
from pathlib import Path
from typing import Any

import grants_shared.adapters.db as db
import grants_shared.util.file_util as file_util
from grants_shared.adapters.aws.dynamodb_adapter import DynamoDBClient, DynamoDBConfig
from grants_shared.adapters.aws.s3_adapter import S3Config
from pydantic import Field
from sqlalchemy import select

from src.constants.lookup_constants import FileScanStatus
from src.db.models.file_upload_models import PendingFile
from src.db.models.user_models import User
from src.services.files.update_pending_file_scan_status import update_pending_file_scan_status
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


# Scenarios encoded in the s3 key so local developers can exercise the
# non-happy paths without needing a real virus scanner.
SCENARIO_INFECTED = "scenario-infected"
SCENARIO_WAIT_10S = "scenario-wait10s"

UNSCANNED_PREFIX = "unscanned/"
INFECTED_PREFIX = "infected/"
SCANNED_PREFIX = "scanned/"

# Every terminal status moves the file out of unscanned/
# Clean files to scanned/, infected ones to a quarantine prefix.
TERMINAL_STATUS_PREFIX: dict[FileScanStatus, str] = {
    FileScanStatus.COMPLETE: SCANNED_PREFIX,
    FileScanStatus.INFECTED: INFECTED_PREFIX,
}

# s3mock writes this file alongside each object after the upload completes,
# which is what we use as the signal that a file is ready to be scanned.
S3MOCK_METADATA_FILENAME = "objectMetadata.json"

LOCAL_FILE_SCANNER_THREAD_NAME = "local-file-scanner"


class _EnvironmentConfig(PydanticBaseEnvConfig):
    """Subset of env vars we need to read in every environment to decide
    whether to even instantiate the rest of the scanner config."""

    environment: str | None = Field(default=None, alias="ENVIRONMENT")
    # The Flask reloader sets this to "true" only in its worker child; the
    # parent process gets the var unset.
    werkzeug_run_main: str | None = Field(default=None, alias="WERKZEUG_RUN_MAIN")


class LocalFileScannerConfig(PydanticBaseEnvConfig):
    # Required (not defaulted) so a misconfigured local env explodes early
    # rather than silently spawning (or not spawning) the scanner thread.
    enable_local_file_scanner: bool = Field(alias="ENABLE_LOCAL_FILE_SCANNER")
    # Path the api container can read s3mock's on-disk store from.
    local_s3_store_path: str = Field(alias="LOCAL_S3_STORE_PATH")
    # Pause this long after a metadata change before reading s3mock's file,
    # so we don't catch a slow / multi-part upload mid-write. We have no
    # signal from the file system that tells us the upload is "done".
    pre_process_delay_seconds: float = Field(alias="LOCAL_FILE_SCANNER_PRE_PROCESS_DELAY_SECONDS")
    # How long the scenario-wait10s path sleeps between in_progress and the
    # final terminal status. Configurable so tests can set it to zero.
    wait_scenario_delay_seconds: float = Field(
        alias="LOCAL_FILE_SCANNER_WAIT_SCENARIO_DELAY_SECONDS"
    )
    # User the scanner authenticates as when calling the file-scan callback
    # service. Must hold the INTERNAL_S3_SCAN privilege.
    file_scanner_user_id: uuid.UUID = Field(alias="LOCAL_FILE_SCANNER_USER_ID")


def setup_local_file_scanner() -> None:
    """Start a background thread that mocks the s3 virus-scanning lambda.

    Runs only when ENVIRONMENT=local, ENABLE_LOCAL_FILE_SCANNER=TRUE, and
    WERKZEUG_RUN_MAIN=true. The Flask reloader sets that last env var in its
    worker child only -- gating on it prevents the parent from starting a
    second copy of the thread.
    """
    env = _EnvironmentConfig()
    if env.environment != "local":
        return

    config = LocalFileScannerConfig()
    if not config.enable_local_file_scanner:
        return

    if env.werkzeug_run_main != "true":
        return

    s3_config = S3Config()
    bucket_name = file_util.get_s3_bucket(s3_config.file_scan_bucket_path)
    watch_path = Path(config.local_s3_store_path) / bucket_name
    watch_path.mkdir(parents=True, exist_ok=True)

    logger.info(
        "Starting local file scanner background thread",
        extra={"watch_path": watch_path},
    )

    thread = threading.Thread(
        target=_run_scanner,
        args=(watch_path,),
        name=LOCAL_FILE_SCANNER_THREAD_NAME,
        daemon=True,
    )
    thread.start()


def _run_scanner(watch_path: Path) -> None:
    # Imported inline because watchfiles is a dev-only dependency
    from watchfiles import Change, watch

    db_client = db.PostgresDBClient()

    # force_polling makes the watcher work across Docker bind mounts on macOS
    # and Windows, where native inotify events do not propagate from the host.
    for changes in watch(str(watch_path), force_polling=True):
        for change_type, file_path in changes:
            if change_type == Change.deleted:
                continue
            if not file_path.endswith(S3MOCK_METADATA_FILENAME):
                continue
            _spawn_worker(file_path, db_client)


def _spawn_worker(metadata_file_path: str, db_client: db.DBClient) -> None:
    # Run each scan in its own daemon thread so a wait10s scenario doesn't
    # block the watch loop from picking up other files.
    worker = threading.Thread(
        target=_safe_process_metadata_change,
        args=(metadata_file_path, db_client),
        daemon=True,
    )
    worker.start()


def _safe_process_metadata_change(metadata_file_path: str, db_client: db.DBClient) -> None:
    try:
        config = LocalFileScannerConfig()
        time.sleep(config.pre_process_delay_seconds)
        process_metadata_change(metadata_file_path, db_client)
    except Exception:
        logger.exception(
            "Local file scanner failed to process metadata change",
            extra={"metadata_file_path": metadata_file_path},
        )


def process_metadata_change(metadata_file_path: str, db_client: db.DBClient) -> None:
    metadata = _read_metadata(metadata_file_path)
    if metadata is None:
        return

    s3_key = metadata.get("key")
    if not isinstance(s3_key, str) or not s3_key.startswith(UNSCANNED_PREFIX):
        return

    pending_file_id = _extract_pending_file_id(s3_key)
    if pending_file_id is None:
        logger.warning(
            "Local file scanner could not parse pending_file_id from s3 key",
            extra={"s3_key": s3_key},
        )
        return

    log_extra: dict[str, Any] = {"pending_file_id": pending_file_id, "s3_key": s3_key}
    scenario = _detect_scenario(s3_key)
    final_status = (
        FileScanStatus.INFECTED if scenario == SCENARIO_INFECTED else FileScanStatus.COMPLETE
    )

    logger.info(
        "Local file scanner processing file",
        extra={**log_extra, "scenario": scenario},
    )

    bucket_path = S3Config().file_scan_bucket_path
    unscanned_location = f"{bucket_path}/{s3_key}"

    if scenario == SCENARIO_WAIT_10S:
        _apply_status(
            db_client, pending_file_id, FileScanStatus.IN_PROGRESS, unscanned_location, log_extra
        )
        time.sleep(LocalFileScannerConfig().wait_scenario_delay_seconds)

    terminal_location = _move_to_terminal_prefix(bucket_path, s3_key, final_status)
    _apply_status(db_client, pending_file_id, final_status, terminal_location, log_extra)

    logger.info(
        "Local file scanner finished scanning file",
        extra={**log_extra, "file_scan_status": final_status, "scenario": scenario},
    )


def _read_metadata(metadata_file_path: str) -> dict[str, Any] | None:
    try:
        with open(metadata_file_path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        # s3mock may rewrite this file in place; if we caught it mid-write,
        # the next change event will trigger us again with the final contents.
        logger.warning(
            "Local file scanner could not read s3 metadata file",
            extra={"metadata_file_path": metadata_file_path},
        )
        return None


def _extract_pending_file_id(s3_key: str) -> uuid.UUID | None:
    # Presigned URL puts files at unscanned/{file_id}/{file_name}.
    parts = s3_key.split("/")
    if len(parts) < 3:
        return None
    try:
        return uuid.UUID(parts[1])
    except ValueError:
        return None


def _detect_scenario(s3_key: str) -> str | None:
    if SCENARIO_INFECTED in s3_key:
        return SCENARIO_INFECTED
    if SCENARIO_WAIT_10S in s3_key:
        return SCENARIO_WAIT_10S
    return None


def _apply_status(
    db_client: db.DBClient,
    pending_file_id: uuid.UUID,
    status: FileScanStatus,
    file_location: str,
    log_extra: dict[str, Any],
) -> None:
    user_id = _update_pending_file_status(
        db_client, pending_file_id, status, file_location, log_extra
    )
    if user_id is None:
        return
    _write_dynamodb_status(pending_file_id, user_id, status)
    logger.info(
        "Local file scanner applied scan status",
        extra={**log_extra, "file_scan_status": status},
    )


def _update_pending_file_status(
    db_client: db.DBClient,
    pending_file_id: uuid.UUID,
    status: FileScanStatus,
    file_location: str,
    log_extra: dict[str, Any],
) -> uuid.UUID | None:
    """Update the pending_file row via the shared service function.

    Returns the uploader's user_id (for the DynamoDB record), or None when
    the row is missing or the scanner user is misconfigured.
    """
    config = LocalFileScannerConfig()
    uploader_user_id: uuid.UUID | None = None
    with db_client.get_session() as db_session, db_session.begin():
        scanner_user = db_session.execute(
            select(User).where(User.user_id == config.file_scanner_user_id)
        ).scalar_one_or_none()
        if scanner_user is None:
            logger.error(
                "Local file scanner user not found",
                extra={**log_extra, "scanner_user_id": config.file_scanner_user_id},
            )
            return None

        # Pre-check so a missing file is a warning, not the 404 the service would raise
        pending_file = db_session.execute(
            select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
        ).scalar_one_or_none()
        if pending_file is None:
            logger.warning(
                "Local file scanner could not find pending file row",
                extra=log_extra,
            )
            return None

        uploader_user_id = pending_file.user_id
        update_pending_file_scan_status(
            db_session, pending_file_id, status, file_location, scanner_user
        )
    return uploader_user_id


def _write_dynamodb_status(
    pending_file_id: uuid.UUID, user_id: uuid.UUID, status: FileScanStatus
) -> None:
    dynamodb_config = DynamoDBConfig()
    dynamodb_client = DynamoDBClient()
    dynamodb_client.put_item(
        table_name=dynamodb_config.file_scan_cache_table_name,
        item={
            "file_id": {"S": str(pending_file_id)},
            "user_id": {"S": str(user_id)},
            "status": {"S": status.value},
        },
    )


def _move_to_terminal_prefix(bucket_path: str, s3_key: str, status: FileScanStatus) -> str:
    destination_key = TERMINAL_STATUS_PREFIX[status] + s3_key[len(UNSCANNED_PREFIX) :]
    destination_path = f"{bucket_path}/{destination_key}"
    file_util.move_file(f"{bucket_path}/{s3_key}", destination_path)
    return destination_path
