import logging
from pydantic import BaseModel
from typing import Any
import uuid
from src.adapters.aws.sqs_adapter import (
    SQSClient,
    SQSConfig,
    SQSDeleteBatchResponse,
    SQSSendMessageResponse,
    get_boto_sqs_client,
)


logger = logging.getLogger(__name__)


class ApplicationSubmissionMessage(BaseModel):
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
    try:
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
    except Exception as e:
       logger.exception(
            "Failed to queue application submission message - the scheduled submission task will process this application",
            extra={
                "application_id": application_id,
                "error_message": repr(e)
            },
        )
