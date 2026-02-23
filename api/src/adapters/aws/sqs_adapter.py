import logging

import boto3
import botocore.client
from pydantic import BaseModel, Field

from src.adapters.aws import get_boto_session
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SQSConfig(PydanticBaseEnvConfig):
    workflow_queue_url: str = Field(alias="WORKFLOW_QUEUE_URL")
    s3_endpoint_url: str = Field(alias="S3_ENDPOINT_URL")


class SQSMessage(BaseModel):
    """Represents a simplified SQS message object."""

    body: str = Field(alias="Body")
    receipt_handle: str = Field(alias="ReceiptHandle")
    message_id: str = Field(alias="MessageId")
    attributes: dict[str, str] = Field(alias="Attributes", default_factory=dict)


class SQSDeleteBatchResponse(BaseModel):
    """Represents the results of an SQS batch delete operation."""

    successful_deletes: set[str] = Field(default_factory=set)
    failed_deletes: set[str] = Field(default_factory=set)


def get_boto_sqs_client(
    sqs_config: SQSConfig | None = None, session: boto3.Session | None = None
) -> botocore.client.BaseClient:
    if sqs_config is None:
        sqs_config = SQSConfig()

    params = {}
    if sqs_config.s3_endpoint_url is not None:
        params["endpoint_url"] = sqs_config.s3_endpoint_url

    if session is None:
        session = get_boto_session()

    return session.client("sqs", **params)


class SQSClient:
    def __init__(self, queue_url: str, sqs_client: botocore.client.BaseClient | None = None):
        self.queue_url = queue_url
        self.client = sqs_client or get_boto_sqs_client()

    def receive_messages(
        self, max_messages: int = 10, wait_time: int = 10, visibility_timeout: int = 300
    ) -> list[SQSMessage]:
        """Fetch messages from SQS using long polling and return as SQSMessage objects."""
        try:
            response = self.client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                VisibilityTimeout=visibility_timeout,
                AttributeNames=["All"],
                MessageAttributeNames=["All"],
            )

            raw_messages = response.get("Messages", [])

            return [SQSMessage.model_validate(m) for m in raw_messages]

        except Exception:
            logger.exception(
                "Failed to receive messages from SQS", extra={"queue_url": self.queue_url}
            )
            raise

    def delete_message_batch(self, receipt_handles: list[str]) -> SQSDeleteBatchResponse:
        """
        Deletes a batch of messages and returns an SQSDeleteBatchResponse.
        """
        if not receipt_handles:
            return SQSDeleteBatchResponse()

        receipt_mapping = {}
        entries = []
        for i, handle in enumerate(receipt_handles):
            id_str = str(i)
            receipt_mapping[id_str] = handle
            entries.append({"Id": id_str, "ReceiptHandle": handle})

        try:
            response = self.client.delete_message_batch(QueueUrl=self.queue_url, Entries=entries)

            batch_results = SQSDeleteBatchResponse()

            for success in response.get("Successful", []):
                batch_results.successful_deletes.add(receipt_mapping[success["Id"]])

            for failure in response.get("Failed", []):
                batch_results.failed_deletes.add(receipt_mapping[failure["Id"]])

            return batch_results

        except Exception:
            logger.exception("Failed to delete message batch", extra={"queue_url": self.queue_url})
            raise
