import boto3

from src.adapters.aws.sqs_adapter import SQSClient, SQSConfig
from src.workflow.event.workflow_event import WorkflowEvent


def send_workflow_event_to_queue(workflow_event: WorkflowEvent) -> None:
    config = SQSConfig()

    sqs_client = SQSClient(queue_url=config.workflow_queue_url)

    print(workflow_event.model_dump())
    response = sqs_client.send_message(workflow_event.model_dump())

    # TODO - something with the response?