import logging

import boto3

import src.logging
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

# DynamoDB table configuration
LOCAL_VIRUS_SCAN_TABLE_NAME = "local-virus-scan"


def setup_local_dynamodb() -> None:
    """Set up local DynamoDB tables for development"""
    with src.logging.init(__package__):
        error_if_not_local()

        # Create DynamoDB client pointing to local instance
        dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url="http://host.docker.internal:8000",
            region_name="us-east-1",
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )

        print(list(dynamodb.tables.all()))
        _create_virus_scan_table(dynamodb)


def _create_virus_scan_table(dynamodb: boto3.resource) -> None:
    """Create the local-virus-scan table if it doesn't already exist"""
    logger.info(
        "Creating DynamoDB table '%s' if it does not already exist", LOCAL_VIRUS_SCAN_TABLE_NAME
    )

    try:
        table = dynamodb.create_table(
            TableName=LOCAL_VIRUS_SCAN_TABLE_NAME,
            KeySchema=[
                {"AttributeName": "attachment_id", "KeyType": "HASH"},  # Partition key
            ],
            AttributeDefinitions=[
                {"AttributeName": "attachment_id", "AttributeType": "S"},  # String type
            ],
            BillingMode="PAY_PER_REQUEST",  # On-demand billing for local development
        )
        table.wait_until_exists()
        logger.info("Successfully created table '%s'", LOCAL_VIRUS_SCAN_TABLE_NAME)
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        logger.info("Table '%s' already exists", LOCAL_VIRUS_SCAN_TABLE_NAME)
    except Exception as e:
        logger.error("Error creating table '%s': %s", LOCAL_VIRUS_SCAN_TABLE_NAME, {e})
        raise
