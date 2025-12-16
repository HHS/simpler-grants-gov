"""
Lambda function to post AWS Security Hub findings to Slack via webhook.
"""
import json
import os
import urllib.request
import urllib.error
import boto3
from typing import Dict, Any


def get_webhook_url() -> str:
    """Retrieve Slack webhook URL from Secrets Manager."""
    secret_name = os.environ['SLACK_WEBHOOK_SECRET_NAME']
    region = os.environ.get('AWS_REGION', 'us-east-1')

    client = boto3.client('secretsmanager', region_name=region)

    try:
        response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        return secret['webhook_url']
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise


def format_slack_message(event_detail: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format the EventBridge event into a Slack-friendly format.

    Args:
        event_detail: The EventBridge event detail containing findings

    Returns:
        Slack message payload
    """
    # Extract the finding
    finding = event_detail.get('findings', [{}])[0]

    severity = finding.get('Severity', {}).get('Label', 'UNKNOWN')
    title = finding.get('Title', 'Unknown Finding')
    description = finding.get('Description', 'No description available')
    compliance_status = finding.get('Compliance', {}).get('Status', 'N/A')
    resource = finding.get('Resources', [{}])[0].get('Id', 'Unknown')
    account = finding.get('AwsAccountId', 'Unknown')
    region = finding.get('Resources', [{}])[0].get('Region', 'us-east-1')
    remediation = finding.get('Remediation', {}).get('Recommendation', {}).get('Text', 'No remediation available')

    # Determine severity emoji and color
    if severity == 'CRITICAL':
        color = 'danger'  # Red
        emoji = '🚨'
    elif severity == 'HIGH':
        color = 'warning'  # Orange
        emoji = '⚠️'
    else:
        color = '#FFFF00'  # Yellow
        emoji = '⚠️'

    # Build Slack message with attachments
    return {
        "text": f"{emoji} *{severity} Security Hub Finding*",
        "attachments": [
            {
                "color": color,
                "title": title,
                "fields": [
                    {
                        "title": "Severity",
                        "value": severity,
                        "short": True
                    },
                    {
                        "title": "Compliance Status",
                        "value": compliance_status,
                        "short": True
                    },
                    {
                        "title": "Account",
                        "value": account,
                        "short": True
                    },
                    {
                        "title": "Region",
                        "value": region,
                        "short": True
                    },
                    {
                        "title": "Description",
                        "value": description,
                        "short": False
                    },
                    {
                        "title": "Affected Resource",
                        "value": resource,
                        "short": False
                    },
                    {
                        "title": "Remediation",
                        "value": remediation,
                        "short": False
                    }
                ],
                "footer": f"<https://console.aws.amazon.com/securityhub/home?region={region}#/findings|View in AWS Console>",
                "mrkdwn_in": ["fields"]
            }
        ]
    }


def post_to_slack(webhook_url: str, message: Dict[str, Any]) -> None:
    """
    Post message to Slack webhook.

    Args:
        webhook_url: Slack webhook URL
        message: Formatted Slack message payload
    """
    data = json.dumps(message).encode('utf-8')

    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                raise Exception(f"Slack API returned status {response.status}")
            print(f"Successfully posted to Slack: {response.status}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTPError posting to Slack: {e.code} - {error_body}")
        raise
    except Exception as e:
        print(f"Error posting to Slack: {e}")
        raise


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function.

    Args:
        event: SNS event containing Security Hub finding
        context: Lambda context object

    Returns:
        Response dict with status
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Get webhook URL from Secrets Manager
        webhook_url = get_webhook_url()

        # Extract the SNS message
        for record in event['Records']:
            if record['EventSource'] == 'aws:sns':
                sns_message = record['Sns']['Message']

                # Parse the EventBridge event from SNS
                event_data = json.loads(sns_message)
                event_detail = event_data.get('detail', {})

                # Format for Slack
                slack_message = format_slack_message(event_detail)

                # Post to Slack
                post_to_slack(webhook_url, slack_message)

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully posted to Slack')
        }

    except Exception as e:
        print(f"Error processing event: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
