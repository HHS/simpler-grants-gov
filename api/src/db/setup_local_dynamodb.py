import logging
import os

import boto3

import src.logging
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

# DynamoDB table configuration
file_scan_cache_table_name = os.getenv("FILE_SCAN_CACHE_TABLE_NAME", "local-virus-scan")


def setup_local_dynamodb() -> None:
    """Set up local DynamoDB tables for development"""
    with src.logging.init(__package__):
        error_if_not_local()

        dynamodb_endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://dynamodb-local:8000")

        dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url=dynamodb_endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )

        _create_virus_scan_table(dynamodb)


def _create_virus_scan_table(dynamodb: boto3.resources.base.ServiceResource) -> None:
    """Create the local-virus-scan table if it doesn't already exist"""
    logger.info(
        "Creating DynamoDB table '%s' if it does not already exist", file_scan_cache_table_name
    )

    try:
        table = dynamodb.create_table(
            TableName=file_scan_cache_table_name,
            KeySchema=[
                {"AttributeName": "attachment_id", "KeyType": "HASH"},  # Partition key
            ],
            AttributeDefinitions=[
                {"AttributeName": "attachment_id", "AttributeType": "S"},  # String type
            ],
            BillingMode="PAY_PER_REQUEST",  # On-demand billing for local development
        )
        table.wait_until_exists()
        logger.info("Successfully created table '%s'", file_scan_cache_table_name)
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        logger.info("Table '%s' already exists", file_scan_cache_table_name)
    except Exception as e:
        logger.exception("Error creating table '%s': %s", file_scan_cache_table_name, e)
        raise
