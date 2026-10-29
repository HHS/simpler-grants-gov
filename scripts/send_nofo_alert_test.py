"""Send one fixed dev topic test; never print subscription endpoints or AWS errors."""

import os
import sys

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

TOPIC = "arn:aws:sns:us-east-1:061664787759:nofos-infra-dev-monitoring"


class DeliveryTestFailure(Exception):
    """Only fixed, safe diagnostics may be shown to the operator."""


def send():
    client = boto3.client(
        "sns",
        region_name="us-east-1",
        config=Config(
            connect_timeout=5,
            read_timeout=15,
            retries={"total_max_attempts": 1, "mode": "standard"},
        ),
    )
    response = client.list_subscriptions_by_topic(TopicArn=TOPIC)
    rows = response.get("Subscriptions", [])
    # Fail closed if routing has changed since the reviewed single-inbox setup.
    # Endpoint values stay in memory and are never read or printed by this code.
    if (
        response.get("NextToken")
        or len(rows) != 1
        or rows[0].get("Protocol") != "email"
    ):
        raise DeliveryTestFailure(
            "Expected one email subscription; no test was sent. Inspect routing privately."
        )
    if not rows[0].get("SubscriptionArn", "").startswith(TOPIC + ":"):
        raise DeliveryTestFailure(
            "The email subscription is not confirmed; no test was sent."
        )
    client.publish(
        TopicArn=TOPIC,
        Subject="TEST: NOFO Builder dev email delivery",
        Message=(
            "This is a controlled NOFO Builder dev notification test, not an incident. "
            "Receiving it confirms topic-to-inbox delivery only. It does not verify "
            "calculator alarm triggering or recovery notifications. "
            "Calculator-specific alarm settings and public uploads are unchanged."
        ),
    )


def main():
    if (
        os.environ.get("GITHUB_REPOSITORY") != "HHS/simpler-grants-gov"
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
    ):
        print(
            "Run the reviewed dev delivery-test workflow from upstream main.",
            file=sys.stderr,
        )
        return 1
    try:
        send()
    except DeliveryTestFailure as error:
        print(str(error), file=sys.stderr)
        return 1
    except ClientError as error:
        details = (
            error.response.get("Error", {}) if isinstance(error.response, dict) else {}
        )
        code = details.get("Code", "") if isinstance(details, dict) else ""
        category = (
            code
            if code
            in (
                "AccessDenied",
                "AccessDeniedException",
                "AuthorizationError",
                "AuthorizationErrorException",
                "Throttled",
                "ThrottlingException",
                "NotFound",
                "NotFoundException",
            )
            else "unclassified"
        )
        print(
            f"Dev delivery test failed (category={category}). Raw AWS details were suppressed; no automatic retry was attempted.",
            file=sys.stderr,
        )
        return 1
    except Exception:
        print(
            "Dev delivery test failed; publication status is unconfirmed. Raw details were suppressed; inspect before retrying.",
            file=sys.stderr,
        )
        return 1
    print(
        "AWS accepted the dev test publication. An inbox holder must verify receipt of the labelled test; no alarm settings were changed."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
