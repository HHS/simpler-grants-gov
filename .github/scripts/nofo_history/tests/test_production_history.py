"""Production check tests without AWS or production database access."""

import io
import json
import os
import sys
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

import test_prepare_nofos_history_dev as fixtures

with patch.object(sys, "path", [str(Path(__file__).resolve().parents[1]), *sys.path]):
    import check_production as production


class FakeDatabaseError(Exception):
    pass


class SourceChecks(unittest.TestCase):
    def setUp(self):
        self.config = SimpleNamespace(DOCUMENT_HISTORY_INDEX_ENABLED=False)
        self.cursor = MagicMock()
        self.connection = MagicMock()
        self.connection.cursor.return_value.__enter__.return_value = self.cursor
        self.events = MagicMock()
        self.events.count.return_value = 100
        self.events.exclude.return_value.count.return_value = 0
        self.Event = MagicMock()
        self.Event.objects.filter.return_value = self.events
        self.Index = MagicMock()
        self.Nofo = MagicMock()
        self.Nofo.objects.filter.return_value.first.return_value = object()
        self.types = MagicMock()
        self.types.objects.filter.return_value = [
            SimpleNamespace(pk=1, app_label="nofos", model="nofo")
        ]
        self.legacy = MagicMock(
            return_value=[SimpleNamespace(pk=1), SimpleNamespace(pk=2)]
        )
        self.indexed = MagicMock()
        self.indexed.return_value.values_list.return_value = [1, 2]
        self.modules = {
            "constance": SimpleNamespace(config=self.config),
            "django": SimpleNamespace(),
            "django.contrib": SimpleNamespace(),
            "django.contrib.contenttypes": SimpleNamespace(),
            "django.contrib.contenttypes.models": SimpleNamespace(
                ContentType=self.types
            ),
            "django.db": SimpleNamespace(
                DatabaseError=FakeDatabaseError,
                connection=self.connection,
                transaction=SimpleNamespace(atomic=MagicMock()),
            ),
            "easyaudit": SimpleNamespace(),
            "easyaudit.models": SimpleNamespace(CRUDEvent=self.Event),
            "nofos": SimpleNamespace(),
            "nofos.audits": SimpleNamespace(
                _legacy_audit_events_for_document=self.legacy,
                document_audit_entries=self.indexed,
            ),
            "nofos.history_index": SimpleNamespace(
                ROOTS={("nofos", "nofo")}, SECTIONS=set(), SUBSECTIONS=set()
            ),
            "nofos.models": SimpleNamespace(
                DocumentAuditEvent=self.Index, Nofo=self.Nofo
            ),
        }

    def check(self):
        output = io.StringIO()
        with patch.dict(sys.modules, self.modules), redirect_stdout(output):
            ready = production.probe.check()
        line = output.getvalue().strip()
        self.assertTrue(line.startswith(production.MARKER))
        report = json.loads(line[len(production.MARKER) :])
        self.assertIsNotNone(production.validated_report(line))
        self.assertNotIn("PRIVATE_MARKER", line)
        return ready, report

    def test_ready_requires_complete_index_and_equal_nonempty_history(self):
        ready, report = self.check()
        self.assertTrue(ready)
        self.assertEqual(report["status"], "ready")
        self.assertEqual(report["counts"]["coverage_checked"], 1)
        sql = [call.args[0] for call in self.cursor.execute.call_args_list]
        self.assertEqual(
            sql,
            [
                "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
                "SET LOCAL statement_timeout = '15000'",
                "SET LOCAL lock_timeout = '2000'",
            ],
        )
        self.Nofo.objects.filter.assert_called_once_with(
            pk="e5664268-36af-43ca-bf49-61983533041b"
        )

    def test_incomplete_index_skips_expensive_comparison(self):
        self.events.exclude.return_value.count.return_value = 5
        ready, report = self.check()
        self.assertFalse(ready)
        self.assertEqual(report["status"], "index_incomplete")
        self.assertEqual(report["counts"]["indexed_events"], 95)
        self.legacy.assert_not_called()
        self.Nofo.objects.filter.assert_not_called()

    def test_enabled_reader_stops_without_counting_or_comparing(self):
        self.config.DOCUMENT_HISTORY_INDEX_ENABLED = True
        ready, report = self.check()
        self.assertFalse(ready)
        self.assertEqual(report["status"], "reader_enabled")
        self.Event.objects.filter.assert_not_called()
        self.legacy.assert_not_called()

    def test_any_membership_difference_blocks_readiness(self):
        for ids in ([1], [1, 2, 3]):
            with self.subTest(ids=ids):
                self.indexed.return_value.values_list.return_value = ids
                ready, report = self.check()
                self.assertFalse(ready)
                self.assertEqual(report["status"], "coverage_mismatch")

    def test_missing_and_empty_targets_are_not_ready(self):
        self.Nofo.objects.filter.return_value.first.return_value = None
        self.assertEqual(self.check()[1]["status"], "target_missing")
        self.Nofo.objects.filter.return_value.first.return_value = object()
        self.legacy.return_value = []
        self.indexed.return_value.values_list.return_value = []
        self.assertEqual(self.check()[1]["status"], "target_empty")

    def test_empty_audit_does_not_claim_readiness(self):
        self.events.count.return_value = 0
        self.assertEqual(self.check()[1]["status"], "empty_audit")
        self.legacy.assert_not_called()

    def test_timeouts_and_exceptions_are_sanitized(self):
        for code in ("57014", "55P03", "other"):
            with self.subTest(code=code):
                cause = Exception("PRIVATE_MARKER")
                cause.pgcode = code
                error = FakeDatabaseError("PRIVATE_MARKER")
                error.__cause__ = cause
                self.events.count.side_effect = error
                ready, report = self.check()
                self.assertFalse(ready)
                self.assertEqual(
                    report["status"],
                    "query_timeout" if code != "other" else "check_failed",
                )


class RunnerChecks(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.PreparationTests()
        self.fixture.setUp()
        counts = dict.fromkeys(production.probe.FIELDS, 0)
        counts.update(
            relevant_events=100,
            indexed_events=100,
            coverage_checked=1,
            legacy_visible_events=2,
            indexed_visible_events=2,
        )
        self.report = {"status": "ready", "counts": counts}
        self.fixture.logs = [
            production.MARKER + json.dumps(self.report),
            "PRIVATE_MARKER",
        ]

    def run_check(self):
        with (
            patch.object(production.shared, "aws", side_effect=self.fixture.aws),
            patch.object(
                production.shared, "output", side_effect=["prod-cluster", "dev-nofo"]
            ),
            patch.object(production.shared.subprocess, "run") as init,
            patch.object(production.time, "sleep"),
            patch.object(production.sys, "argv", ["check_production.py"]),
            patch.dict(
                os.environ, {"GITHUB_REF": "refs/heads/main", "GITHUB_STEP_SUMMARY": ""}
            ),
        ):
            production.main()
        return init

    def test_fixed_prod_environment_command_and_revision(self):
        capture = io.StringIO()
        with redirect_stdout(capture):
            init = self.run_check()
        init.assert_called_once_with(
            ["./bin/terraform-init", production.shared.MODULE, "prod"], check=True
        )
        launch = next(p for _, op, p in self.fixture.calls if op == "run-task")
        self.assertEqual(launch["task_definition"], "deployed:7")
        self.assertEqual(launch["started_by"], production.STARTED_BY)
        command = launch["overrides"]["containerOverrides"][0]["command"][2]
        self.assertIn("REPEATABLE READ READ ONLY", command)
        self.assertIn("statement_timeout", command)
        self.assertNotIn("backfill_document_audit_index", command)
        self.assertNotIn("backfill_history_index", command)
        self.assertNotIn("config.DOCUMENT_HISTORY_INDEX_ENABLED =", command)
        self.assertLess(len(json.dumps(launch["overrides"]).encode()), 8192)
        self.assertNotIn("PRIVATE_MARKER", capture.getvalue())

    def test_incomplete_report_and_container_failure_cannot_pass(self):
        self.report["status"] = "index_incomplete"
        self.report["counts"].update(
            missing_events=5, indexed_events=95, coverage_checked=0
        )
        self.fixture.logs = [production.MARKER + json.dumps(self.report)]
        with self.assertRaisesRegex(RuntimeError, "index_incomplete"):
            self.run_check()
        self.fixture.logs = [
            production.MARKER + json.dumps(RunnerChecks.ready_report())
        ]
        self.fixture.task["containers"][0]["exitCode"] = 1
        with self.assertRaisesRegex(RuntimeError, "did not exit successfully"):
            self.run_check()

    @staticmethod
    def ready_report():
        counts = dict.fromkeys(production.probe.FIELDS, 0)
        counts.update(
            relevant_events=100,
            indexed_events=100,
            coverage_checked=1,
            legacy_visible_events=2,
            indexed_visible_events=2,
        )
        return {"status": "ready", "counts": counts}

    def test_unavailable_logs_and_timeout_fail_closed(self):
        with patch.object(production, "read_report", return_value=None):
            with self.assertRaisesRegex(RuntimeError, "No validated result"):
                self.run_check()
        with patch.object(
            production.shared, "wait_for_task", side_effect=RuntimeError("timeout")
        ) as wait:
            with self.assertRaisesRegex(RuntimeError, "timeout"):
                self.run_check()
            self.assertEqual(wait.call_args.kwargs["timeout_seconds"], 300)
        self.assertTrue(any(op == "stop-task" for _, op, _ in self.fixture.calls))

    def test_non_main_or_extra_arguments_cannot_initialize_aws(self):
        for ref, args in (
            ("refs/heads/other", ["script"]),
            ("refs/heads/main", ["script", "dev"]),
        ):
            with (
                patch.dict(os.environ, {"GITHUB_REF": ref}),
                patch.object(production.sys, "argv", args),
                patch.object(production.shared.subprocess, "run") as run,
            ):
                with self.assertRaisesRegex(RuntimeError, "no arguments"):
                    production.main()
                run.assert_not_called()

    def test_redaction_and_semantic_ready_validation(self):
        for report in (
            {"status": "PRIVATE_MARKER", "counts": {}},
            {"status": "ready", "counts": dict.fromkeys(production.probe.FIELDS, 0)},
            {
                "status": "ready",
                "counts": {**self.report["counts"], "missing_events": 1},
            },
            {
                "status": "ready",
                "counts": {**self.report["counts"], "elapsed_ms": True},
            },
            {
                "status": "ready",
                "counts": {**self.report["counts"], "private": "PRIVATE_MARKER"},
            },
        ):
            self.assertIsNone(
                production.validated_report(production.MARKER + json.dumps(report))
            )


if __name__ == "__main__":
    unittest.main()
