import logging

import boto3
import botocore.client
from pydantic import Field

from src.adapters.aws import get_boto_session
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SQSConfig(PydanticBaseEnvConfig):
    # SQS Queue URL will be required by the service using this adapter
    workflow_queue_url: str = Field(alias="WORKFLOW_QUEUE_URL")


def get_boto_sqs_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    if session is None:
        session = get_boto_session()
    return session.client("sqs")


class SQSClient:
    def __init__(self, queue_url: str, sqs_client: botocore.client.BaseClient | None = None):
        self.queue_url = queue_url
        self.client = sqs_client or get_boto_sqs_client()

    def receive_messages(
        self, max_messages: int = 10, wait_time: int = 10, visibility_timeout: int = 300
    ) -> list[dict]:
        """Fetch messages from SQS using long polling."""
        try:
            response = self.client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                VisibilityTimeout=visibility_timeout,
                AttributeNames=["All"],
                MessageAttributeNames=["All"],
            )
            return response.get("Messages", [])
        except Exception:
            logger.exception(
                "Failed to receive messages from SQS", extra={"queue_url": self.queue_url}
            )
            raise

    def delete_message_batch(self, receipt_handles: list[str]) -> dict[str, str]:
        """
        Deletes a batch of messages.
        Returns a mapping of receipt_handle -> status (Success or Error Code).
        """
        if not receipt_handles:
            return {}

        entries = [
            {"Id": str(i), "ReceiptHandle": handle} for i, handle in enumerate(receipt_handles)
        ]

        try:
            response = self.client.delete_message_batch(QueueUrl=self.queue_url, Entries=entries)

            results = {}
            for success in response.get("Successful", []):
                idx = int(success["Id"])
                results[receipt_handles[idx]] = "Success"

            for failure in response.get("Failed", []):
                idx = int(failure["Id"])
                results[receipt_handles[idx]] = failure.get("Code", "UnknownError")

            return results
        except Exception:
            logger.exception("Failed to delete message batch", extra={"queue_url": self.queue_url})
            raise
