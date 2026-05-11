import logging
import uuid

import boto3
import botocore.client
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from src.adapters.aws import get_boto_session
from src.adapters.aws.aws_session import is_local_aws

logger = logging.getLogger(__name__)

# An example of what the SES v2 send_email response looks like:
"""
{
    "MessageId": "010001234567abcd-12345678-abcd-1234-abcd-1234567890ab-000000",
    "ResponseMetadata": {
        "RequestId": "abcdef11-1111-2222-3333-4444abcabc",
        "HTTPStatusCode": 200,
        "HTTPHeaders": {
            # Generic HTTP/AWS headers
        },
        "RetryAttempts": 0
    }
}
"""


class SesResult(BaseModel):
    """Result of sending an email via SES"""

    delivery_status: str = "SUCCESSFUL"
    status_code: int = 200
    status_message: str = "Ok"
    message_id: str = "message-not-sent"
    trace_id: str | None = None


class SesResponse(BaseModel):
    """Response from SES send_email call"""

    results: dict[str, SesResult] = Field(default_factory=dict)


def get_ses_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    if session is None:
        session = get_boto_session()

    return session.client("sesv2")


def send_ses_email(
    to_address: str,
    subject: str,
    message: str,
    from_email: str,
    ses_client: botocore.client.BaseClient | None = None,
    trace_id: str | None = None,
) -> SesResponse:
    """Send an email using Amazon SES v2.

    Args:
        to_address: Recipient email address
        subject: Email subject line
        message: Email body (supports HTML)
        from_email: Sender email address
        ses_client: Optional SES client (for testing)
        trace_id: Optional trace ID for logging

    Returns:
        SesResponse with delivery details

    Raises:
        ClientError: If SES API call fails
        Exception: If email delivery fails
    """

    if ses_client is None:
        ses_client = get_ses_client()

    if trace_id is None:
        trace_id = str(uuid.uuid4())

    # Based on: https://docs.aws.amazon.com/ses/latest/dg/send-email-api.html
    request = {
        "FromEmailAddress": from_email,
        "Destination": {"ToAddresses": [to_address]},
        "Content": {
            "Simple": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": message, "Charset": "UTF-8"},
                    "Text": {"Data": message, "Charset": "UTF-8"},
                },
            }
        },
    }

    # If we are running locally (or in unit tests), don't actually query AWS
    if is_local_aws():
        return _handle_mock_response(request, to_address, trace_id)

    try:
        raw_response = ses_client.send_email(**request)
    except ClientError as e:
        logger.exception("Failed to send email", extra={"trace_id": trace_id})
        # Convert to a failed SesResponse for consistency
        error_message = str(e)
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        http_status = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode", 500)

        result = SesResult(
            delivery_status="PERMANENT_FAILURE",
            status_code=http_status,
            status_message=f"{error_code}: {error_message}",
            message_id="message-not-sent",
            trace_id=trace_id,
        )
        response = SesResponse(results={to_address: result})

        logger.error(
            "Failed to send email",
            extra={
                "ses_delivery_status": result.delivery_status,
                "ses_message_id": result.message_id,
                "ses_status_code": result.status_code,
                "ses_status_message": result.status_message,
                "ses_trace_id": trace_id,
            },
        )
        raise Exception(
            f"Failed to send email ses_trace_id: {trace_id} with ses_delivery_status: {result.delivery_status}"
        )

    # SES v2 returns a MessageId on success
    message_id = raw_response.get("MessageId", "message-not-sent")
    result = SesResult(
        delivery_status="SUCCESSFUL",
        status_code=200,
        status_message="Ok",
        message_id=message_id,
        trace_id=trace_id,
    )

    return SesResponse(results={to_address: result})


_mock_responses: list[tuple[dict, SesResponse]] = []


def _handle_mock_response(request: dict, to_address: str, trace_id: str) -> SesResponse:
    """Handle mock responses for local testing"""
    # By default, return a response that roughly looks like a real success
    response = SesResponse(
        results={
            to_address: SesResult(
                delivery_status="SUCCESSFUL",
                status_code=200,
                status_message="Ok",
                message_id=str(uuid.uuid4()),
                trace_id=trace_id,
            )
        }
    )
    global _mock_responses
    _mock_responses.append((request, response))

    return response


def _clear_mock_responses() -> None:
    """Clear mock responses (for testing)"""
    global _mock_responses
    _mock_responses = []


def _get_mock_responses() -> list[tuple[dict, SesResponse]]:
    """Get mock responses (for testing)"""
    return _mock_responses
