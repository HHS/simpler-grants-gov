"""Exercise private input handling and fixed AWS write scope without AWS access."""

import contextlib
import importlib.util
import io
import json
import os
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "setup", ROOT / "scripts/create_nofo_alert_parameter.py"
)
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)
EMAIL = "synthetic-alerts@example.com"


class SetupTests(unittest.TestCase):
    def run_main(self, result=None, validate=False, value=EMAIL, error=None):
        output, errors = io.StringIO(), io.StringIO()
        args = ["setup"] + (["--validate-only"] if validate else [])
        with patch.dict(os.environ, {setup.SECRET: value}), patch(
            "sys.argv", args
        ), patch.object(
            setup.subprocess, "run", return_value=result, side_effect=error
        ) as call, contextlib.redirect_stdout(
            output
        ), contextlib.redirect_stderr(
            errors
        ):
            status = setup.main()
        text = output.getvalue() + errors.getvalue()
        self.assertNotIn(EMAIL, text)
        return status, text, call

    def test_validate_only_does_not_call_aws(self):
        status, _, call = self.run_main(validate=True)
        self.assertEqual(status, 0)
        call.assert_not_called()

    def test_missing_or_invalid_secret_never_calls_aws(self):
        for value in ("", "bad", EMAIL + "\nsecond@example.com", "a\x01@b.com"):
            with self.subTest(value=value):
                status, _, call = self.run_main(value=value)
                self.assertEqual(status, 1)
                call.assert_not_called()

    def test_creation_passes_secret_only_via_stdin_and_drops_raw_response(self):
        status, _, call = self.run_main(
            result=subprocess.CompletedProcess([], 0, stdout=EMAIL, stderr=EMAIL),
            value=" " + EMAIL + " ",
        )
        self.assertEqual(status, 0)
        command = call.call_args.args[0]
        arguments = call.call_args.kwargs
        self.assertNotIn(EMAIL, " ".join(command))
        self.assertNotIn(setup.SECRET, arguments["env"])
        self.assertEqual(
            command,
            [
                "aws",
                "ssm",
                "put-parameter",
                "--region",
                "us-east-1",
                "--cli-input-json",
                "file:///dev/stdin",
                "--no-cli-pager",
            ],
        )
        payload = json.loads(arguments["input"])
        self.assertEqual(payload["Value"], EMAIL)
        self.assertEqual(payload["Name"], "/nofos/infra-dev/monitoring/alert-email")
        self.assertEqual(payload["Type"], "SecureString")
        self.assertEqual(payload["KeyId"], "alias/aws/ssm")
        self.assertEqual(payload["Tier"], "Standard")
        self.assertIs(payload["Overwrite"], False)
        self.assertTrue(arguments["capture_output"])
        call.assert_called_once()

    def test_existing_parameter_and_denials_fail_without_read_or_retry(self):
        for code, message in (
            ("ParameterAlreadyExists", "not read or overwritten"),
            ("AccessDeniedException", "ssm:PutParameter"),
            ("OtherFailure", "Raw output was suppressed"),
        ):
            with self.subTest(code=code):
                status, text, call = self.run_main(
                    result=subprocess.CompletedProcess(
                        [], 1, stdout=EMAIL, stderr=code + EMAIL
                    )
                )
                self.assertEqual(status, 1)
                self.assertIn(message, text)
                call.assert_called_once()

    def test_timeout_does_not_print_exception_input_or_output(self):
        status, text, call = self.run_main(
            error=subprocess.TimeoutExpired([EMAIL], 45, output=EMAIL, stderr=EMAIL)
        )
        self.assertEqual(status, 1)
        self.assertIn("Result is unconfirmed", text)
        call.assert_called_once()

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
