"""Forwards CloudWatch Logs to New Relic Logs API."""

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
RDS_CLUSTER_NAME = os.environ.get("RDS_CLUSTER_NAME", "")

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
                    "logtype": "rds-postgresql",
                    "plugin": "cloudwatch-lambda-forwarder",
                    "instrumentation.provider": "aws",
                    "collector.name": "cloudwatch-lambda-forwarder",
                    "aws.accountId": AWS_ACCOUNT_ID,
                    "aws.region": AWS_REGION,
                    "aws.rds.clusterIdentifier": RDS_CLUSTER_NAME,
                    "hostname": RDS_CLUSTER_NAME,
                    "entity.name": RDS_CLUSTER_NAME,
                    "entity.type": "AWSRDSDBCLUSTER",
                    "provider": "RdsDbCluster",
                },
            },
            "logs": entries,
        }
    ]

    nr_license_key = get_nr_license_key()

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
            status = response.status
            body = response.read().decode("utf-8")
        print(f"New Relic response: {status}")
        return {"statusCode": status, "body": body}
    except urllib.error.HTTPError as e:
        print(f"New Relic HTTP error: {e.code} {e.reason}")
        if e.code >= 500:
            raise  # Retryable — let Lambda/CloudWatch retry
        print(f"Non-retryable error, dropping {len(entries)} log events")
        return {"statusCode": e.code, "body": e.reason}
    except urllib.error.URLError as e:
        print(f"New Relic connection error: {e.reason}")
        raise  # Retryable — network issue
