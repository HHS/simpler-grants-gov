import logging

import boto3

import src.logging
from src.adapters.aws.dynamodb_adapter import DynamoDBConfig
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def setup_local_dynamodb() -> None:
    """Set up local DynamoDB tables for development"""
    with src.logging.init(__package__):
        error_if_not_local()

        dynamodbconfig = DynamoDBConfig()

        dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url=dynamodbconfig.aws_dynamodb_endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )

        _create_virus_scan_table(dynamodb, dynamodbconfig.file_scan_cache_table_name)


def _create_virus_scan_table(
    dynamodb: boto3.resources.base.ServiceResource, file_scan_cache_table_name: str
) -> None:
    """Create the local-virus-scan table if it doesn't already exist"""
    logger.info("Creating DynamoDB table if it does not already exist")

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
        logger.info("Successfully created table", extra={"table_name": file_scan_cache_table_name})
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        logger.info("Table already exists", extra={"table_name": file_scan_cache_table_name})
    except Exception as e:
        logger.exception(
            "Unexpected error creating table",
            extra={"table_name": file_scan_cache_table_name, "error_info": e},
        )
        raise
