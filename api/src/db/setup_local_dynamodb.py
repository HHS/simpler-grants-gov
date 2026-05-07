import logging
import time

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

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
        # Configure with increased timeouts for CI/CD environments
        config = Config(
            connect_timeout=10,
            read_timeout=30,
            retries={"max_attempts": 3, "mode": "standard"},
        )
        dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name="us-east-1",
            aws_access_key_id="local",
            aws_secret_access_key="local",
            config=config,
        )

        # Wait for DynamoDB Local to be ready (important for CI/CD)
        _wait_for_dynamodb_ready(dynamodb)

        _create_virus_scan_table(dynamodb)


def _wait_for_dynamodb_ready(dynamodb: boto3.resource, max_attempts: int = 5) -> None:
    """Wait for DynamoDB Local to be ready by attempting to list tables"""
    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(
                "Checking if DynamoDB Local is ready (attempt %d/%d)", attempt, max_attempts
            )
            list(dynamodb.tables.all())
            logger.info("DynamoDB Local is ready")
            return
        except (BotoCoreError, ClientError) as e:
            if attempt < max_attempts:
                wait_time = 2**attempt  # Exponential backoff: 2, 4, 8, 16 seconds
                logger.warning(
                    "DynamoDB Local not ready yet: %s. Retrying in %d seconds...", e, wait_time
                )
                time.sleep(wait_time)
            else:
                logger.error(
                    "DynamoDB Local failed to become ready after %d attempts", max_attempts
                )
                raise


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
