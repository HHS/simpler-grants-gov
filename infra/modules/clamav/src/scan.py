"""Scan files uploaded to the file-scan S3 bucket with ClamAV.

Triggered by S3 ObjectCreated events under the unscanned/ prefix. Clean
files are moved to scanned/, infected or errored files are moved to
scan-failed/. The signature database lives on EFS at CLAMAV_DB_DIR and is
refreshed out-of-band by the freshclam Lambda. Each scan emits a single
JSON log line for CloudWatch Logs Insights.
"""

import json
import os
import subprocess
from pathlib import Path
from urllib.parse import unquote_plus

import boto3

s3 = boto3.client("s3")

UNSCANNED_PREFIX = os.environ.get("UNSCANNED_PREFIX", "unscanned/")
SCANNED_PREFIX = os.environ.get("SCANNED_PREFIX", "scanned/")
FAILED_PREFIX = os.environ.get("FAILED_PREFIX", "scan-failed/")
CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")

# Layer drops binaries at /opt/bin and libs at /opt/lib — Lambda adds both
# to PATH and LD_LIBRARY_PATH automatically.
CLAMSCAN_BIN = "/opt/bin/clamscan"

# clamscan exit codes: 0 = clean, 1 = virus found, 2 = scanning error.
_OUTCOME_BY_EXIT = {0: "clean", 1: "infected"}


def lambda_handler(event, context):
    results = []
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = unquote_plus(record["s3"]["object"]["key"])

        if not key.startswith(UNSCANNED_PREFIX):
            result = {
                "outcome": "skipped",
                "reason": "key outside unscanned prefix",
                "bucket": bucket,
                "source_key": key,
            }
        elif not _database_ready():
            result = {
                "outcome": "skipped",
                "reason": "signature database not yet populated on EFS",
                "bucket": bucket,
                "source_key": key,
            }
        else:
            result = _scan_object(bucket, key)

        _log(result)
        results.append(result)

    return {"results": results}


def _database_ready():
    """Freshclam writes main.cvd / daily.cvd / bytecode.cvd (or .cld). Treat
    the DB as present if any signature file exists."""
    db = Path(CLAMAV_DB_DIR)
    if not db.is_dir():
        return False
    return any(db.glob("*.cvd")) or any(db.glob("*.cld"))


def _scan_object(bucket, key):
    local_path = Path("/tmp") / Path(key).name
    s3.download_file(bucket, key, str(local_path))

    try:
        completed = subprocess.run(
            [CLAMSCAN_BIN, "--no-summary", "--database", CLAMAV_DB_DIR, str(local_path)],
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        local_path.unlink(missing_ok=True)

    outcome = _OUTCOME_BY_EXIT.get(completed.returncode, "scan_error")
    destination_prefix = SCANNED_PREFIX if outcome == "clean" else FAILED_PREFIX
    destination_key = destination_prefix + key[len(UNSCANNED_PREFIX):]

    _move_object(bucket, key, destination_key)

    return {
        "outcome": outcome,
        "bucket": bucket,
        "source_key": key,
        "destination_key": destination_key,
        "clamscan_exit_code": completed.returncode,
        "clamscan_stdout": completed.stdout.strip(),
        "clamscan_stderr": completed.stderr.strip(),
    }


def _move_object(bucket, source_key, destination_key):
    s3.copy_object(
        Bucket=bucket,
        Key=destination_key,
        CopySource={"Bucket": bucket, "Key": source_key},
    )
    s3.delete_object(Bucket=bucket, Key=source_key)


def _log(payload):
    print(json.dumps(payload), flush=True)
