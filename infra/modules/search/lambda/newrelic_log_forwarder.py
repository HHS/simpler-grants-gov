"""Forwards CloudWatch Logs to New Relic Logs API."""

import base64
import gzip
import json
import os
import urllib.request

NR_LICENSE_KEY = os.environ["NR_LICENSE_KEY"]
NR_LOGS_ENDPOINT = os.environ.get(
    "NR_LOGS_ENDPOINT", "https://log-api.newrelic.com/log/v1"
)
AWS_ACCOUNT_ID = os.environ.get("AWS_ACCOUNT_ID", "")
AWS_REGION = os.environ.get("AWS_REGION", "")
OPENSEARCH_DOMAIN_NAME = os.environ.get("OPENSEARCH_DOMAIN_NAME", "")


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
        entry = {
            "timestamp": log_event["timestamp"],
            "message": log_event["message"],
            "attributes": {
                "aws.logGroup": log_group,
                "aws.logStream": log_stream,
            },
        }
        entries.append(entry)

    if not entries:
        return {"statusCode": 200, "body": "No log entries to forward."}

    nr_payload = [
        {
            "common": {
                "attributes": {
                    "logtype": "opensearch",
                    "plugin": "cloudwatch-lambda-forwarder",
                    "aws.accountId": AWS_ACCOUNT_ID,
                    "aws.region": AWS_REGION,
                    "provider.domainName": OPENSEARCH_DOMAIN_NAME,
                    "entity.name": OPENSEARCH_DOMAIN_NAME,
                },
            },
            "logs": entries,
        }
    ]

    request = urllib.request.Request(
        NR_LOGS_ENDPOINT,
        data=gzip.compress(json.dumps(nr_payload).encode("utf-8")),
        headers={
            "Content-Type": "application/gzip",
            "Api-Key": NR_LICENSE_KEY,
            "Content-Encoding": "gzip",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        status = response.status
        body = response.read().decode("utf-8")

    return {"statusCode": status, "body": body}
