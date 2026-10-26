"""Private request handling and SDK validation without AWS access."""

import contextlib
import importlib.util
import io
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

import boto3
from botocore.exceptions import (ClientError, NoCredentialsError,
                                 ReadTimeoutError)
from botocore.stub import Stubber

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "setup", ROOT / "scripts/create_nofo_alert_parameter.py"
)
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)
EMAIL = "synthetic-alerts@example.com"


class SetupTests(unittest.TestCase):
    def run_main(self, validate=False, value=EMAIL, error=None):
        output, errors = io.StringIO(), io.StringIO()
        args = ["setup"] + (["--validate-only"] if validate else [])
        with patch.dict(os.environ, {setup.SECRET: value}), patch(
            "sys.argv", args
        ), patch.object(setup.boto3, "client") as factory, contextlib.redirect_stdout(
            output
        ), contextlib.redirect_stderr(
            errors
        ):
            factory.return_value.put_parameter.side_effect = error
            status = setup.main()
        text = output.getvalue() + errors.getvalue()
        self.assertNotIn(EMAIL, text)
        return status, text, factory

    def test_validate_only_and_invalid_secrets_never_create_aws_client(self):
        status, _, factory = self.run_main(validate=True)
        self.assertEqual(status, 0)
        factory.assert_not_called()
        for value in ("", "bad", EMAIL + "\nsecond@example.com", "a\x01@b.com"):
            status, _, factory = self.run_main(value=value)
            self.assertEqual(status, 1)
            factory.assert_not_called()

    def test_creation_uses_fixed_sdk_request_and_disables_retries(self):
        status, _, factory = self.run_main(value=" " + EMAIL + " ")
        self.assertEqual(status, 0)
        self.assertEqual(factory.call_args.args, ("ssm",))
        self.assertEqual(factory.call_args.kwargs["region_name"], "us-east-1")
        self.assertEqual(
            factory.call_args.kwargs["config"].retries["total_max_attempts"], 1
        )
        factory.return_value.put_parameter.assert_called_once_with(
            **setup.parameter_payload(EMAIL)
        )
        payload = factory.return_value.put_parameter.call_args.kwargs
        self.assertEqual(payload["Name"], "/nofos/infra-dev/monitoring/alert-email")
        self.assertEqual(payload["Type"], "SecureString")
        self.assertEqual(payload["KeyId"], "alias/aws/ssm")
        self.assertEqual(payload["Tier"], "Standard")
        self.assertIs(payload["Overwrite"], False)

    def test_service_errors_only_emit_fixed_categories_not_error_messages(self):
        for code, message in (
            ("ParameterAlreadyExists", "not read or overwritten"),
            ("AccessDeniedException", "ssm:PutParameter"),
            ("ValidationException", "category=ValidationException"),
            ("InvalidKeyId", "category=InvalidKeyId"),
            (EMAIL, "category=unclassified"),
        ):
            with self.subTest(code=code):
                error = ClientError(
                    {"Error": {"Code": code, "Message": EMAIL}}, "PutParameter"
                )
                status, text, factory = self.run_main(error=error)
                self.assertEqual(status, 1)
                self.assertIn(message, text)
                factory.return_value.put_parameter.assert_called_once()

    def test_transport_and_unexpected_failures_do_not_expose_exception_text(self):
        for error in (ReadTimeoutError(endpoint_url=EMAIL), RuntimeError(EMAIL)):
            status, text, factory = self.run_main(error=error)
            self.assertEqual(status, 1)
            self.assertIn("unconfirmed", text)
            factory.return_value.put_parameter.assert_called_once()

    def test_missing_credentials_are_classified_without_response_details(self):
        status, text, _ = self.run_main(error=NoCredentialsError())
        self.assertEqual(status, 1)
        self.assertIn("credentials unavailable", text)

    def test_real_sdk_validates_request_with_stubbed_service_response(self):
        # Dummy credentials, a closed loopback endpoint and Stubber keep this offline.
        client = boto3.client(
            "ssm",
            region_name="us-east-1",
            aws_access_key_id="synthetic",
            aws_secret_access_key="synthetic",
            endpoint_url="http://127.0.0.1:9",
        )
        with Stubber(client) as stubber:
            stubber.add_response(
                "put_parameter",
                {"Version": 1, "Tier": "Standard"},
                setup.parameter_payload(EMAIL),
            )
            with patch.object(setup.boto3, "client", return_value=client):
                setup.create(EMAIL)
            stubber.assert_no_pending_responses()

    def test_policy_only_allows_fixed_parameter_creation_and_contextual_encryption(
        self,
    ):
        policy = json.loads(
            (ROOT / "scripts/nofo_alert_setup_session_policy.json").read_text()
        )
        put, encrypt = policy["Statement"]
        self.assertEqual(len(policy["Statement"]), 2)
        arn = "arn:aws:ssm:us-east-1:061664787759:parameter/nofos/infra-dev/monitoring/alert-email"
        self.assertEqual(
            put,
            {
                "Effect": "Allow",
                "Action": "ssm:PutParameter",
                "Resource": arn,
                "Condition": {"Bool": {"ssm:Overwrite": "false"}},
            },
        )
        self.assertEqual(encrypt["Effect"], "Allow")
        self.assertEqual(encrypt["Action"], "kms:Encrypt")
        self.assertEqual(
            encrypt["Resource"], "arn:aws:kms:us-east-1:061664787759:key/*"
        )
        self.assertEqual(
            encrypt["Condition"],
            {
                "StringEquals": {
                    "kms:ViaService": "ssm.us-east-1.amazonaws.com",
                    "kms:EncryptionContext:PARAMETER_ARN": arn,
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
