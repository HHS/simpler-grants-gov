"""Forwards ECS application CloudWatch logs to New Relic Logs API."""

import base64
import gzip
import json
import os
import re
import urllib.error
import urllib.request

import boto3

ssm = boto3.client("ssm")

NR_LOGS_ENDPOINT = os.environ.get(
    "NR_LOGS_ENDPOINT", "https://log-api.newrelic.com/log/v1"
)
AWS_ACCOUNT_ID = os.environ.get("AWS_ACCOUNT_ID", "")
AWS_REGION = os.environ.get("AWS_REGION", "")
ECS_SERVICE_NAME = os.environ.get("ECS_SERVICE_NAME", "")
ECS_CLUSTER_NAME = os.environ.get("ECS_CLUSTER_NAME", "")
NR_ENTITY_GUID = os.environ.get("NR_ENTITY_GUID", "")

# Max log entries per New Relic Logs API request
BATCH_SIZE = 1000

# Per-field length cap before truncation marker is appended.
# Mirrors the previous Fluent Bit Lua filter (truncate_logs.lua).
MAX_FIELD_LENGTH = 3000

# Record fields (after JSON-parsing the CloudWatch message) that may contain
# very long SQL errors / stack traces and that we want to truncate + sanitize.
TRUNCATE_FIELDS = frozenset({
    "exc_text",
    "exc_info",
    "exc_info_short",
    "message",
    "formatted_msg",
    "msg",
    "stack_info",
    "log",
})

# Matches "IN (" / "in  (" etc.
_IN_CLAUSE_RE = re.compile(r"\bin\s*\(", re.IGNORECASE)
_PARAM_RE = re.compile(r"\(param_")
_CTRL_TRANSLATION = str.maketrans({"\n": "\\n", "\r": "\\r", "\t": "\\t"})

# Cache the license key across warm invocations
_nr_license_key = None


def get_nr_license_key():
    """Fetch the New Relic license key from SSM Parameter Store."""
    global _nr_license_key
    if _nr_license_key is None:
        response = ssm.get_parameter(
            Name=os.environ["NR_LICENSE_KEY_SSM_PATH"],
            WithDecryption=True,
        )
        _nr_license_key = response["Parameter"]["Value"]
    return _nr_license_key


def truncate_sql_params(value):
    """Collapse `IN ((%(param_1)s), (%(param_2)s), ...)` into a short marker.

    Mirrors truncate_logs.lua so very long SQL parameter lists don't blow
    past CloudWatch's 256 KB per-event limit or New Relic's per-attribute caps.
    """
    if not isinstance(value, str) or not _PARAM_RE.search(value):
        return value

    out = []
    cursor = 0
    n = len(value)
    while cursor < n:
        match = _IN_CLAUSE_RE.search(value, cursor)
        if not match:
            out.append(value[cursor:])
            break
        paren_start = match.end() - 1
        out.append(value[cursor:paren_start])
        depth = 1
        pos = paren_start + 1
        while pos < n and depth > 0:
            char = value[pos]
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
            pos += 1
        if depth != 0:
            out.append(value[paren_start:])
            break
        clause = value[paren_start:pos]
        param_count = len(_PARAM_RE.findall(clause))
        if param_count >= 1:
            out.append(f"(/* {param_count} parameters truncated */ ...)")
        else:
            out.append(clause)
        cursor = pos
    return "".join(out)


def sanitize_field(value):
    """Apply SQL truncation, length cap, and control-char escaping.

    Handles both strings and lists of strings (e.g. Python `exc_info` arrays).
    """
    if isinstance(value, list):
        return [sanitize_field(item) for item in value]
    if not isinstance(value, str):
        return value
    truncated = truncate_sql_params(value)
    if len(truncated) > MAX_FIELD_LENGTH:
        truncated = (
            truncated[:MAX_FIELD_LENGTH]
            + f"... [TRUNCATED - original length: {len(value)}]"
        )
    return truncated.translate(_CTRL_TRANSLATION)


def parse_structured_message(message):
    """Parse the CloudWatch message as JSON if it looks structured, else None."""
    if not isinstance(message, str):
        return None
    stripped = message.lstrip()
    if not stripped or stripped[0] != "{":
        return None
    try:
        parsed = json.loads(stripped)
    except (ValueError, TypeError):
        return None
    return parsed if isinstance(parsed, dict) else None


def lift_attributes(parsed, reserved_keys):
    """Flatten parsed JSON top-level fields into NR-attribute-shaped values.

    Scalar values pass through; non-scalars are JSON-encoded so they stay
    queryable as strings. TRUNCATE_FIELDS go through sanitize_field which
    preserves the explicit truncation marker; everything else is clipped.
    """
    attributes = {}
    for key, value in parsed.items():
        if key in reserved_keys:
            continue
        if key in TRUNCATE_FIELDS:
            attr_value = sanitize_field(value)
            if isinstance(attr_value, list):
                attr_value = json.dumps(attr_value, default=str)
                if len(attr_value) > MAX_FIELD_LENGTH:
                    attr_value = attr_value[:MAX_FIELD_LENGTH]
        elif value is None or isinstance(value, (str, int, float, bool)):
            attr_value = value
            if isinstance(attr_value, str) and len(attr_value) > MAX_FIELD_LENGTH:
                attr_value = attr_value[:MAX_FIELD_LENGTH]
        else:
            try:
                attr_value = json.dumps(value, default=str)
            except (TypeError, ValueError):
                attr_value = str(value)
            if len(attr_value) > MAX_FIELD_LENGTH:
                attr_value = attr_value[:MAX_FIELD_LENGTH]
        attributes[key] = attr_value
    return attributes


def send_to_newrelic(nr_payload, nr_license_key):
    """Send a New Relic Logs API payload."""
    request = urllib.request.Request(
        NR_LOGS_ENDPOINT,
        data=gzip.compress(json.dumps(nr_payload).encode("utf-8")),
        headers={
            "Content-Type": "application/gzip",
            "Api-Key": nr_license_key,
            "Content-Encoding": "gzip",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            print(f"New Relic response: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"New Relic HTTP error: {e.code} {e.reason}")
        if e.code >= 500:
            raise  # Retryable — let Lambda/CloudWatch retry
        print(f"Non-retryable error, dropping batch")
    except urllib.error.URLError as e:
        print(f"New Relic connection error: {e.reason}")
        raise  # Retryable — network issue


def handler(event, context):
    """Handle CloudWatch Logs subscription filter events."""
    payload = base64.b64decode(event["awslogs"]["data"])
    log_data = json.loads(gzip.decompress(payload))

    if log_data.get("messageType") == "CONTROL_MESSAGE":
        return {"statusCode": 200, "body": "Control message, skipping."}

    log_group = log_data.get("logGroup", "")
    log_stream = log_data.get("logStream", "")

    entries = []
    for log_event in log_data.get("logEvents", []):
        raw_message = log_event["message"]
        message = sanitize_field(raw_message)

        entry_attributes = {
            "aws.logGroup": log_group,
            "aws.logStream": log_stream,
            "aws.logEventId": log_event.get("id", ""),
        }

        parsed = parse_structured_message(raw_message)
        if parsed is not None:
            entry_attributes.update(
                lift_attributes(parsed, reserved_keys=entry_attributes.keys())
            )

        entries.append({
            "timestamp": log_event["timestamp"],
            "message": message,
            "attributes": entry_attributes,
        })

    if not entries:
        return {"statusCode": 200, "body": "No log entries to forward."}

    print(f"Forwarding {len(entries)} log events from {log_group}")

    common_attributes = {
        "logtype": "ecs-application",
        "plugin": "cloudwatch-lambda-forwarder",
        "instrumentation.provider": "aws",
        "collector.name": "cloudwatch-lambda-forwarder",
        "aws.accountId": AWS_ACCOUNT_ID,
        "aws.region": AWS_REGION,
        "aws.ecs.serviceName": ECS_SERVICE_NAME,
        "aws.ecs.clusterName": ECS_CLUSTER_NAME,
        "hostname": ECS_SERVICE_NAME,
        "entity.name": ECS_SERVICE_NAME,
        "entity.type": "AWSECSSERVICE",
        "provider": "EcsService",
    }
    if NR_ENTITY_GUID:
        common_attributes["entity.guid"] = NR_ENTITY_GUID

    nr_license_key = get_nr_license_key()

    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i : i + BATCH_SIZE]
        nr_payload = [{"common": {"attributes": common_attributes}, "logs": batch}]
        send_to_newrelic(nr_payload, nr_license_key)

    return {"statusCode": 200, "body": f"Forwarded {len(entries)} log entries"}
