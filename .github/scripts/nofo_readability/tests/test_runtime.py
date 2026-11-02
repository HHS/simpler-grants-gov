import copy
import contextlib
import io
import importlib.util
import json
import os
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("runner", HERE / "run_dev.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


def report():
    return {
        "checks": {key: True for key in runner.probe.CHECKS},
        "versions": {"pypdf": "6.21.4", "hhs-nofo-metrics": "0.7.0"},
    }


class RuntimeTests(unittest.TestCase):
    def test_flag_read_uses_stored_value_or_default_without_writes(self):
        manager = Mock()
        settings = SimpleNamespace(
            CONSTANCE_BACKEND="constance.backends.database.DatabaseBackend",
            CONSTANCE_CONFIG={"HHS_NOFO_PDF_METRICS_PILOT_ENABLED": (False, "", bool)},
        )
        modules = {
            "constance": SimpleNamespace(
                settings=SimpleNamespace(DATABASE_PREFIX="prefix:")
            ),
            "constance.codecs": SimpleNamespace(loads=json.loads),
            "constance.models": SimpleNamespace(
                Constance=SimpleNamespace(objects=manager)
            ),
            "django.conf": SimpleNamespace(settings=settings),
        }
        with patch.dict(runner.probe.sys.modules, modules):
            for stored, disabled in (
                (None, True),
                ("false", True),
                ("true", False),
                ("null", False),
            ):
                manager.filter.return_value.values_list.return_value.first.return_value = (
                    stored
                )
                self.assertEqual(runner.probe.uploads_disabled(), disabled)
            manager.filter.assert_called_with(
                key="prefix:HHS_NOFO_PDF_METRICS_PILOT_ENABLED"
            )
            manager.create.assert_not_called()
            manager.update.assert_not_called()
            settings.CONSTANCE_CONFIG["HHS_NOFO_PDF_METRICS_PILOT_ENABLED"] = (
                True,
                "",
                bool,
            )
            manager.filter.return_value.values_list.return_value.first.return_value = (
                None
            )
            self.assertFalse(runner.probe.uploads_disabled())

    def test_probe_exception_is_content_free_and_fails(self):
        output = io.StringIO()

        def failed(*args):
            print("PRIVATE DOCUMENT OR ERROR")
            raise RuntimeError("PRIVATE DOCUMENT OR ERROR")

        with patch.object(
            runner.probe, "exercise", side_effect=failed
        ), contextlib.redirect_stdout(output):
            code = runner.probe.main({})
        self.assertEqual(code, 1)
        self.assertNotIn("PRIVATE", output.getvalue())
        data = runner.validate_report(output.getvalue().strip())
        self.assertTrue(all(value is False for value in data["checks"].values()))

    def test_missing_versions_cannot_pass_probe(self):
        output = io.StringIO()

        def passed(checks, fixtures):
            checks.update({key: True for key in runner.probe.CHECKS})

        with patch.object(runner.probe, "exercise", side_effect=passed), patch.object(
            runner.probe, "version", side_effect=RuntimeError("PRIVATE")
        ), contextlib.redirect_stdout(output):
            code = runner.probe.main({})
        self.assertEqual(code, 1)
        self.assertNotIn("PRIVATE", output.getvalue())

    def test_fixed_payload_and_override_size(self):
        command = runner.command()
        self.assertLess(
            len(
                json.dumps(
                    {
                        "containerOverrides": [
                            {"name": runner.SERVICE, "command": command}
                        ]
                    }
                )
            ),
            8192,
        )
        self.assertEqual(command[:2], ["sh", "-c"])
        # Decode locally to validate the transmitted source without executing it.
        import ast
        import base64
        import shlex
        import zlib

        bootstrap = shlex.split(command[2])[-1]
        tree = ast.parse(bootstrap)
        packed = next(
            node.value
            for node in ast.walk(tree)
            if isinstance(node, ast.Constant)
            and isinstance(node.value, str)
            and len(node.value) > 100
        )
        source = zlib.decompress(base64.b64decode(packed)).decode()
        compile(source, "probe", "exec")
        self.assertIn("main({", source)

    def test_fixture_integrity_fails_closed(self):
        with patch.object(runner, "FIXTURES", {"synthetic-invalid.pdf": "wrong"}):
            with self.assertRaises(RuntimeError):
                runner.command()

    def test_only_boolean_schema_and_safe_versions_are_publishable(self):
        self.assertEqual(
            runner.validate_report(runner.probe.PREFIX + json.dumps(report())), report()
        )
        for mutate in (
            lambda data: data["checks"].update({"raw_log": True}),
            lambda data: data["checks"].update({"linux_child_limits": "private"}),
            lambda data: data["versions"].update({"pypdf": "private filename"}),
            lambda data: data.update({"raw_error": "private"}),
        ):
            data = report()
            mutate(data)
            self.assertIsNone(
                runner.validate_report(runner.probe.PREFIX + json.dumps(data))
            )
        for message in (
            "raw sensitive log",
            runner.probe.PREFIX + "{",
            runner.probe.PREFIX + "null",
        ):
            self.assertIsNone(runner.validate_report(message))

    def test_wrong_environment_stops_before_aws(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(
            runner.shared, "aws"
        ) as aws:
            with self.assertRaises(RuntimeError):
                runner.run()
            aws.assert_not_called()

    def test_wrong_account_stops_before_discovery(self):
        env = {
            "GITHUB_REF": "refs/heads/main",
            "GITHUB_REPOSITORY": "HHS/simpler-grants-gov",
            "AWS_REGION": "us-east-1",
        }
        with patch.dict(os.environ, env, clear=True), patch.object(
            runner.sys, "argv", ["run_dev.py"]
        ), patch.object(
            runner.shared, "aws", return_value={"Account": "other"}
        ), patch.object(
            runner.subprocess, "run"
        ) as process:
            with self.assertRaises(RuntimeError):
                runner.run()
            process.assert_not_called()

    def test_only_probe_task_logs_are_read_and_raw_logs_ignored(self):
        events = {
            "events": [
                {"message": "private application log"},
                {"message": runner.probe.PREFIX + json.dumps(report())},
            ],
            "nextForwardToken": "end",
        }
        with patch.object(
            runner.shared,
            "aws",
            side_effect=[events, {"events": [], "nextForwardToken": "end"}],
        ) as aws:
            result = runner.read_report(
                {"awslogs-group": "group", "awslogs-stream-prefix": "ecs"}, "task/probe"
            )
            self.assertEqual(result, report())
            self.assertEqual(
                aws.call_args.kwargs["log_stream_name"], "ecs/nofos-infra-dev/probe"
            )

    def test_failure_requests_stop_only_of_launched_probe(self):
        env = {
            "GITHUB_REF": "refs/heads/main",
            "GITHUB_REPOSITORY": "HHS/simpler-grants-gov",
            "AWS_REGION": "us-east-1",
        }
        definition = {
            "containerDefinitions": [
                {
                    "name": runner.SERVICE,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "group",
                            "awslogs-stream-prefix": "ecs",
                        },
                    },
                }
            ]
        }
        calls = []

        def aws(service, operation, **kwargs):
            calls.append((service, operation, copy.deepcopy(kwargs)))
            return {
                "get-caller-identity": {"Account": runner.ACCOUNT},
                "describe-task-definition": {"taskDefinition": definition},
                "run-task": {"tasks": [{"taskArn": "task/probe"}]},
            }.get(operation, {})

        with patch.dict(os.environ, env, clear=True), patch.object(
            runner.sys, "argv", ["run_dev.py"]
        ), patch.object(runner.shared, "aws", side_effect=aws), patch.object(
            runner.subprocess, "run", return_value=SimpleNamespace(returncode=0)
        ), patch.object(
            runner.shared, "output", side_effect=["cluster", runner.SERVICE]
        ), patch.object(
            runner.shared,
            "require_stable_service",
            return_value={
                "taskDefinition": "definition:42",
                "networkConfiguration": {"awsvpcConfiguration": {}},
            },
        ), patch.object(
            runner.shared, "require_no_preparation"
        ), patch.object(
            runner.shared, "wait_for_task", side_effect=RuntimeError("private")
        ):
            with self.assertRaises(RuntimeError):
                runner.run()
        launch = next(kwargs for _, op, kwargs in calls if op == "run-task")
        self.assertEqual(launch["task_definition"], "definition:42")
        self.assertEqual(launch["count"], 1)
        self.assertEqual(set(launch["overrides"]), {"containerOverrides"})
        stop = [kwargs for _, op, kwargs in calls if op == "stop-task"]
        self.assertEqual(stop[0]["task"], "task/probe")
        self.assertNotIn("update-service", [op for _, op, _ in calls])


if __name__ == "__main__":
    unittest.main()
