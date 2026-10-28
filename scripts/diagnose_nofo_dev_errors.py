"""Bounded read-only triage of two fixed dev incidents; no raw logs leave memory."""

import json
import math
import os
import sys
import time
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

REGION = "us-east-1"
LOG_GROUP = "service/nofos-infra-dev"
SERVICE = "nofos-infra-dev"
ALARM = SERVICE + "-high-app-5xx-count"
LOAD_BALANCER = "app/nofos-infra-dev/25d32b1e281dad9c"
# UTC, including margins around the supplied alarm datapoints and recovery.
WINDOWS = (
    ("2026-10-28T02:25:00+00:00", "2026-10-28T02:46:00+00:00"),
    ("2026-10-28T08:24:00+00:00", "2026-10-28T08:49:00+00:00"),
)
EXCEPTIONS = frozenset(
    (
        "OperationalError",
        "InterfaceError",
        "DatabaseError",
        "ProgrammingError",
        "IntegrityError",
        "DataError",
        "TimeoutError",
        "ConnectionError",
        "BrokenPipeError",
        "MemoryError",
        "FileNotFoundError",
        "PermissionError",
        "ValueError",
        "TypeError",
        "KeyError",
        "AttributeError",
        "IndexError",
        "AssertionError",
        "RuntimeError",
        "NotImplementedError",
        "RecursionError",
        "UnicodeDecodeError",
        "TemplateDoesNotExist",
        "TemplateSyntaxError",
        "NoReverseMatch",
        "DisallowedHost",
        "SuspiciousOperation",
        "ValidationError",
        "PermissionDenied",
        "Http404",
    )
)
ALLOWED_CODES = frozenset(
    (
        "AccessDenied",
        "AccessDeniedException",
        "ResourceNotFoundException",
        "ThrottlingException",
    )
)


def client(service):
    return boto3.client(
        service,
        region_name=REGION,
        config=Config(
            connect_timeout=5, read_timeout=10, retries={"total_max_attempts": 1}
        ),
    )


def route_family(value):
    if not isinstance(value, str):
        return "unknown"
    try:
        path = urlsplit(value).path
    except ValueError:
        return "unknown"
    if path == "/":
        return "home"
    for prefix in (
        "readability",
        "nofos",
        "composer",
        "compare",
        "users",
        "uploads",
        "admin",
        "api",
    ):
        if path == "/" + prefix or path.startswith("/" + prefix + "/"):
            return prefix
    return "other"


def summarize_message(message, counts):
    """Dynamic field values never become report keys, values or error text."""
    try:
        row = json.loads(message)
    except (ValueError, TypeError):
        counts["non_json_events"] += 1
        if isinstance(message, str) and "WORKER TIMEOUT" in message:
            counts["worker_timeout_markers"] += 1
        return
    if not isinstance(row, dict):
        counts["unrecognized_json_events"] += 1
        return
    status = row.get("status", row.get("status_code"))
    server_error = type(status) is int and 500 <= status <= 599
    error_level = row.get("levelname") in ("ERROR", "CRITICAL")
    if not (server_error or error_level):
        counts["other_json_events"] += 1
        return
    counts["error_log_events"] += 1
    if server_error:
        counts["status_" + str(status)] += 1
    counts["route_" + route_family(row.get("url"))] += 1
    kind = row.get("exception_type")
    kind = kind if isinstance(kind, str) and kind in EXCEPTIONS else "unknown"
    counts["exception_" + kind] += 1


def logs_report(logs, start, end, deadline):
    counts = Counter()
    token = None
    seen = set()
    scanned = 0
    for page in range(10):
        if time.monotonic() >= deadline:
            return {
                "complete": False,
                "reason": "deadline",
                "events_scanned": scanned,
                "counts": dict(counts),
            }
        args = dict(
            logGroupName=LOG_GROUP,
            startTime=int(start.timestamp() * 1000),
            endTime=int(end.timestamp() * 1000),
            limit=500,
        )
        if token:
            args["nextToken"] = token
        response = logs.filter_log_events(**args)
        for event in response.get("events", []):
            scanned += 1
            summarize_message(event.get("message"), counts)
        token = response.get("nextToken")
        if not token:
            return {
                "complete": True,
                "events_scanned": scanned,
                "pages": page + 1,
                "counts": dict(counts),
            }
        if token in seen:
            return {
                "complete": False,
                "reason": "repeated_token",
                "events_scanned": scanned,
                "counts": dict(counts),
            }
        seen.add(token)
    return {
        "complete": False,
        "reason": "page_limit",
        "events_scanned": scanned,
        "counts": dict(counts),
    }


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value) and 0 <= value < 10**12


def metrics_report(cw, start, end):
    output = {}
    for metric in (
        "HTTPCode_Target_5XX_Count",
        "HTTPCode_ELB_5XX_Count",
        "RequestCount",
    ):
        response = cw.get_metric_statistics(
            Namespace="AWS/ApplicationELB",
            MetricName=metric,
            Dimensions=[{"Name": "LoadBalancer", "Value": LOAD_BALANCER}],
            StartTime=start,
            EndTime=end,
            Period=60,
            Statistics=["Sum"],
        )
        values = [
            row["Sum"]
            for row in response.get("Datapoints", [])
            if numeric(row.get("Sum"))
        ]
        output[metric] = {
            "datapoints": len(values),
            "sum": sum(values) if values else None,
        }
    for metric in ("CPUUtilization", "MemoryUtilization"):
        response = cw.get_metric_statistics(
            Namespace="AWS/ECS",
            MetricName=metric,
            Dimensions=[
                {"Name": "ClusterName", "Value": SERVICE},
                {"Name": "ServiceName", "Value": SERVICE},
            ],
            StartTime=start,
            EndTime=end,
            Period=60,
            Statistics=["Average"],
        )
        values = [
            row["Average"]
            for row in response.get("Datapoints", [])
            if numeric(row.get("Average"))
        ]
        output[metric] = {
            "datapoints": len(values),
            "max_one_minute_average": max(values) if values else None,
        }
    return output


def alarm_report(cw, start, end):
    response = cw.describe_alarm_history(
        AlarmName=ALARM,
        HistoryItemType="StateUpdate",
        StartDate=start,
        EndDate=end,
        MaxRecords=100,
    )
    # No HistoryData, reason, timestamp or summary is copied to public output.
    return {
        "state_update_records": len(response.get("AlarmHistoryItems", [])),
        "complete": not bool(response.get("NextToken")),
    }


def safe_check(operation):
    try:
        return {"status": "observed", "details": operation()}
    except ClientError as error:
        detail = (
            error.response.get("Error", {}) if isinstance(error.response, dict) else {}
        )
        code = detail.get("Code") if isinstance(detail, dict) else None
        return {
            "status": "failed",
            "category": (
                code
                if isinstance(code, str) and code in ALLOWED_CODES
                else "aws_request_failed"
            ),
        }
    except Exception:
        return {"status": "failed", "category": "request_or_processing_failed"}


def report():
    logs, cw = client("logs"), client("cloudwatch")
    deadline = time.monotonic() + 180
    result = []
    for begin, finish in WINDOWS:
        start, end = datetime.fromisoformat(begin), datetime.fromisoformat(finish)
        result.append(
            {
                "start_utc": begin,
                "end_utc_exclusive": finish,
                "logs": safe_check(lambda: logs_report(logs, start, end, deadline)),
                "metrics": safe_check(lambda: metrics_report(cw, start, end)),
                "alarm_history": safe_check(lambda: alarm_report(cw, start, end)),
            }
        )
    return {
        "environment": "infra-dev",
        "windows": result,
        "limitations": [
            "Read-only triage, not a root-cause conclusion or current health check.",
            "Raw logs stay in process memory; no bodies, URLs, IDs, streams or exception messages are published.",
            "Counts describe log events, not distinct requests; a request may produce several records.",
            "Route and exception labels are a fixed allowlist; unknown detail needs restricted investigation.",
            "Absent metrics are null, not zero; incomplete log scans cannot establish absence of errors.",
            "This does not inspect historical task termination or deployment events.",
        ],
    }


def main():
    if (
        os.environ.get("GITHUB_REPOSITORY") != "HHS/simpler-grants-gov"
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
    ):
        print("Run the reviewed diagnostic from upstream main.", file=sys.stderr)
        return 1
    try:
        result = report()
        text = (
            "# NOFO dev overnight error triage\n\n```json\n"
            + json.dumps(result, indent=2, allow_nan=False)
            + "\n```\n"
        )
        print(text)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            Path(os.environ["GITHUB_STEP_SUMMARY"]).write_text(text)
        complete = all(
            row["logs"]["status"] == "observed"
            and row["logs"]["details"]["complete"]
            and row["metrics"]["status"] == "observed"
            and row["alarm_history"]["status"] == "observed"
            and row["alarm_history"]["details"]["complete"]
            for row in result["windows"]
        )
        return 0 if complete else 1
    except Exception:
        print(
            "Diagnostic failed; raw AWS and log details were suppressed.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
