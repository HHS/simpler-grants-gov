"""Offline privacy, pagination, scope and SDK checks; never reads live logs."""

import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import boto3
from botocore.exceptions import ClientError, ReadTimeoutError
from botocore.stub import Stubber

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "triage", ROOT / "scripts/diagnose_nofo_dev_errors.py"
)
triage = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(triage)
PRIVATE = "private@example.com/document-secret?token=synthetic"
START, END = map(datetime.fromisoformat, triage.WINDOWS[0])


class DevErrorTests(unittest.TestCase):
    def setUp(self):
        self.logs, self.cw = MagicMock(), MagicMock()
        self.logs.filter_log_events.return_value = {"events": []}
        self.cw.get_metric_statistics.return_value = {"Datapoints": []}
        self.cw.describe_alarm_history.return_value = {"AlarmHistoryItems": []}

    def run_main(self, repo="HHS/simpler-grants-gov", ref="refs/heads/main"):
        output = io.StringIO()
        with tempfile.TemporaryDirectory() as folder:
            summary = Path(folder) / "summary"
            with patch.dict(
                os.environ,
                {
                    "GITHUB_REPOSITORY": repo,
                    "GITHUB_REF": ref,
                    "GITHUB_STEP_SUMMARY": str(summary),
                },
            ), patch.object(sys, "argv", ["diagnose"]), patch.object(
                triage,
                "client",
                side_effect=lambda service: {"logs": self.logs, "cloudwatch": self.cw}[
                    service
                ],
            ), contextlib.redirect_stdout(
                output
            ), contextlib.redirect_stderr(
                output
            ):
                status = triage.main()
            result = output.getvalue()
            if summary.exists():
                result += summary.read_text()
        self.assertNotIn(PRIVATE, result)
        return status, result

    def test_private_fields_and_unknown_labels_never_escape(self):
        self.logs.filter_log_events.return_value = {
            "events": [
                {
                    "message": json.dumps(
                        {
                            "status": 500,
                            "levelname": "ERROR",
                            "url": "/nofos/" + PRIVATE,
                            "exception_type": "OperationalError",
                            "exception_message": PRIVATE,
                            "traceback": PRIVATE,
                            "user_id": PRIVATE,
                            "message": PRIVATE,
                        }
                    ),
                    "logStreamName": PRIVATE,
                    "eventId": PRIVATE,
                }
            ]
        }
        status, output = self.run_main()
        self.assertEqual(status, 0)
        self.assertIn('"route_nofos": 1', output)
        self.assertIn('"exception_OperationalError": 1', output)
        self.logs.filter_log_events.return_value = {
            "events": [
                {
                    "message": json.dumps(
                        {"status": 503, "url": "/" + PRIVATE, "exception_type": PRIVATE}
                    )
                }
            ]
        }
        status, output = self.run_main()
        self.assertEqual(status, 0)
        self.assertIn('"exception_unknown": 1', output)
        self.assertIn('"route_other": 1', output)

    def test_non_json_and_malformed_fields_are_not_echoed(self):
        for message in (
            PRIVATE,
            "WORKER TIMEOUT " + PRIVATE,
            "[]",
            "null",
            json.dumps(
                {"levelname": "ERROR", "exception_type": [PRIVATE], "url": [PRIVATE]}
            ),
        ):
            self.logs.filter_log_events.return_value = {
                "events": [{"message": message}]
            }
            self.assertEqual(self.run_main()[0], 0)

    def test_route_labels_never_include_ids_or_query_parameters(self):
        for value, expected in (
            ("/readability/?" + PRIVATE, "readability"),
            ("/readability-checker/?" + PRIVATE, "readability-checker"),
            ("/nofos/private-id/readability-metrics", "nofos"),
            ("/admin/secret", "admin"),
            ("/", "home"),
            ("/readability-" + PRIVATE, "other"),
            (None, "unknown"),
            ("http://[invalid", "unknown"),
        ):
            with self.subTest(value=value):
                self.assertEqual(triage.route_family(value), expected)

    def test_filtered_queries_keep_timeout_results_separate(self):
        def response(**args):
            if args["filterPattern"] == triage.ERROR_FILTER:
                return {
                    "events": [
                        {
                            "message": json.dumps(
                                {
                                    "levelname": "ERROR",
                                    "status": 503,
                                    "url": "/readability-checker/?" + PRIVATE,
                                    "exception_type": "TimeoutError",
                                    "message": PRIVATE,
                                }
                            )
                        }
                    ]
                }
            self.assertEqual(args["filterPattern"], triage.WORKER_FILTER)
            return {"events": [{"message": "[CRITICAL] WORKER TIMEOUT " + PRIVATE}]}

        self.logs.filter_log_events.side_effect = response
        status, output = self.run_main()
        self.assertEqual(status, 0)
        self.assertIn('"route_readability-checker": 1', output)
        self.assertIn('"worker_timeout_markers": 1', output)
        self.assertEqual(self.logs.filter_log_events.call_count, 4)

    def test_timeout_query_failure_does_not_hide_structured_results(self):
        def response(**args):
            if args["filterPattern"] == triage.WORKER_FILTER:
                raise ReadTimeoutError(endpoint_url=PRIVATE)
            return {"events": [{"message": '{"status_code":502}'}]}

        self.logs.filter_log_events.side_effect = response
        status, output = self.run_main()
        self.assertEqual(status, 1)
        self.assertIn('"status_502": 1', output)
        self.assertIn('"request_or_processing_failed"', output)

    def test_empty_page_with_token_is_followed(self):
        self.logs.filter_log_events.side_effect = [
            {"events": [], "nextToken": PRIVATE},
            {"events": [{"message": '{"status":500}'}]},
        ]
        result = triage.logs_report(self.logs, START, END, float("inf"))
        self.assertTrue(result["complete"])
        self.assertEqual(result["events_scanned"], 1)
        self.assertEqual(self.logs.filter_log_events.call_count, 2)
        self.assertEqual(
            self.logs.filter_log_events.call_args.kwargs["nextToken"], PRIVATE
        )
        self.assertNotIn(PRIVATE, json.dumps(result))

    def test_repeated_token_page_limit_and_deadline_are_incomplete(self):
        self.logs.filter_log_events.return_value = {"events": [], "nextToken": PRIVATE}
        result = triage.logs_report(self.logs, START, END, float("inf"))
        self.assertFalse(result["complete"])
        self.assertEqual(result["reason"], "repeated_token")
        self.logs.filter_log_events.side_effect = [
            {"events": [], "nextToken": str(i)} for i in range(10)
        ]
        self.assertEqual(
            triage.logs_report(self.logs, START, END, float("inf"))["reason"],
            "page_limit",
        )
        self.assertEqual(
            triage.logs_report(self.logs, START, END, 0)["reason"], "deadline"
        )

    def test_incomplete_scan_makes_run_fail(self):
        self.logs.filter_log_events.return_value = {"events": [], "nextToken": PRIVATE}
        status, output = self.run_main()
        self.assertEqual(status, 1)
        self.assertIn('"complete": false', output)

    def test_missing_metric_is_null_not_zero_and_non_numeric_values_are_rejected(self):
        result = triage.metrics_report(self.cw, START, END)
        self.assertIsNone(result["HTTPCode_Target_5XX_Count"]["sum"])
        self.cw.get_metric_statistics.return_value = {
            "Datapoints": [
                {"Sum": PRIVATE},
                {"Sum": float("nan")},
                {"Sum": True},
                {"Sum": 2},
                {"Average": float("inf")},
                {"Average": 75},
            ]
        }
        result = triage.metrics_report(self.cw, START, END)
        self.assertEqual(result["HTTPCode_Target_5XX_Count"]["sum"], 2)
        self.assertEqual(result["CPUUtilization"]["max_one_minute_average"], 75)
        self.assertNotIn(PRIVATE, json.dumps(result))

    def test_alarm_history_never_copies_reasons_or_messages_and_marks_pagination(self):
        self.cw.describe_alarm_history.return_value = {
            "AlarmHistoryItems": [{"HistoryData": PRIVATE, "HistorySummary": PRIVATE}],
            "NextToken": PRIVATE,
        }
        result = triage.alarm_report(self.cw, START, END)
        self.assertEqual(result, {"state_update_records": 1, "complete": False})

    def test_aws_failures_are_safe_and_keep_other_checks(self):
        for error in (
            ClientError(
                {"Error": {"Code": "AccessDeniedException", "Message": PRIVATE}},
                "FilterLogEvents",
            ),
            ClientError(
                {"Error": {"Code": PRIVATE, "Message": PRIVATE}}, "FilterLogEvents"
            ),
            ReadTimeoutError(endpoint_url=PRIVATE),
        ):
            self.logs.filter_log_events.side_effect = error
            status, output = self.run_main()
            self.assertEqual(status, 1)
            self.assertIn('"metrics"', output)
            self.assertIn('"status": "failed"', output)

    def test_only_main_and_upstream_can_read(self):
        self.assertEqual(self.run_main(repo="fork/repo")[0], 1)
        self.assertEqual(self.run_main(ref="refs/heads/other")[0], 1)
        self.logs.filter_log_events.assert_not_called()
        self.cw.get_metric_statistics.assert_not_called()

    def test_policy_is_read_only_with_one_log_group_and_alarm(self):
        statements = json.loads(
            (ROOT / "scripts/nofo_dev_error_session_policy.json").read_text()
        )["Statement"]
        self.assertEqual(
            [row["Action"] for row in statements],
            [
                "logs:FilterLogEvents",
                "cloudwatch:DescribeAlarmHistory",
                "cloudwatch:GetMetricStatistics",
            ],
        )
        self.assertEqual(
            statements[0]["Resource"],
            "arn:aws:logs:us-east-1:061664787759:log-group:service/nofos-infra-dev:*",
        )
        self.assertEqual(
            statements[1]["Resource"],
            "arn:aws:cloudwatch:us-east-1:061664787759:alarm:" + triage.ALARM,
        )
        self.assertEqual(
            statements[2]["Condition"],
            {"StringEquals": {"aws:RequestedRegion": "us-east-1"}},
        )

    def test_sdk_requests_use_only_fixed_group_alarm_dimensions_and_windows(self):
        self.logs = boto3.client(
            "logs",
            region_name="us-east-1",
            aws_access_key_id="synthetic",
            aws_secret_access_key="synthetic",
        )
        self.cw = boto3.client(
            "cloudwatch",
            region_name="us-east-1",
            aws_access_key_id="synthetic",
            aws_secret_access_key="synthetic",
        )
        with Stubber(self.logs) as logs_stub, Stubber(self.cw) as cw_stub:
            for begin, finish in triage.WINDOWS:
                start, end = datetime.fromisoformat(begin), datetime.fromisoformat(
                    finish
                )
                for pattern in (triage.ERROR_FILTER, triage.WORKER_FILTER):
                    logs_stub.add_response(
                        "filter_log_events",
                        {"events": []},
                        {
                            "logGroupName": triage.LOG_GROUP,
                            "filterPattern": pattern,
                            "startTime": int(start.timestamp() * 1000),
                            "endTime": int(end.timestamp() * 1000),
                            "limit": 500,
                        },
                    )
                for metric in (
                    "HTTPCode_Target_5XX_Count",
                    "HTTPCode_ELB_5XX_Count",
                    "RequestCount",
                    "CPUUtilization",
                    "MemoryUtilization",
                ):
                    ecs = metric in ("CPUUtilization", "MemoryUtilization")
                    cw_stub.add_response(
                        "get_metric_statistics",
                        {"Datapoints": []},
                        {
                            "Namespace": "AWS/ECS" if ecs else "AWS/ApplicationELB",
                            "MetricName": metric,
                            "Dimensions": (
                                [
                                    {"Name": "ClusterName", "Value": triage.SERVICE},
                                    {"Name": "ServiceName", "Value": triage.SERVICE},
                                ]
                                if ecs
                                else [
                                    {
                                        "Name": "LoadBalancer",
                                        "Value": triage.LOAD_BALANCER,
                                    }
                                ]
                            ),
                            "StartTime": start,
                            "EndTime": end,
                            "Period": 60,
                            "Statistics": ["Average" if ecs else "Sum"],
                        },
                    )
                cw_stub.add_response(
                    "describe_alarm_history",
                    {"AlarmHistoryItems": []},
                    {
                        "AlarmName": triage.ALARM,
                        "HistoryItemType": "StateUpdate",
                        "StartDate": start,
                        "EndDate": end,
                        "MaxRecords": 100,
                    },
                )
            self.assertEqual(self.run_main()[0], 0)
            logs_stub.assert_no_pending_responses()
            cw_stub.assert_no_pending_responses()


if __name__ == "__main__":
    unittest.main()
