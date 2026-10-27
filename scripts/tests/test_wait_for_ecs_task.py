import importlib.util
import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "wait_for_ecs_task", ROOT / "scripts/utilities/wait_for_ecs_task.py"
)
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
TASK = "arn:aws:ecs:region:123:task/cluster/synthetic"


def task(status="STOPPED", code=0):
    return {
        "taskArn": TASK,
        "taskDefinitionArn": "exact-definition:4",
        "lastStatus": status,
        "containers": [{"name": "nofos", "lastStatus": status, "exitCode": code}],
    }


class WaitTests(unittest.TestCase):
    def test_shell_routes_opt_in_and_preserves_helper_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            binary = root / "bin"
            binary.mkdir()
            shutil.copy(ROOT / "bin/run-command", binary / "run-command")
            stubs = {
                "terraform-init": "exit 0",
                "current-region": "echo region",
                "terraform": "echo nofos",
                "aws": """case "$*" in
*run-task*) echo 'arn:aws:ecs:region:123:task/cluster/synthetic' ;;
*describe-tasks*) echo 0 ;;
*tasks-stopped*) echo legacy-waiter ;;
*) echo nofos ;;
esac""",
                "python3": 'printf "observer %s\\n" "$*"; exit "${OBSERVER_EXIT:-0}"',
            }
            for name, content in stubs.items():
                path = binary / name
                path.write_text("#!/bin/bash\n" + content + "\n")
                path.chmod(0o700)
            env = {**os.environ, "PATH": f"{binary}:/usr/bin:/bin"}
            for arguments, expected, code in (
                ([], "legacy-waiter", 0),
                (["--wait-timeout-seconds", "30"], "observer", 0),
                (["--wait-timeout-seconds", "30"], "observer", 124),
            ):
                result = subprocess.run(
                    [
                        "bash",
                        str(binary / "run-command"),
                        *arguments,
                        "--environment-variables",
                        '[{"name":"SECRET","value":"SENSITIVE-TEST-ONLY"}]',
                        "nofos",
                        "dev",
                        '["db-migrate"]',
                    ],
                    cwd=root,
                    env={**env, "OBSERVER_EXIT": str(code)},
                    text=True,
                    capture_output=True,
                    timeout=5,
                )
                self.assertEqual(result.returncode, code, result.stderr)
                self.assertIn(expected, result.stdout)
                self.assertNotIn("SENSITIVE-TEST-ONLY", result.stdout)
                if arguments:
                    self.assertNotIn("legacy-waiter", result.stdout)

    def run_wait(self, responses, clock=(0, 0, 0, 1, 1, 1), diagnostics=None):
        output = io.StringIO()
        with patch.object(helper, "describe", side_effect=responses), patch.object(
            helper.time, "monotonic", side_effect=clock
        ), patch.object(helper.time, "sleep") as sleep, patch.object(
            helper, "diagnostics", side_effect=diagnostics
        ) as diagnostic, redirect_stdout(
            output
        ):
            code = helper.wait("cluster", TASK, "nofos", "region", 2)
        return code, output.getvalue(), sleep, diagnostic

    def test_delayed_success_verifies_exact_container_exit(self):
        code, output, sleep, diagnostic = self.run_wait([task("RUNNING"), task()])
        self.assertEqual(code, 0)
        self.assertIn('"elapsed_seconds"', output)
        sleep.assert_called_once()
        diagnostic.assert_not_called()

    def test_container_failure_collects_diagnostics_and_blocks_rollout(self):
        code, output, _, diagnostic = self.run_wait([task(code=2)])
        self.assertEqual(code, 1)
        self.assertIn("Do not launch another migration", output)
        diagnostic.assert_called_once()

    def test_timeout_does_not_stop_task_and_preserves_timeout_status(self):
        code, output, _, diagnostic = self.run_wait(
            [task("RUNNING")], clock=(0, 0, 0, 1, 3)
        )
        self.assertEqual(code, 124)
        self.assertIn("wait budget exceeded", output)
        diagnostic.assert_called_once()

    def test_diagnostic_failure_cannot_replace_timeout(self):
        code, output, _, _ = self.run_wait(
            [], clock=(0, 3), diagnostics=RuntimeError("private")
        )
        self.assertEqual(code, 124)
        self.assertNotIn("private", output)
        self.assertIn("original failure is preserved", output)

    def test_unknown_status_and_missing_or_invalid_exit_are_not_success(self):
        for code in (None, True, "0", 5):
            result, _, _, diagnostic = self.run_wait([task(code=code)])
            self.assertEqual(result, 1)
            diagnostic.assert_called_once()
        other = task()
        other["containers"][0]["name"] = "other"
        self.assertEqual(self.run_wait([other])[0], 1)

    def test_describe_failure_is_not_success(self):
        self.assertEqual(self.run_wait([RuntimeError("private")])[0], 1)

    def test_exact_task_and_failures_required(self):
        for response in (
            {"tasks": []},
            {"tasks": [task()], "failures": ["failure"]},
            {"tasks": [{**task(), "taskArn": "different"}]},
        ):
            with patch.object(helper, "aws", return_value=response), self.assertRaises(
                ValueError
            ):
                helper.describe("cluster", TASK, "region", 10)

    def test_aws_call_is_bounded_and_does_not_publish_error_output(self):
        with patch.object(helper.time, "monotonic", return_value=1), patch.object(
            helper.subprocess,
            "run",
            return_value=subprocess.CompletedProcess([], 1, "", "secret"),
        ) as run:
            with self.assertRaisesRegex(
                RuntimeError, "AWS diagnostic/status request failed"
            ):
                helper.aws(["ecs", "describe-tasks"], 3)
            self.assertEqual(run.call_args.kwargs["timeout"], 2)
            self.assertEqual(run.call_args.kwargs["env"]["AWS_MAX_ATTEMPTS"], "1")

    def test_logs_only_publish_known_migration_progress(self):
        definition = {
            "taskDefinition": {
                "containerDefinitions": [
                    {
                        "name": "nofos",
                        "logConfiguration": {
                            "logDriver": "awslogs",
                            "options": {
                                "awslogs-group": "group",
                                "awslogs-stream-prefix": "prefix",
                            },
                        },
                    }
                ]
            }
        }
        logs = {
            "events": [
                {"message": "  Applying nofos.0155_backfill... OK"},
                {"message": "password=private"},
                {"message": "::warning::private"},
            ]
        }
        output = io.StringIO()
        with patch.object(helper, "describe", return_value=task()), patch.object(
            helper, "aws", side_effect=[definition, logs]
        ) as aws, redirect_stdout(output):
            helper.diagnostics("cluster", TASK, "nofos", "region", task())
        self.assertIn("Applying nofos.0155_backfill... OK", output.getvalue())
        self.assertNotIn("private", output.getvalue())
        self.assertIn("prefix/nofos/synthetic", aws.call_args.args[0])
        self.assertEqual(
            json.loads(output.getvalue().splitlines()[-1])["log_events_withheld"], 2
        )

    def test_logs_access_denied_does_not_mask_task_state(self):
        output = io.StringIO()
        with patch.object(
            helper, "describe", return_value=task("RUNNING")
        ), patch.object(
            helper, "aws", side_effect=RuntimeError("private")
        ), redirect_stdout(
            output
        ):
            helper.diagnostics("cluster", TASK, "nofos", "region", None)
        self.assertIn('"may_still_be_active": true', output.getvalue())
        self.assertIn("Container logs unavailable", output.getvalue())
        self.assertNotIn("private", output.getvalue())

    def test_reason_redaction_and_json_prevent_workflow_command_injection(self):
        output = io.StringIO()
        with redirect_stdout(output):
            helper.emit(
                reason=helper.reason(
                    "password=SENSITIVE-TEST-ONLY\n::warning::untrusted"
                )
            )
        self.assertNotIn("SENSITIVE-TEST-ONLY", output.getvalue())
        self.assertEqual(len(output.getvalue().splitlines()), 1)
        self.assertEqual(
            helper.reason("CannotPullContainerError: private"),
            "CannotPullContainerError: details withheld",
        )

    def test_invalid_waits_fail_before_terraform_or_task_launch(self):
        for script, value in (
            ("run-command", "invalid"),
            ("run-command", "7201"),
            ("run-database-migrations", "1801"),
        ):
            env = {**os.environ, "MIGRATION_WAIT_TIMEOUT_SECONDS": value}
            args = ["bash", str(ROOT / "bin" / script)]
            if script == "run-command":
                args += [
                    "--wait-timeout-seconds",
                    value,
                    "nofos",
                    "dev",
                    '["db-migrate"]',
                ]
            else:
                args += ["nofos", "synthetic", "dev"]
            result = subprocess.run(
                args, env=env, cwd=ROOT, capture_output=True, timeout=5
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn(b"must be between", result.stderr)


if __name__ == "__main__":
    unittest.main()
