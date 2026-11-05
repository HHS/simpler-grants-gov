import logging

from src.adapters.aws.sqs_adapter import SQSClient, SQSConfig
from src.workflow.event.workflow_event import WorkflowEvent

logger = logging.getLogger(__name__)


def send_workflow_event_to_queue(workflow_event: WorkflowEvent) -> None:
    """Send a workflow event to the workflow SQS queue."""
    config = SQSConfig()
    sqs_client = SQSClient(queue_url=config.workflow_queue_url)
    sqs_client.send_message(workflow_event.model_dump())
    logger.info(
        "Successfully sent SQS message to workflow queue", extra=workflow_event.get_log_extra()
    )
