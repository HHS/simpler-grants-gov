"""Offline tests: no Terraform state, AWS credentials or database needed."""

import copy
import importlib.util
import io
import os
import subprocess
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "history", Path(__file__).resolve().parents[1] / "prepare_dev.py"
)
history = importlib.util.module_from_spec(spec)
spec.loader.exec_module(history)


class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.service = {
            "status": "ACTIVE",
            "desiredCount": 1,
            "runningCount": 1,
            "pendingCount": 0,
            "deployments": [{"rolloutState": "COMPLETED"}],
            "taskDefinition": "deployed:7",
            "networkConfiguration": {"awsvpcConfiguration": {}},
        }
        self.task = {
            "lastStatus": "STOPPED",
            "containers": [{"name": "dev-nofo", "exitCode": 0}],
        }
        self.calls = []
        self.active = []
        self.stopping = []
        self.worker_definition = "deployed:7"
        self.launch = {"tasks": [{"taskArn": "arn:task/preparation"}]}
        self.logs = [
            "Document audit index: 12 resolved, 0 unresolved ownership.",
            history.SUCCESS,
            "private document content that must not be printed",
        ]

    def aws(self, service, operation, **params):
        self.calls.append((service, operation, copy.deepcopy(params)))
        if operation == "describe-services":
            return {"services": [self.service]}
        if operation == "list-tasks":
            if params.get("desired_status") == "STOPPED":
                return {"taskArns": ["stopping"] if self.stopping else []}
            return {"taskArns": self.active if "started_by" in params else ["worker"]}
        if operation == "describe-tasks":
            if params["tasks"] == ["stopping"]:
                return {"tasks": self.stopping}
            if params["tasks"] == ["worker"]:
                return {
                    "tasks": [
                        {
                            "lastStatus": "RUNNING",
                            "taskDefinitionArn": self.worker_definition,
                        }
                    ]
                }
            return {"tasks": [self.task]}
        if operation == "describe-task-definition":
            return {
                "taskDefinition": {
                    "containerDefinitions": [
                        {
                            "name": "dev-nofo",
                            "logConfiguration": {
                                "logDriver": "awslogs",
                                "options": {
                                    "awslogs-group": "dev-logs",
                                    "awslogs-stream-prefix": "ecs",
                                },
                            },
                        }
                    ]
                }
            }
        if operation == "run-task":
            return self.launch
        if operation == "get-log-events":
            return {
                "events": [{"message": message} for message in self.logs],
                "nextForwardToken": "end",
            }
        if operation == "stop-task":
            return {}
        raise AssertionError(operation)

    def run_prepare(self):
        with (
            patch.object(history, "aws", side_effect=self.aws),
            patch.object(history, "output", side_effect=["dev-cluster", "dev-nofo"]),
            patch.object(history.subprocess, "run"),
            patch.object(history.time, "sleep"),
            patch.object(history.sys, "argv", ["prepare-nofos-history-dev.py"]),
            patch.dict(
                os.environ, {"GITHUB_REF": "refs/heads/main", "GITHUB_STEP_SUMMARY": ""}
            ),
        ):
            history.prepare()

    def test_success_pins_deployed_revision_and_only_prints_counts(self):
        capture = io.StringIO()
        with redirect_stdout(capture):
            self.run_prepare()
        launch = next(params for _, op, params in self.calls if op == "run-task")
        self.assertEqual(launch["task_definition"], "deployed:7")
        self.assertEqual(
            launch["overrides"]["containerOverrides"][0]["command"], history.COMMAND
        )
        self.assertNotIn("taskRoleArn", launch["overrides"])
        self.assertIn(history.SUCCESS, capture.getvalue())
        self.assertNotIn("private document", capture.getvalue())
        self.assertFalse(any(op == "stop-task" for _, op, _ in self.calls))

    def test_rejects_incomplete_rollout(self):
        self.service["deployments"][0]["rolloutState"] = "IN_PROGRESS"
        with self.assertRaisesRegex(RuntimeError, "rollout is not complete"):
            self.run_prepare()
        self.assertFalse(any(op == "run-task" for _, op, _ in self.calls))

    def test_rejects_old_workers(self):
        self.worker_definition = "deployed:6"
        with self.assertRaisesRegex(RuntimeError, "Old dev workers"):
            self.run_prepare()

    def test_rejects_existing_preparation(self):
        self.active = ["existing-task"]
        with self.assertRaisesRegex(RuntimeError, "already active"):
            self.run_prepare()
        self.assertFalse(any(op == "run-task" for _, op, _ in self.calls))

    def test_launch_failure_does_not_claim_success(self):
        self.launch = {"tasks": [], "failures": [{"reason": "capacity"}]}
        with self.assertRaisesRegex(RuntimeError, "did not start"):
            self.run_prepare()

    def test_rejects_preparation_that_is_still_stopping(self):
        self.stopping = [{"startedBy": history.STARTED_BY, "lastStatus": "STOPPING"}]
        with self.assertRaisesRegex(RuntimeError, "still stopping"):
            self.run_prepare()

    def test_container_failure_blocks_success_even_with_complete_log(self):
        self.task["containers"][0]["exitCode"] = 1
        with self.assertRaisesRegex(RuntimeError, "Preparation failed"):
            self.run_prepare()

    def test_missing_completeness_message_blocks_success(self):
        self.logs = ["Document audit index: 12 resolved, 1 unresolved ownership."]
        with self.assertRaisesRegex(RuntimeError, "Could not confirm"):
            self.run_prepare()

    def test_unresolved_ownership_blocks_success_even_with_complete_log(self):
        self.logs = [
            "Document audit index: 12 resolved, 1 unresolved ownership.",
            history.SUCCESS,
        ]
        with self.assertRaisesRegex(RuntimeError, "Could not confirm"):
            self.run_prepare()

    def test_timeout_requests_stop(self):
        with patch.object(
            history, "wait_for_task", side_effect=RuntimeError("timeout")
        ):
            with self.assertRaisesRegex(RuntimeError, "timeout"):
                self.run_prepare()
        self.assertTrue(any(op == "stop-task" for _, op, _ in self.calls))

    def test_interruption_requests_stop(self):
        with patch.object(history, "wait_for_task", side_effect=KeyboardInterrupt):
            with self.assertRaises(KeyboardInterrupt):
                self.run_prepare()
        self.assertTrue(any(op == "stop-task" for _, op, _ in self.calls))

    def test_diagnostic_failure_blocks_success(self):
        with patch.object(
            history, "read_counts", side_effect=RuntimeError("logs denied")
        ):
            with self.assertRaisesRegex(RuntimeError, "Could not confirm"):
                self.run_prepare()

    def test_waiter_is_bounded(self):
        with (
            patch.object(
                history.time, "monotonic", side_effect=[0, history.TIMEOUT + 1]
            ),
            self.assertRaisesRegex(RuntimeError, "exceeded 30 minutes"),
        ):
            history.wait_for_task("dev", "task")

    def test_non_main_and_arguments_rejected_before_initialization(self):
        for ref, args in (
            ("refs/heads/other", ["script"]),
            ("refs/heads/main", ["script", "prod"]),
        ):
            with (
                self.subTest(ref=ref, args=args),
                patch.dict(os.environ, {"GITHUB_REF": ref}),
                patch.object(history.sys, "argv", args),
                patch.object(history.subprocess, "run") as run,
                self.assertRaisesRegex(RuntimeError, "arguments are not accepted"),
            ):
                history.prepare()
            run.assert_not_called()

    def test_aws_boolean_flags_and_failure_redaction(self):
        with patch.object(
            history.subprocess,
            "run",
            return_value=subprocess.CompletedProcess([], 0, "{}"),
        ) as run:
            history.aws("logs", "get-log-events", start_from_head=True)
            args = run.call_args.args[0]
            self.assertIn("--start-from-head", args)
            self.assertNotIn("True", args)
        with patch.object(
            history.subprocess,
            "run",
            return_value=subprocess.CompletedProcess([], 1, "", "secret error"),
        ):
            with self.assertRaisesRegex(
                RuntimeError, "AWS logs get-log-events failed"
            ) as error:
                history.aws("logs", "get-log-events")
            self.assertNotIn("secret", str(error.exception))


if __name__ == "__main__":
    unittest.main()
