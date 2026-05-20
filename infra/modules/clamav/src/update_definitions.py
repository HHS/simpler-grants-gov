"""Refresh the ClamAV signature database on EFS.

Invoked on a schedule by EventBridge. Writes a minimal freshclam.conf to
/tmp (Lambda's only writable non-mounted path), points DatabaseDirectory at
the EFS mount, and runs the freshclam binary from the Lambda layer. Emits
a single JSON log line describing the outcome.
"""

import json
import os
import subprocess
from pathlib import Path

CLAMAV_DB_DIR = os.environ.get("CLAMAV_DB_DIR", "/mnt/clamav")
FRESHCLAM_BIN = "/opt/bin/freshclam"
CONFIG_PATH = Path("/tmp/freshclam.conf")


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
            for p in sorted(Path(CLAMAV_DB_DIR).iterdir()) if p.is_file()
        ],
    }
    print(json.dumps(result), flush=True)
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
