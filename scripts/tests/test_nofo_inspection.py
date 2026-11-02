"""Offline fixtures only: never authenticate, submit uploads, or contact AWS."""

import copy
import importlib.util
import io
import json
import os
import subprocess
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "inspection", ROOT / "scripts/inspect_nofo_readability.py"
)
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)
MARKER = "PRIVATE-DOCUMENT-RECIPIENT-SECRET"


def definition(revision=2):
    return {
        "taskDefinitionArn": f"arn:aws:ecs:region:account:task-definition/test:{revision}",
        "taskRoleArn": MARKER,
        "containerDefinitions": [
            {
                "name": m.SERVICE,
                "image": "private.registry/private-name:abc12345",
                "readonlyRootFilesystem": True,
                "user": "1000",
                "environment": [
                    {"name": "SECRET_KEY", "value": MARKER},
                    {
                        "name": "PDF_READABILITY_ATTEMPT_RECORDING_ENABLED",
                        "value": "false",
                    },
                ],
                "secrets": [{"name": MARKER, "valueFrom": MARKER}],
                "linuxParameters": {"tmpfs": [{"containerPath": "/tmp"}]},
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {"awslogs-group": MARKER},
                },
            }
        ],
    }


def acl():
    return {
        "Name": MARKER,
        "VisibilityConfig": {"MetricName": "different-visibility-metric"},
        "Rules": [
            {
                "Name": m.RULES["emergency"],
                "Priority": 0,
                "Action": {"Count": {}},
                "VisibilityConfig": {
                    "CloudWatchMetricsEnabled": True,
                    "MetricName": "emergency-metric",
                },
                "Statement": {},
            },
            {
                "Name": m.RULES["upload_rate"],
                "Priority": 1,
                "Action": {"Count": {}},
                "VisibilityConfig": {"MetricName": "rate-metric"},
                "Statement": {
                    "RateBasedStatement": {
                        "Limit": 10,
                        "EvaluationWindowSec": 300,
                        "AggregateKeyType": "IP",
                    }
                },
            },
            {"Name": MARKER, "Priority": 2, "Action": {"Allow": {}}},
        ],
    }


class FakeAws:
    def __init__(self, overrides=None):
        self.calls = []
        self.overrides = overrides or {}

    def get(self, service, operation, *args):
        self.calls.append((service, operation, args))
        key = (service, operation)
        if key in self.overrides:
            response = self.overrides[key]
            if isinstance(response, Exception):
                raise response
            return copy.deepcopy(response)
        values = {
            ("sts", "get-caller-identity"): {"Account": m.ACCOUNT, "Arn": MARKER},
            ("ecs", "describe-services"): {
                "services": [
                    {
                        "desiredCount": 1,
                        "runningCount": 1,
                        "pendingCount": 0,
                        "taskDefinition": "definition:3",
                        "events": [{"message": MARKER}],
                        "loadBalancers": [{"targetGroupArn": MARKER}],
                    }
                ]
            },
            ("ecs", "list-tasks"): {"taskArns": [MARKER]},
            ("ecs", "describe-tasks"): {
                "tasks": [
                    {"taskDefinitionArn": "definition:2", "lastStatus": "RUNNING"}
                ]
            },
            ("ecs", "describe-task-definition"): {"taskDefinition": definition()},
            ("elbv2", "describe-target-groups"): {
                "TargetGroups": [{"LoadBalancerArns": [MARKER]}]
            },
            ("wafv2", "get-web-acl-for-resource"): {"WebACL": acl()},
            ("cloudwatch", "get-dashboard"): {
                "DashboardBody": json.dumps({"widgets": [{"markdown": MARKER}]})
            },
            ("cloudwatch", "describe-alarms"): {
                "MetricAlarms": [
                    {
                        "AlarmName": name,
                        "ActionsEnabled": False,
                        "StateValue": "OK",
                        "AlarmDescription": MARKER,
                        "StateReason": MARKER,
                        "AlarmActions": [MARKER],
                        "Threshold": 10,
                    }
                    for name in m.ALARM_NAMES.values()
                ]
            },
            ("cloudwatch", "get-metric-statistics"): {"Datapoints": []},
            ("sns", "list-subscriptions-by-topic"): {
                "Subscriptions": [
                    {
                        "Protocol": "email",
                        "Endpoint": MARKER,
                        "SubscriptionArn": "PendingConfirmation",
                    }
                ]
            },
            ("logs", "describe-log-groups"): {
                "logGroups": [{"logGroupName": MARKER, "retentionInDays": 30}]
            },
            ("logs", "describe-subscription-filters"): {
                "subscriptionFilters": [{"destinationArn": MARKER}]
            },
        }
        if key not in values:
            raise AssertionError(f"Unexpected API operation: {key}")
        return copy.deepcopy(values[key])


class InspectionTests(unittest.TestCase):
    def test_full_report_is_sanitized_and_uses_only_allowed_reads(self):
        aws = FakeAws()
        results = m.Inspector(aws).run()
        self.assertEqual(len(results), 9)
        self.assertTrue(all(r["status"] == "observed" for r in results))
        serialized = json.dumps(results)
        for value in (MARKER, "private.registry", "task-definition/test", "SECRET_KEY"):
            self.assertNotIn(value, serialized)
        self.assertTrue(all((s, op) in m.READ_OPERATIONS for s, op, _ in aws.calls))
        # A rolling deployment must report the actual running definition (2),
        # rather than claim the service's newly configured definition (3) is running.
        task = next(r for r in results if r["check"] == "tasks")
        self.assertEqual(task["details"]["definitions"][0]["revision"], 2)

    def test_wrong_account_stops_before_resource_queries(self):
        aws = FakeAws({("sts", "get-caller-identity"): {"Account": "wrong"}})
        results = m.Inspector(aws).run()
        self.assertFalse(results[0]["details"]["expected_account"])
        self.assertEqual(len(aws.calls), 1)

    def test_denied_check_does_not_prevent_other_checks(self):
        aws = FakeAws(
            {("cloudwatch", "get-dashboard"): m.InspectionError("access_denied")}
        )
        results = m.Inspector(aws).run()
        self.assertEqual(
            next(r for r in results if r["check"] == "dashboard")["status"],
            "access_denied",
        )
        self.assertEqual(results[-1]["status"], "observed")

    def test_exact_scope_and_cli_blob_are_recognized_without_echoing(self):
        for key in m.RULES:
            scope = m.expected_scope(key)
            self.assertTrue(m.scope_matches(scope, key))
            scope["AndStatement"]["Statements"].reverse()
            self.assertTrue(m.scope_matches(scope, key))
            if key == "upload_rate":
                scope["AndStatement"]["Statements"][0]["ByteMatchStatement"][
                    "SearchString"
                ] = "UE9TVA=="
                self.assertTrue(m.scope_matches(scope, key))
            scope["AndStatement"]["Statements"].append({"private": MARKER})
            self.assertFalse(m.scope_matches(scope, key))
        old = m.expected_scope("emergency")
        old["AndStatement"]["Statements"][0]["RegexMatchStatement"][
            "RegexString"
        ] = "^/readability/?$"
        self.assertFalse(m.scope_matches(old, "emergency"))

    def test_metric_queries_use_acl_resource_name_and_rule_metric_names(self):
        aws = FakeAws()
        m.Inspector(aws).run()
        waf_calls = [
            args
            for svc, op, args in aws.calls
            if op == "get-metric-statistics" and "AWS/WAFV2" in args
        ]
        self.assertEqual(len(waf_calls), 4)
        for args in waf_calls:
            dims = json.loads(args[args.index("--dimensions") + 1])
            rule = next(d["Value"] for d in dims if d["Name"] == "Rule")
            self.assertIn(rule, ("emergency-metric", "rate-metric"))
            self.assertEqual(
                next(d["Value"] for d in dims if d["Name"] == "WebACL"), MARKER
            )

    def test_missing_acl_name_does_not_fall_back_to_visibility_name(self):
        data = acl()
        del data["Name"]
        aws = FakeAws({("wafv2", "get-web-acl-for-resource"): {"WebACL": data}})
        rows = m.Inspector(aws).run()
        self.assertEqual(
            next(r for r in rows if r["check"] == "waf")["status"],
            "web_acl_name_missing",
        )
        self.assertFalse(
            any(
                "AWS/WAFV2" in args
                for _, op, args in aws.calls
                if op == "get-metric-statistics"
            )
        )

    def test_metric_sums_and_missing_names_are_explicit(self):
        aws = FakeAws(
            {
                ("cloudwatch", "get-metric-statistics"): {
                    "Datapoints": [
                        {"Sum": 3},
                        {"Sum": 2},
                        {"Sum": MARKER},
                        {"Sum": True},
                    ]
                }
            }
        )
        rows = m.Inspector(aws).run()
        metrics = next(r for r in rows if r["check"] == "metrics")["details"]
        self.assertEqual(metrics["emergency_CountedRequests"]["sum_last_hour"], 5)
        missing = acl()
        del missing["Rules"][0]["VisibilityConfig"]["MetricName"]
        aws = FakeAws({("wafv2", "get-web-acl-for-resource"): {"WebACL": missing}})
        rows = m.Inspector(aws).run()
        metrics = next(r for r in rows if r["check"] == "metrics")["details"]
        self.assertEqual(
            metrics["emergency_metric_query"]["status"], "metric_name_missing"
        )
        self.assertNotIn("emergency_CountedRequests", metrics)

    def test_empty_metrics_are_not_called_zero_usage(self):
        results = m.Inspector(FakeAws()).run()
        metrics = next(r for r in results if r["check"] == "metrics")["details"]
        self.assertEqual(len(metrics), 6)
        self.assertTrue(all(v["datapoints_last_hour"] == 0 for v in metrics.values()))
        self.assertIsNone(metrics["emergency_CountedRequests"]["sum_last_hour"])

    def test_missing_alarms_are_incomplete_not_success(self):
        results = m.Inspector(FakeAws({("cloudwatch", "describe-alarms"): {}})).run()
        result = next(r for r in results if r["check"] == "alarms")
        self.assertEqual(result["status"], "incomplete")
        self.assertFalse(result["details"]["complete"])

    def test_no_running_tasks_and_truncated_listing_are_explicit(self):
        for data, status in (
            ({}, "no_running_tasks"),
            ({"nextToken": MARKER}, "task_list_truncated"),
        ):
            results = m.Inspector(FakeAws({("ecs", "list-tasks"): data})).run()
            self.assertEqual(
                next(r for r in results if r["check"] == "tasks")["status"], status
            )
            self.assertNotIn(MARKER, json.dumps(results))

    def test_pending_subscriptions_do_not_claim_delivery(self):
        result = m.Inspector(FakeAws()).subscriptions()
        self.assertEqual(result["email"], 1)
        self.assertEqual(result["pending_confirmation"], 1)
        self.assertFalse(result["delivery_tested"])
        for operation, token in (("sns", "NextToken"), ("logs", "nextToken")):
            name = (
                "list-subscriptions-by-topic"
                if operation == "sns"
                else "describe-subscription-filters"
            )
            inspector = m.Inspector(FakeAws({(operation, name): {token: MARKER}}))
            inspector.log_groups = {MARKER}
            with self.assertRaises(m.InspectionError):
                inspector.subscriptions() if operation == "sns" else inspector.logs()

    def test_waf_modes_priorities_and_missing_rules(self):
        data = acl()
        summary = m.waf_summary(data)
        self.assertTrue(summary["pilot_rules_before_other_rules"])
        self.assertEqual(summary["rules"]["upload_rate"]["limit"], 10)
        data["Rules"][0]["Action"] = {"Block": {}}
        data["Rules"][0]["Priority"] = 5
        summary = m.waf_summary(data)
        self.assertFalse(summary["pilot_rules_before_other_rules"])
        self.assertEqual(summary["rules"]["emergency"]["action"], "Block")
        with self.assertRaises(m.InspectionError):
            m.waf_summary({"Rules": []})

    def test_arbitrary_aws_errors_are_not_exposed(self):
        inspector = m.Inspector(
            FakeAws({("cloudwatch", "get-dashboard"): RuntimeError(MARKER)})
        )
        results = inspector.run()
        self.assertNotIn(MARKER, json.dumps(results))
        self.assertEqual(
            next(r for r in results if r["check"] == "dashboard")["status"],
            "unexpected_response",
        )

    def test_main_reports_failure_for_partial_inspection_and_wrong_account(self):
        for overrides in (
            {},
            {("cloudwatch", "get-dashboard"): m.InspectionError("access_denied")},
            {("sts", "get-caller-identity"): {"Account": "wrong"}},
        ):
            with self.subTest(overrides=overrides), patch.object(
                m, "Aws", return_value=FakeAws(overrides)
            ), patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": ""}), redirect_stdout(
                io.StringIO()
            ) as out:
                code = m.main()
                self.assertEqual(code, 1 if overrides else 0)
                self.assertNotIn(MARKER, out.getvalue())
                self.assertIn("not a public-release approval", out.getvalue())

    def test_unset_recording_is_not_claimed_disabled_and_values_are_allowlisted(self):
        summary, _ = m.task_summary(definition())
        self.assertEqual(summary["public_recording_environment"], "false")
        self.assertEqual(
            summary["authenticated_recording_environment"],
            "unset; application default not inspected",
        )
        self.assertEqual(m.setting({"x": MARKER}, "x"), "other")
        self.assertEqual(m.setting({"x": MARKER}, "x", retention=True), "other")
        self.assertEqual(m.setting({"x": "90"}, "x", retention=True), 90)

    def test_session_policy_matches_exact_operation_allowlist(self):
        policy = json.loads(
            (ROOT / "scripts/nofo_inspection_session_policy.json").read_text()
        )
        self.assertEqual(len(policy["Statement"]), 1)
        statement = policy["Statement"][0]
        self.assertEqual(statement["Effect"], "Allow")
        self.assertEqual(
            set(statement["Action"]),
            set(m.READ_OPERATIONS.values()) | m.DEPENDENT_READ_ACTIONS,
        )
        self.assertFalse(any("*" in action for action in statement["Action"]))
        workflow = (ROOT / ".github/workflows/inspect-nofo-readability.yml").read_text()
        self.assertIn(
            "inline-session-policy: ${{ steps.policy.outputs.json }}", workflow
        )
        self.assertIn("github.ref == 'refs/heads/main'", workflow)
        self.assertNotIn("configure-aws-credentials/action.yml", workflow)
        self.assertNotIn(
            "terraform",
            workflow.lower().replace(
                "# avoid the deployment credential wrapper: no terraform init/apply or state reads.",
                "",
            ),
        )

    def test_mutating_and_content_read_operations_are_rejected_before_execution(self):
        aws = m.Aws()
        with patch.object(m.subprocess, "run") as run:
            for service, op in (
                ("ecs", "stop-task"),
                ("wafv2", "update-web-acl"),
                ("sns", "publish"),
                ("logs", "get-log-events"),
                ("ssm", "get-parameter"),
            ):
                with self.assertRaises(m.InspectionError):
                    aws.get(service, op)
            run.assert_not_called()

    def test_aws_failures_timeouts_and_malformed_output_have_fixed_categories(self):
        aws = m.Aws()
        cases = [
            (
                subprocess.CompletedProcess([], 1, MARKER, "AccessDenied " + MARKER),
                "access_denied",
            ),
            (
                subprocess.CompletedProcess(
                    [], 1, MARKER, "ResourceNotFound " + MARKER
                ),
                "not_found",
            ),
            (subprocess.CompletedProcess([], 1, MARKER, MARKER), "aws_request_failed"),
            (subprocess.CompletedProcess([], 0, MARKER, MARKER), "invalid_response"),
            (subprocess.CompletedProcess([], 0, "[]", ""), "invalid_response"),
        ]
        for response, category in cases:
            with patch.object(
                m.subprocess, "run", return_value=response
            ), self.assertRaisesRegex(m.InspectionError, "^" + category + "$"):
                aws.get("sts", "get-caller-identity")
        with patch.object(
            m.subprocess, "run", side_effect=subprocess.TimeoutExpired(MARKER, 1)
        ), self.assertRaisesRegex(m.InspectionError, "^request_timeout$"):
            aws.get("sts", "get-caller-identity")
        aws.deadline = 0
        with self.assertRaisesRegex(m.InspectionError, "^inspection_deadline$"):
            aws.get("sts", "get-caller-identity")


if __name__ == "__main__":
    unittest.main()
