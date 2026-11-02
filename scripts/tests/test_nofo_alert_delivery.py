"""Offline delivery-test safeguards; never sends notifications."""

import contextlib
import importlib.util
import io
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

from botocore.exceptions import ClientError, ReadTimeoutError

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "delivery", ROOT / "scripts/send_nofo_alert_test.py"
)
delivery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(delivery)
PRIVATE = "synthetic-private@example.com"


class DeliveryTests(unittest.TestCase):
    def run_main(self, rows=None, error=None, ref="refs/heads/main", next_token=None):
        output = io.StringIO()
        with patch.dict(
            os.environ,
            {"GITHUB_REPOSITORY": "HHS/simpler-grants-gov", "GITHUB_REF": ref},
        ), patch.object(
            delivery.boto3, "client"
        ) as factory, contextlib.redirect_stdout(
            output
        ), contextlib.redirect_stderr(
            output
        ):
            client = factory.return_value
            client.list_subscriptions_by_topic.return_value = {
                "Subscriptions": (
                    rows
                    if rows is not None
                    else [
                        {
                            "Protocol": "email",
                            "SubscriptionArn": delivery.TOPIC + ":synthetic",
                            "Endpoint": PRIVATE,
                        }
                    ]
                ),
                "NextToken": next_token,
            }
            client.publish.side_effect = error
            status = delivery.main()
        self.assertNotIn(PRIVATE, output.getvalue())
        return status, output.getvalue(), client

    def test_confirmed_single_email_gets_one_fixed_test_with_no_setting_changes(self):
        status, text, client = self.run_main()
        self.assertEqual(status, 0)
        client.list_subscriptions_by_topic.assert_called_once_with(
            TopicArn=delivery.TOPIC
        )
        client.publish.assert_called_once()
        self.assertEqual(client.publish.call_args.kwargs["TopicArn"], delivery.TOPIC)
        self.assertEqual(
            client.publish.call_args.kwargs["Subject"],
            "TEST: NOFO Builder dev email delivery",
        )
        self.assertIn("An inbox holder must verify receipt", text)
        self.assertEqual(
            [call[0] for call in client.method_calls],
            ["list_subscriptions_by_topic", "publish"],
        )

    def test_pending_missing_extra_or_non_email_routes_never_publish(self):
        for rows, token in (
            ([], None),
            ([{"Protocol": "email", "SubscriptionArn": "PendingConfirmation"}], None),
            ([{"Protocol": "https"}], None),
            ([{}, {}], None),
            ([], PRIVATE),
        ):
            with self.subTest(rows=rows):
                status, _, client = self.run_main(rows=rows, next_token=token)
                self.assertEqual(status, 1)
                client.publish.assert_not_called()

    def test_service_errors_and_timeouts_never_print_private_details(self):
        malformed = ClientError(
            {"Error": {"Code": "test", "Message": PRIVATE}}, "Publish"
        )
        malformed.response = {"Error": [PRIVATE]}
        for error in (
            ClientError(
                {"Error": {"Code": "AuthorizationError", "Message": PRIVATE}}, "Publish"
            ),
            ClientError({"Error": {"Code": PRIVATE, "Message": PRIVATE}}, "Publish"),
            ReadTimeoutError(endpoint_url=PRIVATE),
            malformed,
        ):
            status, _, client = self.run_main(error=error)
            self.assertEqual(status, 1)
            client.publish.assert_called_once()

    def test_other_branch_cannot_send(self):
        status, _, client = self.run_main(ref="refs/heads/other")
        self.assertEqual(status, 1)
        client.publish.assert_not_called()

    def test_policy_only_allows_subscription_check_and_publish_to_fixed_dev_topic(self):
        policy = json.loads(
            (ROOT / "scripts/nofo_alert_delivery_session_policy.json").read_text()
        )
        self.assertEqual(
            policy["Statement"],
            [
                {
                    "Effect": "Allow",
                    "Action": ["sns:ListSubscriptionsByTopic", "sns:Publish"],
                    "Resource": delivery.TOPIC,
                }
            ],
        )


if __name__ == "__main__":
    unittest.main()
