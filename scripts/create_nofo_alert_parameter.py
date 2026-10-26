"""Create the fixed infra-dev email parameter without logging its private value."""

import argparse
import json
import os
import re
import subprocess
import sys

PARAMETER = "/nofos/infra-dev/monitoring/alert-email"
REGION = "us-east-1"
SECRET = "NOFO_INFRA_DEV_ALERT_EMAIL"


def recipient():
    value = os.environ.get(SECRET, "").strip()
    if not re.fullmatch(
        r"[^@\s\x00-\x1f\x7f]+@[^@\s\x00-\x1f\x7f]+\.[^@\s\x00-\x1f\x7f]+", value
    ):
        raise ValueError(
            "The private email secret is missing or invalid; no AWS write attempted."
        )
    return value


def parameter_payload(value):
    return {
        "Name": PARAMETER,
        "Value": value,
        "Type": "SecureString",
        "KeyId": "alias/aws/ssm",
        "Tier": "Standard",
        "Overwrite": False,
        "Description": "Private NOFO infra-dev operational alert recipient",
    }


def failure_category(stderr):
    # Only fixed labels may leave this function, never captured response text.
    for code in (
        "ValidationException",
        "InvalidKeyId",
        "ParameterLimitExceeded",
        "ParameterPatternMismatchException",
        "InternalServerError",
        "ThrottlingException",
        "TooManyUpdates",
        "ExpiredTokenException",
        "UnrecognizedClientException",
    ):
        if (
            f"An error occurred ({code}) when calling the PutParameter operation"
            in stderr
        ):
            return code
    for marker, label in (
        ("Unable to load paramfile", "cli_input_file"),
        ("Invalid JSON", "cli_input_json"),
        ("Unknown options:", "cli_options"),
        ("Unable to locate credentials", "credentials_unavailable"),
        ("Could not connect to the endpoint", "endpoint_unreachable"),
    ):
        if marker in stderr:
            return label
    return "unclassified"


def create(value):
    # Keep the value off the command line and disk, and out of the child environment.
    environment = {k: v for k, v in os.environ.items() if k != SECRET}
    environment.update(AWS_PAGER="", AWS_CLI_AUTO_PROMPT="off", AWS_MAX_ATTEMPTS="1")
    result = subprocess.run(
        [
            "aws",
            "ssm",
            "put-parameter",
            "--region",
            REGION,
            "--cli-input-json",
            "file:///dev/stdin",
            "--no-cli-pager",
        ],
        input=json.dumps(parameter_payload(value)),
        text=True,
        capture_output=True,
        env=environment,
        timeout=45,
        check=False,
    )
    if result.returncode:
        # Never relay raw AWS errors: they may contain request data.
        if "ParameterAlreadyExists" in result.stderr:
            raise RuntimeError(
                "Parameter already exists. It was not read or overwritten; ask the operator to confirm existing setup privately."
            )
        if any(
            code in result.stderr for code in ("AccessDenied", "UnauthorizedOperation")
        ):
            raise RuntimeError(
                "AWS denied parameter creation or encryption. Ask infrastructure support to check ssm:PutParameter and kms:Encrypt for the fixed dev parameter; no permissions were changed."
            )
        raise RuntimeError(
            f"AWS parameter creation failed (category={failure_category(result.stderr)}, "
            f"cli_exit={result.returncode if type(result.returncode) is int and 0 <= result.returncode <= 255 else 'unknown'}). "
            "Raw output was suppressed to protect the recipient; no automatic retry or overwrite was attempted."
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    try:
        value = recipient()
        if args.validate_only:
            print("Private email input validated; no AWS call made.")
        else:
            create(value)
            print(
                "Created the encrypted infra-dev alert parameter. No subscription, notification or deployment was performed."
            )
        return 0
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
    except (OSError, subprocess.TimeoutExpired):
        print(
            "AWS command unavailable or timed out. Result is unconfirmed; no automatic retry or overwrite was attempted.",
            file=sys.stderr,
        )
    return 1


if __name__ == "__main__":
    sys.exit(main())
