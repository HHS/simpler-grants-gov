"""Fixed synthetic probe, executed only in a separate dev application task.

The injected FIXTURES contains reviewed fictional PDFs, never user uploads.
No HTTP routes, application records, feature switches or existing files are changed.
"""

import base64
import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
from importlib.metadata import version
from pathlib import Path
from unittest.mock import patch

PREFIX = "NOFO_READABILITY_RUNTIME "
CHECKS = {
    "public_uploads_disabled",
    "linux_postgresql",
    "supported_processing",
    "invalid_rejection",
    "encrypted_rejection",
    "cleanup_success",
    "cleanup_invalid",
    "cleanup_encrypted",
    "controlled_timeout",
    "cleanup_timeout",
    "linux_child_limits",
    "minimal_child_environment",
    "cleanup_instrumented_child",
    "postgresql_contention",
    "postgresql_release",
    "public_uploads_still_disabled",
}


def uploads_disabled():
    # config.KEY may save a default for a missing row; read without that write.
    from constance import settings as constance_settings
    from constance.codecs import loads
    from constance.models import Constance
    from django.conf import settings

    if settings.CONSTANCE_BACKEND != "constance.backends.database.DatabaseBackend":
        raise RuntimeError("Unexpected flag backend")
    key = "HHS_NOFO_PDF_METRICS_PILOT_ENABLED"
    row = (
        Constance.objects.filter(key=constance_settings.DATABASE_PREFIX + key)
        .values_list("value", flat=True)
        .first()
    )
    value = loads(row) if row is not None else settings.CONSTANCE_CONFIG[key][0]
    return value is False


def verify_admission(results, connection, app):
    competitor = connection.copy(alias="readability_probe_competitor")
    try:
        # Builder's IAM backend removes this callback from settings_dict during
        # initialization, so Django's copy() cannot reconstruct it on its own.
        if hasattr(connection, "generate_iam_auth_token"):
            competitor.generate_iam_auth_token = connection.generate_iam_auth_token
        with competitor.cursor() as cursor:
            cursor.execute("SET default_transaction_read_only = on")
            cursor.execute("SET statement_timeout = '5000'")
        with app._analysis_slot():
            with patch.object(app, "connection", competitor):
                try:
                    with app._analysis_slot():
                        results["postgresql_contention"] = False
                except app.PdfReadabilityError as error:
                    results["postgresql_contention"] = error.code == "busy"
        with patch.object(app, "connection", competitor):
            with app._analysis_slot():
                results["postgresql_release"] = True
        # Keep the primary session's read-only setting and five-second timeout
        # in force for the final flag query; closing first opens a fresh session.
        results["public_uploads_still_disabled"] = uploads_disabled()
    finally:
        try:
            competitor.close()
        finally:
            connection.close()


def exercise(results, fixtures):
    import django

    os.environ["DJANGO_SETTINGS_MODULE"] = "bloom_nofos.settings"
    django.setup()
    from django.core.files.uploadedfile import TemporaryUploadedFile
    from django.db import connection

    from nofos import pdf_readability as app

    results["linux_postgresql"] = (
        sys.platform.startswith("linux") and connection.vendor == "postgresql"
    )
    if not results["linux_postgresql"]:
        return

    # Bound all probe database operations; advisory locks are non-blocking and
    # released on connection close even if a later check fails.
    with connection.cursor() as cursor:
        cursor.execute("SET default_transaction_read_only = on")
        cursor.execute("SET statement_timeout = '5000'")
    results["public_uploads_disabled"] = uploads_disabled()
    if not results["public_uploads_disabled"]:
        return
    original_directory = tempfile.TemporaryDirectory
    original_run = subprocess.run
    # Derive an encrypted example from the same fictional PDF in memory, keeping
    # the fixed ECS payload small and avoiding any real document or password.
    from pypdf import PdfWriter

    writer = PdfWriter(clone_from=io.BytesIO(fixtures["synthetic-nofo-supported.pdf"]))
    writer.encrypt("synthetic-test-only")
    encrypted = io.BytesIO()
    writer.write(encrypted)
    fixtures["synthetic-encrypted.pdf"] = encrypted.getvalue()

    def analyze(label, data, expected, runner=None):
        paths = []

        def tracked_directory(*args, **kwargs):
            directory = original_directory(*args, **kwargs)
            paths.append(Path(directory.name))
            return directory

        # Exercise Django's disk-backed upload close as well as analyzer files.
        upload = TemporaryUploadedFile(
            "synthetic.pdf", "application/pdf", len(data), None
        )
        upload.write(data)
        upload.seek(0)
        paths.append(Path(upload.temporary_file_path()))
        report = None
        outcome = "success"
        try:
            with contextlib.ExitStack() as stack:
                stack.enter_context(
                    patch.object(app.tempfile, "TemporaryDirectory", tracked_directory)
                )
                if runner:
                    stack.enter_context(patch.object(app.subprocess, "run", runner))
                try:
                    report = app.analyze_uploaded_pdf(upload)
                except app.PdfReadabilityError as error:
                    outcome = error.code
        finally:
            # Observe cleanup BEFORE the probe's fallback close.
            results["cleanup_" + label] = len(paths) >= 2 and all(
                not path.exists() for path in paths
            )
            upload.close()
        return outcome == expected, report

    for label, filename, expected in (
        ("success", "synthetic-nofo-supported.pdf", "success"),
        ("invalid", "synthetic-invalid.pdf", "invalid_pdf"),
        ("encrypted", "synthetic-encrypted.pdf", "encrypted"),
    ):
        passed, _ = analyze(label, fixtures[filename], expected)
        results[
            {
                "success": "supported_processing",
                "invalid": "invalid_rejection",
                "encrypted": "encrypted_rejection",
            }[label]
        ] = passed

    def sleeping_child(command, **kwargs):
        # Exercise the real subprocess.run timeout/kill/wait and parent cleanup,
        # using a fixed harmless child and short test deadline. No parser attack.
        kwargs["timeout"] = 0.1
        return original_run(
            [sys.executable, "-c", "import time; time.sleep(2)"], **kwargs
        )

    passed, _ = analyze(
        "timeout", fixtures["synthetic-nofo-supported.pdf"], "timeout", sleeping_child
    )
    results["controlled_timeout"] = passed

    # Execute the deployed worker's actual main/limit setup in a real Linux
    # child. Replace analysis only in that child to report its effective limits
    # through the normal private stdout pipe, not the container log stream.
    limit_code = """
import os, resource, sys
from nofos import pdf_readability_worker as worker
def observe(*args):
    limits = [(resource.RLIMIT_CPU, 20), (resource.RLIMIT_AS, 1536*1024*1024),
              (resource.RLIMIT_FSIZE, 2*1024*1024), (resource.RLIMIT_NOFILE, 64)]
    return {"metrics": {}, "limits_ok": all(resource.getrlimit(k) == (v,v) for k,v in limits),
            "environment_ok": set(os.environ) <= {"PATH", "PYTHONDONTWRITEBYTECODE", "TMPDIR", "TMP", "TEMP", "LC_CTYPE"}}
worker.analyze = observe
sys.exit(worker.main())
"""

    def limit_child(command, **kwargs):
        return original_run([command[0], "-c", limit_code, *command[3:]], **kwargs)

    passed, report = analyze(
        "instrumented_child",
        fixtures["synthetic-nofo-supported.pdf"],
        "success",
        limit_child,
    )
    results["linux_child_limits"] = (
        passed and isinstance(report, dict) and report.get("limits_ok") is True
    )
    results["minimal_child_environment"] = (
        passed and isinstance(report, dict) and report.get("environment_ok") is True
    )

    verify_admission(results, connection, app)


def main(encoded_fixtures):
    results = {key: False for key in CHECKS}
    versions = {}
    # Redirect setup/library output as well: never publish raw errors, reports,
    # paths, environment values, database results or document content.
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(
            io.StringIO()
        ):
            fixtures = {
                key: base64.b64decode(value, validate=True)
                for key, value in encoded_fixtures.items()
            }
            exercise(results, fixtures)
            versions = {key: version(key) for key in ("pypdf", "hhs-nofo-metrics")}
    except Exception:
        pass
    print(
        PREFIX + json.dumps({"checks": results, "versions": versions}, sort_keys=True)
    )
    return (
        0
        if all(results.values()) and set(versions) == {"pypdf", "hhs-nofo-metrics"}
        else 1
    )
