"""Forwards ClamAV Lambda CloudWatch logs to New Relic."""

import base64
import gzip
import json
import os
import urllib.error
import urllib.request

import boto3

ssm = boto3.client("ssm")

NR_LOGS_ENDPOINT = os.environ.get(
    "NR_LOGS_ENDPOINT", "https://log-api.newrelic.com/log/v1"
)
AWS_ACCOUNT_ID = os.environ.get("AWS_ACCOUNT_ID", "")
AWS_REGION = os.environ.get("AWS_REGION", "")

# Max log entries per New Relic Logs API request
BATCH_SIZE = 1000

# Per-field length cap before a truncation marker is appended.
MAX_FIELD_LENGTH = 3000

# Parsed JSON fields that may carry long tracebacks; truncate + sanitize these.
TRUNCATE_FIELDS = frozenset(
    {
        "exc_text",
        "exc_info",
        "message",
        "msg",
        "stack_info",
        "log",
    }
)

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


def sanitize_field(value):
    """Apply a length cap and control-char escaping.

    Handles both strings and lists of strings (e.g. Python `exc_info` arrays).
    """
    if isinstance(value, list):
        return [sanitize_field(item) for item in value]
    if not isinstance(value, str):
        return value
    if len(value) > MAX_FIELD_LENGTH:
        value = (
            value[:MAX_FIELD_LENGTH]
            + f"... [TRUNCATED - original length: {len(value)}]"
        )
    return value.translate(_CTRL_TRANSLATION)


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
    queryable as strings. Reserved keys (forwarder-controlled attributes) are
    never overwritten.
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


def function_name_from_log_group(log_group):
    """Derive the Lambda function name from a `/aws/lambda/<name>` log group."""
    prefix = "/aws/lambda/"
    if log_group.startswith(prefix):
        return log_group[len(prefix) :]
    return log_group


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
        print("Non-retryable error, dropping batch")
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
    function_name = function_name_from_log_group(log_group)

    entries = []
    for log_event in log_data.get("logEvents", []):
        raw_message = log_event["message"]
        message = sanitize_field(raw_message)

        entry_attributes = {
            "aws.logGroup": log_group,
            "aws.logStream": log_stream,
            "aws.logEventId": log_event.get("id", ""),
            "aws.lambda.functionName": function_name,
            "entity.name": function_name,
            "hostname": function_name,
        }

        parsed = parse_structured_message(raw_message)
        if parsed is not None:
            entry_attributes.update(
                lift_attributes(parsed, reserved_keys=entry_attributes.keys())
            )

        entries.append(
            {
                "timestamp": log_event["timestamp"],
                "message": message,
                "attributes": entry_attributes,
            }
        )

    if not entries:
        return {"statusCode": 200, "body": "No log entries to forward."}

    print(f"Forwarding {len(entries)} log events from {log_group}")

    common_attributes = {
        "logtype": "clamav",
        "plugin": "cloudwatch-lambda-forwarder",
        "instrumentation.provider": "aws",
        "collector.name": "cloudwatch-lambda-forwarder",
        "aws.accountId": AWS_ACCOUNT_ID,
        "aws.region": AWS_REGION,
        "entity.type": "AWSLAMBDAFUNCTION",
        "provider": "LambdaFunction",
    }

    nr_license_key = get_nr_license_key()

    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i : i + BATCH_SIZE]
        nr_payload = [{"common": {"attributes": common_attributes}, "logs": batch}]
        send_to_newrelic(nr_payload, nr_license_key)

    return {"statusCode": 200, "body": f"Forwarded {len(entries)} log entries"}
