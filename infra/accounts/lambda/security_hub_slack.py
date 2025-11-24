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


def format_slack_message(message: str) -> Dict[str, Any]:
    """
    Format the SNS message into a Slack-friendly format.

    Args:
        message: The formatted message from EventBridge

    Returns:
        Slack message payload
    """
    # Parse the message to extract key information
    lines = message.strip().strip('"').split('\\n')

    # Determine severity emoji
    if '🚨' in message or 'CRITICAL' in message:
        color = '#FF0000'  # Red
        severity = 'CRITICAL'
        emoji = '🚨'
    elif '⚠️' in message or 'HIGH' in message:
        color = '#FFA500'  # Orange
        severity = 'HIGH'
        emoji = '⚠️'
    else:
        color = '#FFFF00'  # Yellow
        severity = 'MEDIUM'
        emoji = '⚠️'

    # Build Slack attachment
    return {
        "text": f"{emoji} *{severity} Security Hub Finding*",
        "attachments": [
            {
                "color": color,
                "text": message.replace('\\n', '\n').strip('"'),
                "mrkdwn_in": ["text"]
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

                # Format for Slack
                slack_message = format_slack_message(sns_message)

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
