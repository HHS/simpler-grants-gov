"""Refresh the ClamAV signature database on EFS."""

import json
import os
import subprocess
from pathlib import Path

CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")
FRESHCLAM_BIN = "/opt/bin/freshclam"
CONFIG_PATH = Path("/tmp/freshclam.conf")

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

    # freshclam exit codes: 0 = updated or already current,
    # anything else = failure of some kind.
    outcome = "updated" if completed.returncode == 0 else "failed"
    result = {
        "outcome": outcome,
        "freshclam_exit_code": completed.returncode,
        "freshclam_stdout": completed.stdout.strip(),
        "freshclam_stderr": completed.stderr.strip(),
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
