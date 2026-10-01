"""Refresh the ClamAV signature database on EFS."""

import json
import os
import shutil
import subprocess
from pathlib import Path

CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")
FRESHCLAM_BIN = "/opt/bin/freshclam"
CONFIG_PATH = Path("/tmp/freshclam.conf")

# A test-only hash signature for testing
TEST_SIGNATURE_FILENAME = "simpler-test.hdb"
TEST_SIGNATURE_SOURCE = Path(__file__).parent / TEST_SIGNATURE_FILENAME

# Fail fast at cold start if the layer is missing the binary.
if not Path(FRESHCLAM_BIN).exists():
    raise RuntimeError(
        f"freshclam binary not found at {FRESHCLAM_BIN}; layer build is missing or corrupted"
    )


class FreshclamError(Exception):
    """Raised when freshclam exits non-zero. Re-raised from the handler
    so Lambda reports an error and the alerts alarm fires."""


def lambda_handler(event, context):
    Path(CLAMAV_DB_DIR).mkdir(parents=True, exist_ok=True)
    _write_config()

    completed = subprocess.run(
        [FRESHCLAM_BIN, f"--config-file={CONFIG_PATH}", "--stdout"],
        capture_output=True,
        text=True,
        check=False,
    )

    # Install the test signature before enumerating the DB below so it shows
    # up in database_files.
    test_signature_installed = _install_test_signature()

    # freshclam exit codes: 0 = updated or already current,
    # anything else = failure of some kind.
    outcome = "updated" if completed.returncode == 0 else "failed"
    result = {
        "outcome": outcome,
        "freshclam_exit_code": completed.returncode,
        "freshclam_stdout": completed.stdout.strip(),
        "freshclam_stderr": completed.stderr.strip(),
        "test_signature_installed": test_signature_installed,
        "database_files": [
            {"name": p.name, "size_bytes": p.stat().st_size}
            for p in sorted(Path(CLAMAV_DB_DIR).iterdir())
            if p.is_file()
        ],
    }
    print(json.dumps(result), flush=True)

    if completed.returncode != 0:
        raise FreshclamError(
            f"freshclam exited {completed.returncode}: {completed.stderr.strip()!r}"
        )

    return result


def _install_test_signature():
    """Copy the bundled test-only hash signature into the signature DB so the
    scanner flags the harmless fixture (testdata/lorem-infected.txt) as
    infected. Runs on every refresh in every environment. Returns the
    destination path for logging. CLAMAV_DB_DIR already exists (the handler
    creates it before calling this)."""
    if not TEST_SIGNATURE_SOURCE.exists():
        raise FreshclamError(
            f"bundled test signature {TEST_SIGNATURE_SOURCE} is missing from "
            f"the deployment package"
        )
    destination = Path(CLAMAV_DB_DIR) / TEST_SIGNATURE_FILENAME
    shutil.copyfile(TEST_SIGNATURE_SOURCE, destination)
    return str(destination)


def _write_config():
    CONFIG_PATH.write_text(
        "\n".join(
            [
                f"DatabaseDirectory {CLAMAV_DB_DIR}",
                "DatabaseMirror database.clamav.net",
                "DatabaseOwner root",
                "Foreground yes",
                "UpdateLogFile /tmp/freshclam.log",
                "",
            ]
        )
    )
