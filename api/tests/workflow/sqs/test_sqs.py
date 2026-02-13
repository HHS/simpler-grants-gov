import logging

import boto3

from src.adapters.aws import SQSConfig, get_boto_sqs_client

logger = logging.getLogger(__name__)


def test_sqs_queue() -> None:
    """Test sending and receiving messages from the SQS queue."""
    sqs_config = SQSConfig()
    # setup local test
    sqs_client = get_boto_sqs_client(
        sqs_config,
        boto3.Session(
            region_name="us-east-1", aws_access_key_id="NO_CREDS", aws_secret_access_key="NO_CREDS"
        ),
    )

    response = sqs_client.get_queue_url(QueueName=sqs_config.workflow_queue_name)
    queue_url = response["QueueUrl"]
    queue_status = response["ResponseMetadata"]["HTTPStatusCode"]

    assert queue_url is not None
    assert queue_status == 200
