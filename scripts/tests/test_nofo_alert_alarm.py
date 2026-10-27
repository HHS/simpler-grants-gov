"""Offline tests of alarm lifecycle, cleanup ownership, permissions and privacy."""

import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import boto3
from botocore.exceptions import ClientError, ReadTimeoutError
from botocore.stub import Stubber

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "alarm_delivery", ROOT / "scripts/test_nofo_alarm_delivery.py"
)
alarm = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(alarm)
PRIVATE = "synthetic-private@example.com"


def route():
    return {
        "Subscriptions": [
            {
                "Protocol": "email",
                "SubscriptionArn": alarm.TOPIC + ":synthetic",
                "Endpoint": PRIVATE,
            }
        ]
    }


def history(count):
    return {
        "AlarmHistoryItems": [
            {"HistorySummary": "Successfully executed action " + alarm.TOPIC}
            for _ in range(count)
        ]
    }


class AlarmTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.env = patch.dict(
            os.environ,
            {
                "GITHUB_REPOSITORY": "HHS/simpler-grants-gov",
                "GITHUB_REF": "refs/heads/main",
                "GITHUB_RUN_ID": "123",
                "GITHUB_RUN_ATTEMPT": "1",
                "RUNNER_TEMP": self.temp.name,
            },
        )
        self.env.start()
        self.addCleanup(self.env.stop)
        self.name, self.marker = alarm.context()
        self.cw, self.sns = MagicMock(), MagicMock()
        self.sns.list_subscriptions_by_topic.return_value = route()
        self.cw.describe_alarms.return_value = {"MetricAlarms": []}
        self.cw.describe_alarm_history.side_effect = [history(1), history(2)]

    def run_main(self, args=()):
        output = io.StringIO()
        with patch.object(sys, "argv", ["test"] + list(args)), patch.object(
            alarm,
            "client",
            side_effect=lambda service: {"cloudwatch": self.cw, "sns": self.sns}[
                service
            ],
        ), patch.object(alarm.time, "sleep"), contextlib.redirect_stdout(
            output
        ), contextlib.redirect_stderr(
            output
        ):
            status = alarm.main()
        self.assertNotIn(PRIVATE, output.getvalue())
        return status, output.getvalue()

    def test_success_creates_only_test_alarm_with_both_actions_and_cleans_up(self):
        status, output = self.run_main()
        self.assertEqual(status, 0)
        config = self.cw.put_metric_alarm.call_args.kwargs
        self.assertEqual(config["AlarmName"], self.name)
        self.assertEqual(config["AlarmActions"], [alarm.TOPIC])
        self.assertEqual(config["OKActions"], [alarm.TOPIC])
        self.assertEqual(config["InsufficientDataActions"], [])
        self.assertEqual(config["TreatMissingData"], "ignore")
        self.assertEqual(config["Namespace"], "NOFO/NotificationDeliveryTest")
        self.assertEqual(config["MetricName"], self.name)
        self.assertEqual(
            [
                call.kwargs["StateValue"]
                for call in self.cw.set_alarm_state.call_args_list
            ],
            ["ALARM", "OK"],
        )
        self.cw.delete_alarms.assert_called_once_with(AlarmNames=[self.name])
        self.assertFalse(self.marker.exists())
        self.sns.publish.assert_not_called()
        self.assertIn("does not prove receipt", output)

    def test_unconfirmed_or_changed_routing_never_creates_or_deletes(self):
        for response in (
            {"Subscriptions": []},
            {
                "Subscriptions": [
                    {"Protocol": "email", "SubscriptionArn": "PendingConfirmation"}
                ]
            },
            {**route(), "NextToken": PRIVATE},
            {"Subscriptions": [{"Protocol": "https"}]},
        ):
            with self.subTest(response=response):
                self.sns.list_subscriptions_by_topic.return_value = response
                self.assertEqual(self.run_main()[0], 1)
                self.cw.put_metric_alarm.assert_not_called()
                self.cw.delete_alarms.assert_not_called()

    def test_existing_alarm_is_never_modified_or_deleted(self):
        self.cw.describe_alarms.return_value = {
            "MetricAlarms": [{"AlarmName": self.name}]
        }
        self.assertEqual(self.run_main()[0], 1)
        self.cw.put_metric_alarm.assert_not_called()
        self.cw.delete_alarms.assert_not_called()

    def test_create_timeout_still_cleans_up_without_printing_response(self):
        self.cw.put_metric_alarm.side_effect = ReadTimeoutError(endpoint_url=PRIVATE)
        self.assertEqual(self.run_main()[0], 1)
        self.cw.delete_alarms.assert_called_once_with(AlarmNames=[self.name])
        self.cw.set_alarm_state.assert_not_called()

    def test_failed_transition_cleans_up_and_does_not_claim_receipt(self):
        self.cw.set_alarm_state.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": PRIVATE}}, "SetAlarmState"
        )
        status, output = self.run_main()
        self.assertEqual(status, 1)
        self.assertNotIn("AWS recorded ALARM and OK", output)
        self.assertIn("operation=SetAlarmState, category=AccessDenied", output)
        self.cw.delete_alarms.assert_called_once()

    def test_missing_action_evidence_times_out_and_cleans_up(self):
        self.cw.describe_alarm_history.side_effect = None
        self.cw.describe_alarm_history.return_value = history(0)
        status, output = self.run_main()
        self.assertEqual(status, 1)
        self.assertIn("Timed out", output)
        self.assertEqual(self.cw.describe_alarm_history.call_count, 12)
        self.assertEqual(self.cw.set_alarm_state.call_count, 1)
        self.cw.delete_alarms.assert_called_once()

    def test_recovery_requires_its_own_action_evidence(self):
        self.cw.describe_alarm_history.side_effect = [history(1)] + [history(0)] * 12
        status, output = self.run_main()
        self.assertEqual(status, 1)
        self.assertIn("test ALARM notification action", output)
        self.assertNotIn("test OK notification action", output)
        self.assertEqual(self.cw.set_alarm_state.call_count, 2)
        self.cw.delete_alarms.assert_called_once()

    def test_unexpected_history_never_claims_success(self):
        for response in (
            {"AlarmHistoryItems": [{"HistorySummary": PRIVATE}]},
            {**history(1), "NextToken": PRIVATE},
        ):
            with self.subTest(response=response):
                self.cw.describe_alarm_history.side_effect = None
                self.cw.describe_alarm_history.return_value = response
                status, output = self.run_main()
                self.assertEqual(status, 1)
                self.assertNotIn("AWS recorded ALARM and OK", output)
                self.assertFalse(self.marker.exists())

    def test_failed_cleanup_is_visible_and_marker_allows_retry(self):
        self.cw.delete_alarms.side_effect = ReadTimeoutError(endpoint_url=PRIVATE)
        self.assertEqual(self.run_main()[0], 1)
        self.assertTrue(self.marker.exists())
        self.cw.delete_alarms.side_effect = None
        self.assertEqual(self.run_main(["--cleanup"])[0], 0)
        self.assertFalse(self.marker.exists())

    def test_cleanup_without_owned_marker_never_deletes(self):
        self.assertEqual(self.run_main(["--cleanup"])[0], 0)
        self.cw.delete_alarms.assert_not_called()
        self.marker.write_text("different-alarm")
        self.assertEqual(self.run_main(["--cleanup"])[0], 1)
        self.cw.delete_alarms.assert_not_called()

    def test_wrong_repo_branch_or_run_identity_cannot_mutate(self):
        for key, value in (
            ("GITHUB_REPOSITORY", "fork/repo"),
            ("GITHUB_REF", "refs/heads/other"),
            ("GITHUB_RUN_ID", "../bad"),
            ("GITHUB_RUN_ATTEMPT", ""),
        ):
            with self.subTest(key=key), patch.dict(os.environ, {key: value}):
                self.assertEqual(self.run_main()[0], 1)
        self.cw.put_metric_alarm.assert_not_called()
        self.cw.delete_alarms.assert_not_called()

    def test_policy_limits_actions_to_test_alarm_prefix_and_subscription_check(self):
        policy = json.loads(
            (ROOT / "scripts/nofo_alarm_delivery_session_policy.json").read_text()
        )
        self.assertEqual(
            policy["Statement"],
            [
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:DescribeAlarms",
                        "cloudwatch:PutMetricAlarm",
                        "cloudwatch:SetAlarmState",
                        "cloudwatch:DescribeAlarmHistory",
                        "cloudwatch:DeleteAlarms",
                    ],
                    "Resource": "arn:aws:cloudwatch:us-east-1:061664787759:alarm:"
                    + alarm.PREFIX
                    + "*",
                },
                {
                    "Effect": "Allow",
                    "Action": "sns:ListSubscriptionsByTopic",
                    "Resource": alarm.TOPIC,
                },
            ],
        )

    def test_sdk_validates_alarm_request_shapes_without_aws(self):
        cw = boto3.client(
            "cloudwatch",
            region_name="us-east-1",
            aws_access_key_id="synthetic",
            aws_secret_access_key="synthetic",
        )
        sns = boto3.client(
            "sns",
            region_name="us-east-1",
            aws_access_key_id="synthetic",
            aws_secret_access_key="synthetic",
        )
        with Stubber(cw) as cws, Stubber(sns) as snss:
            snss.add_response(
                "list_subscriptions_by_topic", route(), {"TopicArn": alarm.TOPIC}
            )
            cws.add_response(
                "describe_alarms", {"MetricAlarms": []}, {"AlarmNames": [self.name]}
            )
            cws.add_response("put_metric_alarm", {})
            for count in (1, 2):
                cws.add_response("set_alarm_state", {})
                cws.add_response("describe_alarm_history", history(count))
            cws.add_response("delete_alarms", {}, {"AlarmNames": [self.name]})
            cws.add_response(
                "describe_alarms", {"MetricAlarms": []}, {"AlarmNames": [self.name]}
            )
            self.cw, self.sns = cw, sns
            self.assertEqual(self.run_main()[0], 0)
            cws.assert_no_pending_responses()
            snss.assert_no_pending_responses()


if __name__ == "__main__":
    unittest.main()
