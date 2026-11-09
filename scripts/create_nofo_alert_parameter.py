"""Create the fixed NOFO email parameter without logging its private value."""

import argparse
import os
import re
import sys

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

REGION = "us-east-1"
SECRET = "NOFO_INFRA_DEV_ALERT_EMAIL"
SAFE_ERROR_CODES = {
    "ValidationException",
    "InvalidKeyId",
    "ParameterLimitExceeded",
    "ParameterPatternMismatchException",
    "InternalServerError",
    "ThrottlingException",
    "TooManyUpdates",
    "ExpiredTokenException",
    "UnrecognizedClientException",
}


class SetupFailure(Exception):
    """Only fixed safe messages may leave the setup process."""


def recipient(environment="infra-dev"):
    secret = SECRET if environment == "infra-dev" else "NOFO_PROD_ALERT_EMAIL"
    value = os.environ.get(secret, "").strip()
    if not re.fullmatch(
        r"[^@\s\x00-\x1f\x7f]+@[^@\s\x00-\x1f\x7f]+\.[^@\s\x00-\x1f\x7f]+", value
    ):
        raise SetupFailure(
            "The private email secret is missing or invalid; no AWS write attempted."
        )
    return value


def parameter_payload(value, environment="infra-dev"):
    return {
        "Name": f"/nofos/{environment}/monitoring/alert-email",
        "Value": value,
        "Type": "SecureString",
        "KeyId": "alias/aws/ssm",
        "Tier": "Standard",
        "Overwrite": False,
        "Description": f"Private NOFO {environment} operational alert recipient",
    }


def create(value, environment="infra-dev"):
    # Direct SDK call: no CLI/stdin parsing, subprocess arguments or private files.
    try:
        client = boto3.client(
            "ssm",
            region_name=REGION,
            config=Config(
                connect_timeout=5,
                read_timeout=15,
                retries={"total_max_attempts": 1, "mode": "standard"},
            ),
        )
        client.put_parameter(**parameter_payload(value, environment))
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code", "")
        if code == "ParameterAlreadyExists":
            raise SetupFailure(
                "Parameter already exists. It was not read or overwritten; ask the operator to confirm existing setup privately."
            ) from None
        if code in ("AccessDenied", "AccessDeniedException", "UnauthorizedOperation"):
            raise SetupFailure(
                "AWS denied parameter creation or encryption. Ask infrastructure support to check ssm:PutParameter and kms:Encrypt for the fixed NOFO parameter; no permissions were changed."
            ) from None
        category = code if code in SAFE_ERROR_CODES else "unclassified"
        raise SetupFailure(
            f"AWS parameter creation failed (category={category}). Raw output was suppressed to protect the recipient; no automatic retry or overwrite was attempted."
        ) from None
    except NoCredentialsError:
        raise SetupFailure(
            "AWS credentials unavailable; parameter creation was not attempted."
        ) from None
    except BotoCoreError:
        raise SetupFailure(
            "AWS SDK request failed. Result is unconfirmed; raw output was suppressed and no automatic retry or overwrite was attempted."
        ) from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--environment", choices=("infra-dev", "prod"), default="infra-dev")
    args = parser.parse_args()
    try:
        value = recipient(args.environment)
        if args.validate_only:
            print("Private email input validated; no AWS call made.")
        else:
            create(value, args.environment)
            print(
                f"Created the encrypted {args.environment} alert parameter. No subscription, notification or deployment was performed."
            )
        return 0
    except SetupFailure as error:
        print(str(error), file=sys.stderr)
    except Exception:
        # Even unexpected SDK/configuration errors must not leak response values.
        print(
            "Unexpected setup failure. Result is unconfirmed; raw output was suppressed to protect the recipient.",
            file=sys.stderr,
        )
    return 1


if __name__ == "__main__":
    sys.exit(main())
