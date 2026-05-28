"""Scan files uploaded to the file-scan S3 bucket with ClamAV.

Triggered by S3 ObjectCreated events under the unscanned/ prefix. Clean
files are moved to scanned/, infected files to scan-failed/. The signature
database lives on EFS at CLAMAV_DB_DIR and is refreshed out-of-band by the
freshclam Lambda.

Behavior on failure:
  - Files larger than MAX_FILE_SIZE_BYTES are not downloaded; they are
    moved to the failed prefix with a ``too_large`` outcome.
  - Duplicate S3 deliveries for a key whose source has already been
    moved are treated as already-processed (no-op).
"""

import json
import os
import subprocess
from pathlib import Path
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")

UNSCANNED_PREFIX = os.environ.get("UNSCANNED_PREFIX", "unscanned/")
SCANNED_PREFIX = os.environ.get("SCANNED_PREFIX", "scanned/")
FAILED_PREFIX = os.environ.get("FAILED_PREFIX", "scan-failed/")
CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")
MAX_FILE_SIZE_BYTES = int(os.environ.get("MAX_FILE_SIZE_BYTES", "471859200"))

# Layer drops binaries at /opt/bin and libs at /opt/lib — Lambda adds both
# to PATH and LD_LIBRARY_PATH automatically.
CLAMSCAN_BIN = "/opt/bin/clamscan"

# Fail fast at cold start rather than discovering a bad layer mid-scan,
# where the error surfaces as a confusing subprocess failure.
if not Path(CLAMSCAN_BIN).exists():
    raise RuntimeError(
        f"ClamAV binary not found at {CLAMSCAN_BIN}; layer build is missing or corrupted"
    )

# clamscan exit codes: 0 = clean, 1 = virus found, 2 = scanning error.
_OUTCOME_BY_EXIT = {0: "clean", 1: "infected"}

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

    if not _database_ready():
        raise ScanError(
            f"signature database not yet populated on EFS for {bucket}/{key}"
        )

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

    size_bytes = head.get("ContentLength") or 0
    if size_bytes > MAX_FILE_SIZE_BYTES:
        destination_key = FAILED_PREFIX + key[len(UNSCANNED_PREFIX) :]
        _move_object(bucket, key, destination_key, tag_status="too_large")
        return {
            "outcome": "too_large",
            "reason": "object exceeds scanner size threshold",
            "bucket": bucket,
            "source_key": key,
            "destination_key": destination_key,
            "size_bytes": size_bytes,
            "max_file_size_bytes": MAX_FILE_SIZE_BYTES,
        }

    return _scan_object(bucket, key, size_bytes)


def _database_ready():
    """Freshclam writes main.cvd / daily.cvd / bytecode.cvd (or .cld). Treat
    the DB as present if any signature file exists."""
    db = Path(CLAMAV_DB_DIR)
    if not db.is_dir():
        return False
    return any(db.glob("*.cvd")) or any(db.glob("*.cld"))


def _scan_object(bucket, key, size_bytes):
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

    outcome = _OUTCOME_BY_EXIT.get(completed.returncode)
    if outcome is None:
        # clamscan exit code >=2 means the scanner itself failed, not that
        # the file is infected. Raise so the event retries and eventually
        # lands on the DLQ for manual replay.
        raise ScanError(
            f"clamscan failed for {bucket}/{key} "
            f"(exit={completed.returncode}, stderr={completed.stderr.strip()!r})"
        )

    destination_prefix = SCANNED_PREFIX if outcome == "clean" else FAILED_PREFIX
    destination_key = destination_prefix + key[len(UNSCANNED_PREFIX) :]
    _move_object(bucket, key, destination_key, tag_status=outcome)

    return {
        "outcome": outcome,
        "bucket": bucket,
        "source_key": key,
        "destination_key": destination_key,
        "size_bytes": size_bytes,
        "clamscan_exit_code": completed.returncode,
        "clamscan_stdout": completed.stdout.strip(),
        "clamscan_stderr": completed.stderr.strip(),
    }


def _move_object(bucket, source_key, destination_key, tag_status):
    # Tag the destination so downstream consumers (and humans) can see the
    # scan outcome without inspecting key prefixes alone.
    s3.copy_object(
        Bucket=bucket,
        Key=destination_key,
        CopySource={"Bucket": bucket, "Key": source_key},
        Tagging=f"scan-status={tag_status}",
        TaggingDirective="REPLACE",
    )
    try:
        s3.delete_object(Bucket=bucket, Key=source_key)
    except ClientError as err:
        # If delete fails the source remains and could be redelivered to
        # the scanner. The destination already has scan-status, so a
        # duplicate run is wasteful but not incorrect. Re-raise so Lambda
        # retries (and eventually DLQs) rather than silently leaking a
        # duplicate object.
        if err.response.get("Error", {}).get("Code") in _MISSING_OBJECT_CODES:
            return
        raise


def _log(payload):
    print(json.dumps(payload), flush=True)
