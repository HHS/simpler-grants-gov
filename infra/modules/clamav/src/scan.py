"""Scan files uploaded to the file-scan S3 bucket with ClamAV and report results.

Triggered by S3 ObjectCreated events under the unscanned/ prefix. Each object
carries the originating file id and user id as S3 user-metadata
(x-amz-meta-file-id / x-amz-meta-user-id), written by the API when it hands out
the presigned upload URL.

For each triggering object the scanner:

  1. Reads file-id / user-id from the object metadata. If either is absent we
     log an error and stop -- nothing downstream can correlate the result, and
     a retry can't make the metadata appear.
  2. Marks the DynamoDB scan-cache record ``in_progress``.
  3. Runs clamscan against the downloaded object.
  4. Copies the object to scanned/ (clean) or infected/ (virus found).
  5. Reports the outcome to the API (POST /v1/files/<file_id>) and *then*
     updates the DynamoDB record to the terminal status. The API call lands
     first so the database has processed the file before the cache flips to a
     terminal status that the upload client is polling on.
  6. Deletes the unscanned/ source only after both the API and DynamoDB have
     been updated. Until then the source object stays put, so a failure in any
     of the steps above replays cleanly on Lambda's async retry: the copy,
     the API call, and the DynamoDB write are all idempotent.

The signature database lives on EFS at CLAMAV_DB_DIR and is refreshed
out-of-band by the freshclam Lambda.

Behavior on failure:
  - Files larger than MAX_FILE_SIZE_BYTES are not downloaded; they can't be
    certified clean, so they are quarantined to infected/ rather than passed.
  - A clamscan execution error (exit code >= 2, as opposed to a virus hit) is
    raised so Lambda retries the event and, after the retry budget, routes the
    original S3 payload to the DLQ for manual replay.
  - Duplicate S3 deliveries for a key whose source has already been moved are
    treated as already-processed (no-op).
"""

import json
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
dynamodb = boto3.client("dynamodb")

UNSCANNED_PREFIX = os.environ.get("UNSCANNED_PREFIX", "unscanned/")
SCANNED_PREFIX = os.environ.get("SCANNED_PREFIX", "scanned/")
INFECTED_PREFIX = os.environ.get("INFECTED_PREFIX", "infected/")
CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")
MAX_FILE_SIZE_BYTES = int(os.environ.get("MAX_FILE_SIZE_BYTES", "471859200"))

# File-scan callback API. FILE_SCAN_API_KEY authenticates as the internal
# scanner user (INTERNAL_S3_SCAN privilege) via the X-API-Key header.
API_BASE_URL = os.environ.get("API_BASE_URL", "")
FILE_SCAN_API_KEY = os.environ.get("FILE_SCAN_API_KEY", "")
API_TIMEOUT_SECONDS = int(os.environ.get("API_TIMEOUT_SECONDS", "30"))

# DynamoDB scan-cache the upload client polls for status. Same table/format the
# API writes on upload (file_id / user_id / status as string attributes).
FILE_SCAN_CACHE_TABLE_NAME = os.environ.get("FILE_SCAN_CACHE_TABLE_NAME", "")

# S3 user-metadata keys. boto3 returns these under head_object()["Metadata"]
# with the x-amz-meta- prefix stripped and the name lower-cased.
FILE_ID_METADATA_KEY = "file-id"
USER_ID_METADATA_KEY = "user-id"

# Layer drops binaries at /opt/bin and libs at /opt/lib — Lambda adds both
# to PATH and LD_LIBRARY_PATH automatically.
CLAMSCAN_BIN = "/opt/bin/clamscan"

# Fail fast at cold start rather than discovering a bad layer mid-scan,
# where the error surfaces as a confusing subprocess failure.
if not Path(CLAMSCAN_BIN).exists():
    raise RuntimeError(
        f"ClamAV binary not found at {CLAMSCAN_BIN}; layer build is missing or corrupted"
    )

# Scan statuses, mirroring the API's FileScanStatus values. The scanner only
# ever sets these three: in_progress on start, then complete or infected.
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETE = "complete"
STATUS_INFECTED = "infected"

# clamscan exit codes: 0 = clean, 1 = virus found, 2 = scanning error.
_STATUS_BY_EXIT = {0: STATUS_COMPLETE, 1: STATUS_INFECTED}

# Clean files go to scanned/, anything quarantined goes to infected/.
_TERMINAL_PREFIX = {STATUS_COMPLETE: SCANNED_PREFIX, STATUS_INFECTED: INFECTED_PREFIX}

# S3 error codes returned when an object has already been moved/deleted —
# treat as "duplicate event after successful scan".
_MISSING_OBJECT_CODES = {"404", "NoSuchKey"}


class ScanError(Exception):
    """Raised on transient or unrecoverable scan errors. Surfacing the
    exception lets Lambda's async retry replay the event, and routes the
    original S3 payload to the DLQ after retries are exhausted."""


def lambda_handler(event, context):
    results = []
    deferred_error = None
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = unquote_plus(record["s3"]["object"]["key"])

        try:
            result = _process_record(bucket, key)
        except Exception as err:
            result = {
                "outcome": "error",
                "bucket": bucket,
                "source_key": key,
                "error": str(err),
                "error_type": type(err).__name__,
            }
            deferred_error = err

        _log(result)
        results.append(result)

    if deferred_error is not None:
        raise deferred_error

    return {"results": results}


def _process_record(bucket, key):
    if not key.startswith(UNSCANNED_PREFIX):
        return {
            "outcome": "skipped",
            "reason": "key outside unscanned prefix",
            "bucket": bucket,
            "source_key": key,
        }

    try:
        head = s3.head_object(Bucket=bucket, Key=key)
    except ClientError as err:
        if err.response.get("Error", {}).get("Code") in _MISSING_OBJECT_CODES:
            # Duplicate event after a prior scan already moved this object.
            return {
                "outcome": "skipped",
                "reason": "source object no longer exists (duplicate event)",
                "bucket": bucket,
                "source_key": key,
            }
        raise

    metadata = head.get("Metadata", {})
    file_id = metadata.get(FILE_ID_METADATA_KEY)
    user_id = metadata.get(USER_ID_METADATA_KEY)
    if not file_id or not user_id:
        # Without both ids nothing downstream can correlate the result. Stop:
        # don't raise (a retry won't make the metadata appear) and don't move
        # the object (we have nowhere to report it to). The source is left in
        # unscanned/ for operators to inspect.
        return {
            "outcome": "error",
            "reason": "missing file-id or user-id metadata",
            "bucket": bucket,
            "source_key": key,
            "has_file_id": bool(file_id),
            "has_user_id": bool(user_id),
        }

    if not _database_ready():
        raise ScanError(
            f"signature database not yet populated on EFS for {bucket}/{key}"
        )

    _set_scan_status(file_id, user_id, STATUS_IN_PROGRESS)

    size_bytes = head.get("ContentLength") or 0
    status, scan_detail = _determine_status(bucket, key, size_bytes)

    destination_key = _TERMINAL_PREFIX[status] + key[len(UNSCANNED_PREFIX) :]

    # Copy (not move) to the terminal prefix. The source is deleted only after
    # the API and DynamoDB have both been updated, so any failure below replays
    # cleanly on retry.
    _copy_object(bucket, key, destination_key, tag_status=status)
    file_location = f"s3://{bucket}/{destination_key}"

    # API first, DynamoDB second: the database must have processed the file
    # before the cache flips to a terminal status the upload client polls on.
    _report_result_to_api(file_id, file_location, status)
    _set_scan_status(file_id, user_id, status)

    # Both downstream systems are updated; safe to drop the unscanned source.
    _delete_object(bucket, key)

    return {
        "outcome": status,
        "bucket": bucket,
        "source_key": key,
        "destination_key": destination_key,
        "file_location": file_location,
        "file_id": file_id,
        "size_bytes": size_bytes,
        **scan_detail,
    }


def _determine_status(bucket, key, size_bytes):
    """Return ``(status, detail)`` for the object. ``status`` is one of the
    terminal scan statuses; ``detail`` carries clamscan output for logging."""
    if size_bytes > MAX_FILE_SIZE_BYTES:
        # Too large to pull into /tmp for scanning. We can't certify it clean,
        # so quarantine it as infected rather than letting it through.
        return STATUS_INFECTED, {
            "reason": "object exceeds scanner size threshold",
            "size_bytes": size_bytes,
            "max_file_size_bytes": MAX_FILE_SIZE_BYTES,
        }

    return _scan_object(bucket, key)


def _scan_object(bucket, key):
    local_path = Path("/tmp") / Path(key).name
    s3.download_file(bucket, key, str(local_path))

    try:
        completed = subprocess.run(
            [
                CLAMSCAN_BIN,
                "--no-summary",
                "--database",
                CLAMAV_DB_DIR,
                str(local_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        local_path.unlink(missing_ok=True)

    status = _STATUS_BY_EXIT.get(completed.returncode)
    if status is None:
        # clamscan exit code >= 2 means the scanner itself failed, not that
        # the file is infected. Raise so the event retries and eventually
        # lands on the DLQ for manual replay.
        raise ScanError(
            f"clamscan failed for {bucket}/{key} "
            f"(exit={completed.returncode}, stderr={completed.stderr.strip()!r})"
        )

    return status, {
        "clamscan_exit_code": completed.returncode,
        "clamscan_stdout": completed.stdout.strip(),
        "clamscan_stderr": completed.stderr.strip(),
    }


def _set_scan_status(file_id, user_id, status):
    """Upsert the scan-cache record. PutItem is unconditional, so this both
    creates and overwrites — matching how the API seeds the record on upload."""
    if not FILE_SCAN_CACHE_TABLE_NAME:
        raise ScanError("FILE_SCAN_CACHE_TABLE_NAME is not configured")

    dynamodb.put_item(
        TableName=FILE_SCAN_CACHE_TABLE_NAME,
        Item={
            "file_id": {"S": file_id},
            "user_id": {"S": user_id},
            "status": {"S": status},
        },
    )


def _report_result_to_api(file_id, file_location, status):
    """POST the scan result to the file-scan callback. The API verifies the
    file exists at file_location, which is why the copy happens first."""
    if not API_BASE_URL:
        raise ScanError("API_BASE_URL is not configured")
    if not FILE_SCAN_API_KEY:
        raise ScanError("FILE_SCAN_API_KEY is not configured")

    url = f"{API_BASE_URL.rstrip('/')}/v1/files/{file_id}"
    body = json.dumps(
        {"file_scan_status": status, "file_location": file_location}
    ).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": FILE_SCAN_API_KEY,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=API_TIMEOUT_SECONDS) as response:
            status_code = response.status
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        raise ScanError(
            f"file-scan callback returned HTTP {err.code} for file {file_id}: {detail}"
        ) from err
    except urllib.error.URLError as err:
        raise ScanError(
            f"file-scan callback request failed for file {file_id}: {err.reason}"
        ) from err

    if not 200 <= status_code < 300:
        raise ScanError(
            f"file-scan callback returned HTTP {status_code} for file {file_id}"
        )


def _database_ready():
    """Freshclam writes main.cvd / daily.cvd / bytecode.cvd (or .cld). Treat
    the DB as present if any signature file exists."""
    db = Path(CLAMAV_DB_DIR)
    if not db.is_dir():
        return False
    return any(db.glob("*.cvd")) or any(db.glob("*.cld"))


def _copy_object(bucket, source_key, destination_key, tag_status):
    # Tag the destination so downstream consumers (and humans) can see the
    # scan outcome without inspecting key prefixes alone. MetadataDirective
    # defaults to COPY, so the file-id / user-id user-metadata is preserved.
    s3.copy_object(
        Bucket=bucket,
        Key=destination_key,
        CopySource={"Bucket": bucket, "Key": source_key},
        Tagging=f"scan-status={tag_status}",
        TaggingDirective="REPLACE",
    )


def _delete_object(bucket, key):
    try:
        s3.delete_object(Bucket=bucket, Key=key)
    except ClientError as err:
        # Already gone (e.g. a concurrent duplicate event deleted it) — fine.
        if err.response.get("Error", {}).get("Code") in _MISSING_OBJECT_CODES:
            return
        raise


def _log(payload):
    print(json.dumps(payload), flush=True)
