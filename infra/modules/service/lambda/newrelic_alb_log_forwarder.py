"""Forwards ALB access logs from S3 to New Relic Logs API."""

import gzip
import io
import json
import os
import shlex
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3

s3_client = boto3.client("s3")
ssm = boto3.client("ssm")

NR_LOGS_ENDPOINT = os.environ.get(
    "NR_LOGS_ENDPOINT", "https://log-api.newrelic.com/log/v1"
)
AWS_ACCOUNT_ID = os.environ.get("AWS_ACCOUNT_ID", "")
ALB_NAME = os.environ.get("ALB_NAME", "")
MTLS_ALB_NAME = os.environ.get("MTLS_ALB_NAME", "")
NR_ENTITY_GUID = os.environ.get("NR_ENTITY_GUID", "")
NR_MTLS_ENTITY_GUID = os.environ.get("NR_MTLS_ENTITY_GUID", "")

# Max log entries per New Relic Logs API request
BATCH_SIZE = 1000

# Cache the license key across warm invocations
_nr_license_key = None

# ALB access log field names in order (per AWS docs)
ALB_LOG_FIELDS = [
    "type",
    "timestamp",
    "elb",
    "client_port",
    "target_port",
    "request_processing_time",
    "target_processing_time",
    "response_processing_time",
    "elb_status_code",
    "target_status_code",
    "received_bytes",
    "sent_bytes",
    "request",
    "user_agent",
    "ssl_cipher",
    "ssl_protocol",
    "target_group_arn",
    "trace_id",
    "domain_name",
    "chosen_cert_arn",
    "matched_rule_priority",
    "request_creation_time",
    "actions_executed",
    "redirect_url",
    "error_reason",
    "target_port_list",
    "target_status_code_list",
    "classification",
    "classification_reason",
    "conn_trace_id",
]


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


def iso_to_ms(ts):
    """Convert ISO 8601 timestamp string to Unix milliseconds."""
    try:
        dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S.%fZ").replace(
            tzinfo=timezone.utc
        )
        return int(dt.timestamp() * 1000)
    except ValueError:
        return int(datetime.now(tz=timezone.utc).timestamp() * 1000)


def parse_alb_log_line(line):
    """Parse a single ALB access log line into a dict using shlex for quoted fields."""
    try:
        parts = shlex.split(line)
    except ValueError:
        return None
    if len(parts) < len(ALB_LOG_FIELDS):
        return None
    return dict(zip(ALB_LOG_FIELDS, parts))


def get_entity_guid(alb_name):
    """Return the New Relic entity GUID for the given ALB name."""
    if alb_name == ALB_NAME and NR_ENTITY_GUID:
        return NR_ENTITY_GUID
    if MTLS_ALB_NAME and alb_name == MTLS_ALB_NAME and NR_MTLS_ENTITY_GUID:
        return NR_MTLS_ENTITY_GUID
    return ""


def send_to_newrelic(nr_payload, nr_license_key):
    """Send a New Relic Logs API payload (already batched)."""
    compressed = gzip.compress(json.dumps(nr_payload).encode("utf-8"))
    request = urllib.request.Request(
        NR_LOGS_ENDPOINT,
        data=compressed,
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
            raise  # Retryable
        print(f"Non-retryable error, dropping batch")
    except urllib.error.URLError as e:
        print(f"New Relic connection error: {e.reason}")
        raise  # Retryable — network issue


def process_log_file(bucket, key):
    """Download and forward a single ALB access log file from S3."""
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    compressed_data = obj["Body"].read()

    nr_license_key = get_nr_license_key()

    # Extract AWS region from the S3 key path:
    # {prefix}/AWSLogs/{account_id}/elasticloadbalancing/{region}/...
    key_parts = key.split("/")
    try:
        alb_logs_idx = key_parts.index("elasticloadbalancing")
        region = key_parts[alb_logs_idx + 1]
    except (ValueError, IndexError):
        region = ""

    # Group entries by ALB name so each batch shares the same common attributes
    entries_by_alb: dict[str, list] = {}

    with gzip.open(io.BytesIO(compressed_data), "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parsed = parse_alb_log_line(line)
            if not parsed:
                continue

            # elb field format: "app/{name}/{id}"
            elb_parts = parsed["elb"].split("/")
            alb_name = elb_parts[1] if len(elb_parts) >= 3 else parsed["elb"]

            # Parse HTTP method and URL from the "request" field
            req_parts = parsed["request"].split(" ", 2)
            method = req_parts[0] if len(req_parts) > 0 else "-"
            url = req_parts[1] if len(req_parts) > 1 else "-"

            client_ip = parsed["client_port"].rsplit(":", 1)[0]

            entry = {
                "timestamp": iso_to_ms(parsed["timestamp"]),
                "message": line,
                "attributes": {
                    "aws.logGroup": f"/aws/alb/{alb_name}",
                    "alb.name": alb_name,
                    "alb.type": parsed["type"],
                    "alb.clientIp": client_ip,
                    "alb.elbStatusCode": parsed["elb_status_code"],
                    "alb.targetStatusCode": parsed["target_status_code"],
                    "alb.request.method": method,
                    "alb.request.url": url,
                    "alb.receivedBytes": parsed["received_bytes"],
                    "alb.sentBytes": parsed["sent_bytes"],
                    "alb.traceId": parsed["trace_id"],
                    "alb.userAgent": parsed["user_agent"],
                    "alb.errorReason": parsed["error_reason"],
                },
            }

            entries_by_alb.setdefault(alb_name, []).append(entry)

    total = 0
    for alb_name, entries in entries_by_alb.items():
        entity_guid = get_entity_guid(alb_name)
        common_attributes = {
            "logtype": "alb-access-logs",
            "plugin": "s3-lambda-forwarder",
            "instrumentation.provider": "aws",
            "collector.name": "s3-lambda-forwarder",
            "aws.accountId": AWS_ACCOUNT_ID,
            "aws.region": region,
            "aws.alb.name": alb_name,
            "hostname": alb_name,
            "entity.name": alb_name,
            "entity.type": "AWSALB",
            "provider": "Alb",
        }
        if entity_guid:
            common_attributes["entity.guid"] = entity_guid

        for i in range(0, len(entries), BATCH_SIZE):
            batch = entries[i : i + BATCH_SIZE]
            nr_payload = [{"common": {"attributes": common_attributes}, "logs": batch}]
            send_to_newrelic(nr_payload, nr_license_key)
        total += len(entries)

    return total


def handler(event, context):
    """Handle S3 ObjectCreated events for ALB access log files."""
    total = 0
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        if not key.endswith(".log.gz"):
            print(f"Skipping non-log file: {key}")
            continue

        print(f"Processing s3://{bucket}/{key}")
        try:
            count = process_log_file(bucket, key)
            total += count
            print(f"Forwarded {count} entries from {key}")
        except Exception as e:
            print(f"Error processing {key}: {e}")
            raise

    return {"statusCode": 200, "body": f"Forwarded {total} log entries"}
