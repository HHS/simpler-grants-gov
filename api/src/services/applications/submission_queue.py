import logging
import uuid
from typing import Any

from pydantic import BaseModel

from src.adapters.aws.sqs_adapter import SQSClient, SQSConfig

logger = logging.getLogger(__name__)


class ApplicationSubmissionMessage(BaseModel):
    """The message we send over SQS to request a submission build for one application.

    Only the application_id is needed to process the message - the builder
    audits against the application's submitted_by user. The other fields
    exist for traceability in logs and debugging.
    """

    message_id: uuid.UUID
    application_id: uuid.UUID
    submitted_by_user_id: uuid.UUID | None = None

    def get_log_extra(self) -> dict[str, Any]:
        return {
            "submission_message_id": self.message_id,
            "application_id": self.application_id,
            "submitted_by_user_id": self.submitted_by_user_id,
        }


def send_application_submission_message(
    application_id: uuid.UUID, submitted_by_user_id: uuid.UUID | None = None
) -> None:
    """Send a submission-build request to the submission queue."""
    message = ApplicationSubmissionMessage(
        message_id=uuid.uuid4(),
        application_id=application_id,
        submitted_by_user_id=submitted_by_user_id,
    )

    config = SQSConfig()
    sqs_client = SQSClient(queue_url=config.workflow_queue_url)
    sqs_client.send_message(message.model_dump())
    logger.info(
        "Successfully sent application submission message to queue",
        extra=message.get_log_extra(),
    )
