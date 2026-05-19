import logging
from typing import Any

import boto3
import botocore.client
from pydantic import BaseModel, Field

from src.adapters.aws import get_aws_config, get_boto_session
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class DynamoDBConfig(PydanticBaseEnvConfig):
    aws_dynamodb_endpoint_url: str | None = Field(alias="AWS_DYNAMODB_ENDPOINT_URL", default=None)
    file_scan_cache_table_name: str = Field(alias="FILE_SCAN_CACHE_TABLE_NAME")


class DynamoDBGetItemResponse(BaseModel):
    """Represents the response from getting an item from DynamoDB."""

    item: dict[str, Any] | None = Field(default=None)


def get_boto_dynamodb_client(
    dynamodb_config: DynamoDBConfig | None = None, session: boto3.Session | None = None
) -> botocore.client.BaseClient:
    if dynamodb_config is None:
        dynamodb_config = DynamoDBConfig()

    params = {}
    if dynamodb_config.aws_dynamodb_endpoint_url is not None:
        params["endpoint_url"] = dynamodb_config.aws_dynamodb_endpoint_url

    if session is None:
        session = get_boto_session()

    return session.client("dynamodb", region_name=get_aws_config().aws_region, **params)


class DynamoDBClient:
    def __init__(self, dynamodb_client: botocore.client.BaseClient | None = None):
        self.client = dynamodb_client or get_boto_dynamodb_client()

    def get_item(
        self,
        table_name: str,
        key: dict[str, Any],
        consistent_read: bool = True,
    ) -> DynamoDBGetItemResponse:
        """
        Get an item from DynamoDB by its key.

        Args:
            table_name: The name of the DynamoDB table
            key: The key of the item to retrieve (in DynamoDB format)
            consistent_read: Whether to use consistent read (default: True)

        Returns:
            DynamoDBGetItemResponse containing the item if found, None otherwise
        """
        try:
            logger.info(
                "Getting item from DynamoDB",
                extra={"table_name": table_name, "key": str(key)},
            )

            response = self.client.get_item(
                TableName=table_name,
                Key=key,
                ConsistentRead=consistent_read,
            )

            item = response.get("Item")

            if item:
                logger.info(
                    "Successfully retrieved item from DynamoDB",
                    extra={"table_name": table_name, "key": str(key)},
                )
            else:
                logger.info(
                    "Item not found in DynamoDB",
                    extra={"table_name": table_name, "key": str(key)},
                )

            return DynamoDBGetItemResponse(item=item)

        except Exception:
            logger.exception(
                "Failed to get item from DynamoDB",
                extra={"table_name": table_name, "key": str(key)},
            )
            raise
