"""Exercise deployed scratch cleanup with disposable, test-owned processes."""

import base64
import contextlib
import io
import json
import os
import re
import select
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

PREFIX = "NOFO_READABILITY_INTERRUPTION "
CHECKS = {
    "public_uploads_disabled",
    "parser_holds_synthetic_file",
    "parser_exits_with_request",
    "startup_hook_removes_workspace",
    "public_uploads_still_disabled",
}

REQUEST = """
import os
import subprocess
import sys
from pathlib import Path
from nofos.readability_scratch import CheckerDiskUploadHandler, request_workspace

with request_workspace() as workspace:
    data = Path(sys.argv[1]).read_bytes()
    handler = CheckerDiskUploadHandler(None, workspace)
    handler.new_file('pdf', 'synthetic.pdf', 'application/pdf', len(data))
    handler.receive_data_chunk(data, 0)
    upload = handler.file_complete(len(data))
    try:
        staging = workspace / 'analysis'
        staging.mkdir()
        path = staging / 'input.pdf'
        path.write_bytes(upload.read())
        subprocess.run(
            [sys.executable, '-c', sys.argv[2], str(path), '1', str(os.getpid())],
            timeout=40,
            check=True,
        )
    finally:
        upload.close()
"""

PARSER = """
import signal
from nofos import pdf_readability_worker as worker

def hold_open(path, max_pages):
    with path.open('rb'):
        # Bound the child independently if parent-death handling fails.
        signal.alarm(30)
        print(path.parent.parent.name, flush=True)
        signal.pause()

worker.analyze = hold_open
raise SystemExit(worker.main())
"""

SWEEPER = """
import runpy
import time

runpy.run_path('/app/gunicorn.conf.py')['post_worker_init'](None)
time.sleep(40)
"""


def verify_interruption(checks, scratch_root, fixture):
    # Give both test processes a private scratch tree and retain their handles.
    with tempfile.TemporaryDirectory() as directory:
        with patch.object(tempfile, "tempdir", directory):
            root = scratch_root()
            source = Path(directory) / "synthetic.pdf"
            source.write_bytes(fixture)
            env = {
                "PATH": os.defpath,
                "TMPDIR": directory,
                "PYTHONDONTWRITEBYTECODE": "1",
            }
            with subprocess.Popen(
                [sys.executable, "-c", REQUEST, str(source), PARSER],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
            ) as request:
                try:
                    if not select.select([request.stdout], [], [], 8)[0]:
                        return
                    name = request.stdout.readline().decode("ascii").strip()
                    if not re.fullmatch(r"request-[a-z0-9_]{8}", name):
                        return
                    workspace = root / name
                    checks["parser_holds_synthetic_file"] = (
                        (workspace / "analysis/input.pdf").is_file()
                        and any(workspace.glob("*.upload"))
                    )
                    if not checks["parser_holds_synthetic_file"]:
                        return
                    request.kill()
                    # The paused parser inherits the pipe. EOF after killing
                    # the request confirms the parser stopped holding it open.
                    output, _ = request.communicate(timeout=5)
                    checks["parser_exits_with_request"] = (
                        request.returncode == -signal.SIGKILL and not output
                    )
                finally:
                    if request.poll() is None:
                        request.kill()
            if not checks["parser_exits_with_request"] or not workspace.is_dir():
                return
            # Run the deployed startup hook in a second test-owned process.
            # Its background thread always sees only the private probe tree.
            with subprocess.Popen(
                [sys.executable, "-c", SWEEPER],
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            ) as sweeper:
                try:
                    deadline = time.monotonic() + 35
                    while (
                        workspace.exists()
                        and sweeper.poll() is None
                        and time.monotonic() < deadline
                    ):
                        time.sleep(0.1)
                    checks["startup_hook_removes_workspace"] = not workspace.exists()
                finally:
                    if sweeper.poll() is None:
                        sweeper.terminate()


def exercise(checks, read_flag, fixture):
    import django

    os.environ["DJANGO_SETTINGS_MODULE"] = "bloom_nofos.settings"
    django.setup()
    from django.db import connection

    from nofos.readability_scratch import scratch_root

    if sys.platform != "linux" or connection.vendor != "postgresql":
        return
    try:
        with connection.cursor() as cursor:
            cursor.execute("SET default_transaction_read_only = on")
            cursor.execute("SET statement_timeout = '5000'")
        checks["public_uploads_disabled"] = read_flag()
        if not checks["public_uploads_disabled"]:
            return
        verify_interruption(checks, scratch_root, fixture)
        checks["public_uploads_still_disabled"] = read_flag()
    finally:
        connection.close()


def main(encoded_fixtures, read_flag):
    checks = dict.fromkeys(CHECKS, False)
    completed = False
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(
            io.StringIO()
        ):
            fixture = base64.b64decode(
                encoded_fixtures["synthetic-nofo-supported.pdf"], validate=True
            )
            exercise(checks, read_flag, fixture)
            completed = True
    except Exception:
        pass
    print(PREFIX + json.dumps({"checks": checks}, sort_keys=True))
    return 0 if completed and all(checks.values()) else 1
