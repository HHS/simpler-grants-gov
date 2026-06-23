import logging

import boto3
import botocore.client
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from grants_shared.adapters.aws.aws_session import get_boto_session, is_local_aws
from grants_shared.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SESConfig(PydanticBaseEnvConfig):
    aws_ses_from_email: str = Field(alias="AWS_SES_FROM_EMAIL")


class SESResponse(BaseModel):
    message_id: str = Field(alias="MessageId")


def get_ses_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    if session is None:
        session = get_boto_session()

    return session.client("sesv2")


def send_email(
    to_address: str,
    subject: str,
    message: str,
    ses_client: botocore.client.BaseClient | None = None,
) -> str:
    """
    Send an email using AWS SESv2.

    Args:
        to_address: Email address to send to
        subject: Email subject line
        message: Email body (supports both HTML and plain text)
        ses_client: Optional SESv2 client (for testing)

    Returns:
        Message ID from SESv2

    Raises:
        Exception: If email fails to send
    """
    config = SESConfig()

    if is_local_aws():
        # the local logger has the email details for debugging
        logger.info(
            "Local environment detected - not sending actual email",
            extra={
                "to_address": to_address,
                "subject": subject,
                "from_address": config.aws_ses_from_email,
            },
        )
        return "local-mock-message-id"

    if ses_client is None:
        ses_client = get_ses_client()

    try:
        logger.info("Sending email via SESv2")

        response = ses_client.send_email(
            FromEmailAddress=config.aws_ses_from_email,
            Destination={"ToAddresses": [to_address]},
            Content={
                "Simple": {
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": message, "Charset": "UTF-8"},
                        "Html": {"Data": message, "Charset": "UTF-8"},
                    },
                }
            },
        )

        response_object = SESResponse.model_validate(response)
        message_id = response_object.message_id

        logger.info(
            "Successfully sent email via SESv2",
            extra={
                "message_id": message_id,
            },
        )

        return message_id

    except ClientError:
        logger.exception("Failed to send email via SESv2")
        raise
