"""Exercise a temporary dev alarm; never log raw AWS responses or recipients."""

import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

TOPIC = "arn:aws:sns:us-east-1:061664787759:nofos-infra-dev-monitoring"
PREFIX = "NOFO-DEV-TEST-alert-delivery-"


class TestFailure(Exception):
    """Only fixed diagnostics may reach public logs."""


def context():
    if (
        os.environ.get("GITHUB_REPOSITORY") != "HHS/simpler-grants-gov"
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
    ):
        raise TestFailure("Run the reviewed alarm test from upstream main.")
    parts = [os.environ.get(key, "") for key in ("GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT")]
    if not all(re.fullmatch(r"[0-9]{1,20}", part) for part in parts):
        raise TestFailure("Valid GitHub run identity is required.")
    name = PREFIX + "-".join(parts)
    return name, Path(os.environ["RUNNER_TEMP"]) / (name + ".owned")


def client(service):
    return boto3.client(
        service,
        region_name="us-east-1",
        config=Config(
            connect_timeout=5,
            read_timeout=15,
            retries={"total_max_attempts": 1, "mode": "standard"},
        ),
    )


def confirmed_route(sns):
    response = sns.list_subscriptions_by_topic(TopicArn=TOPIC)
    rows = response.get("Subscriptions", [])
    if (
        response.get("NextToken")
        or len(rows) != 1
        or rows[0].get("Protocol") != "email"
        or not rows[0].get("SubscriptionArn", "").startswith(TOPIC + ":")
    ):
        raise TestFailure("Expected one confirmed email subscription; test stopped.")


def wait_for_actions(cw, name, since, expected):
    # Never print HistoryData: AWS can embed notification messages there.
    # Fail closed if AWS changes its successful-action summary format.
    for attempt in range(12):
        response = cw.describe_alarm_history(
            AlarmName=name,
            HistoryItemType="Action",
            StartDate=since,
            MaxRecords=100,
        )
        rows = response.get("AlarmHistoryItems", [])
        successes = sum(
            row.get("HistorySummary") == "Successfully executed action " + TOPIC
            for row in rows
        )
        if response.get("NextToken"):
            raise TestFailure("Unexpected alarm history pagination; test stopped.")
        if successes >= expected:
            return
        if attempt < 11:
            time.sleep(5)
    raise TestFailure("Timed out waiting for CloudWatch notification action evidence.")


def exercise(cw, sns, name, marker):
    confirmed_route(sns)
    response = cw.describe_alarms(AlarmNames=[name])
    if response.get("MetricAlarms") or response.get("CompositeAlarms"):
        raise TestFailure("Test alarm already exists; it was not changed or deleted.")
    # Exclusive local marker authorizes cleanup even if PutMetricAlarm times out
    # after AWS accepts it. Names include run + attempt, preventing ordinary overlap.
    with marker.open("x") as file:
        file.write(name)
    cw.put_metric_alarm(
        AlarmName=name,
        AlarmDescription=(
            "TEST ONLY: NOFO Builder dev alarm/recovery email delivery, not an incident. "
            "No calculator thresholds or public upload settings are changed."
        ),
        ActionsEnabled=True,
        AlarmActions=[TOPIC],
        OKActions=[TOPIC],
        InsufficientDataActions=[],
        Namespace="NOFO/NotificationDeliveryTest",
        MetricName=name,
        Statistic="Maximum",
        Period=60,
        EvaluationPeriods=1,
        Threshold=1,
        ComparisonOperator="GreaterThanThreshold",
        TreatMissingData="ignore",
    )
    # No metric is published. Missing data preserves the test state rather than
    # producing automatic transitions while notification actions are observed.
    for state in ("ALARM", "OK"):
        since = datetime.now(timezone.utc)
        cw.set_alarm_state(
            AlarmName=name,
            StateValue=state,
            StateReason=f"TEST ONLY: controlled NOFO dev email delivery, state {state}.",
        )
        wait_for_actions(cw, name, since, 1)
        print(f"CloudWatch recorded the test {state} notification action.")


def cleanup(cw, name, marker):
    if not marker.exists():
        return
    if marker.read_text() != name:
        raise TestFailure("Cleanup ownership marker is invalid; inspect privately.")
    cw.delete_alarms(AlarmNames=[name])
    if cw.describe_alarms(AlarmNames=[name]).get("MetricAlarms"):
        raise TestFailure(
            "Test alarm deletion is not yet confirmed; inspect privately."
        )
    marker.unlink()
    print("Temporary test alarm deletion confirmed.")


def main():
    try:
        name, marker = context()
        cw = client("cloudwatch")
        if sys.argv[1:] == ["--cleanup"]:
            cleanup(cw, name, marker)
        elif not sys.argv[1:]:
            try:
                exercise(cw, client("sns"), name, marker)
            finally:
                cleanup(cw, name, marker)
            print(
                "AWS recorded ALARM and OK notification actions. An inbox holder must "
                "confirm both labelled test emails; workflow success does not prove receipt."
            )
        else:
            raise TestFailure("Unsupported test mode.")
    except TestFailure as error:
        print(str(error), file=sys.stderr)
        return 1
    except ClientError as error:
        operation = error.operation_name
        if operation not in (
            "ListSubscriptionsByTopic",
            "DescribeAlarms",
            "PutMetricAlarm",
            "SetAlarmState",
            "DescribeAlarmHistory",
            "DeleteAlarms",
        ):
            operation = "unclassified"
        details = (
            error.response.get("Error", {}) if isinstance(error.response, dict) else {}
        )
        code = details.get("Code", "") if isinstance(details, dict) else ""
        if code not in (
            "AccessDenied",
            "AccessDeniedException",
            "AuthorizationError",
            "AuthorizationErrorException",
            "Throttling",
            "ThrottlingException",
            "ResourceNotFound",
        ):
            code = "unclassified"
        print(
            f"Alarm test or cleanup failed (operation={operation}, category={code}). "
            "Raw details were suppressed. Check the cleanup step before retrying; "
            "infrastructure support can inspect restricted AWS records.",
            file=sys.stderr,
        )
        return 1
    except Exception:
        print(
            "Alarm test or cleanup failed; raw AWS details were suppressed. "
            "Check the cleanup step before retrying. Infrastructure support may need "
            "to inspect restricted AWS records for this run's temporary test alarm.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
