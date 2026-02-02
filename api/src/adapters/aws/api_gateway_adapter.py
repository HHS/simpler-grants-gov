import logging
import uuid

import boto3
import botocore.client
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from src.adapters.aws import get_boto_session
from src.adapters.aws.aws_session import is_local_aws
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ApiKeyImportResponse(BaseModel):
    id: str = Field(alias="id")
    name: str = Field(alias="name")
    description: str | None = Field(alias="description", default=None)
    enabled: bool = Field(alias="enabled", default=True)
    stage_keys: list[str] = Field(alias="stageKeys", default_factory=list)
    tags: dict[str, str] = Field(alias="tags", default_factory=dict)


class ApiGatewayConfig(PydanticBaseEnvConfig):
    """Configuration for AWS API Gateway integration"""

    # Usage plan ID for newly created API keys (typically the public usage plan)
    default_usage_plan_id: str = Field(alias="API_GATEWAY_DEFAULT_USAGE_PLAN_ID")


def get_boto_api_gateway_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    """Get a boto3 API Gateway client"""
    if session is None:
        session = get_boto_session()

    return session.client("apigateway")


def import_api_key(
    api_key: str,
    name: str,
    description: str | None = None,
    enabled: bool = True,
    usage_plan_id: str | None = None,
    api_gateway_client: botocore.client.BaseClient | None = None,
) -> ApiKeyImportResponse:
    """
    Import an API key into AWS API Gateway using CSV format.

    This function uses AWS API Gateway's CSV import functionality to import an API key
    and associate it with a usage plan in a single operation, eliminating the need for
    separate usage plan association calls.

    Args:
        api_key: The API key value to import (must be 20-128 characters)
        name: Name for the API key (cannot exceed 1024 characters)
        description: Optional description for the API key
        enabled: Whether the API key should be enabled (default: True)
        usage_plan_id: Optional usage plan ID to associate the key with during import
        api_gateway_client: Optional pre-configured API Gateway client

    Returns:
        ApiKeyImportResponse with the imported key details
    """

    if is_local_aws():
        return _handle_mock_import_response(api_key, name, description, enabled, usage_plan_id)

    if api_gateway_client is None:
        api_gateway_client = get_boto_api_gateway_client()

    # Format the API key data as CSV for import
    # AWS API Gateway expects CSV format: name,key,description,enabled,usageplanIds
    # Header row is optional but improves readability and maintainability
    usage_plan_ids_str = f'"{usage_plan_id}"' if usage_plan_id else ""
    header = "name,key,description,enabled,usageplanIds"
    data_row = f"{name},{api_key},{description or ''},{'true' if enabled else 'false'},{usage_plan_ids_str}"
    csv_data = f"{header}\n{data_row}"

    try:
        response = api_gateway_client.import_api_keys(
            body=csv_data.encode("utf-8"), format="csv", failOnWarnings=True
        )
    except ClientError:
        logger.exception("Error importing API key to AWS API Gateway")
        raise
    except Exception:
        logger.exception("Unexpected error importing API key")
        raise

    if response.get("warnings"):
        logger.warning("API Gateway import warnings", extra={"warnings": response["warnings"]})

    imported_key_ids = response.get("ids", [])
    if not imported_key_ids:
        raise Exception("No API key IDs returned from import operation")

    key_id = imported_key_ids[0]

    try:
        key_details = api_gateway_client.get_api_key(apiKey=key_id, includeValue=False)
    except ClientError:
        logger.exception(
            "Error retrieving API key details from AWS API Gateway",
            extra={"key_id": key_id},
        )
        raise
    except Exception as e:
        logger.exception(
            "Unexpected error retrieving API key details", extra={"error": str(e), "key_id": key_id}
        )
        raise

    api_key_response = ApiKeyImportResponse.model_validate(key_details)

    if usage_plan_id:
        logger.info(
            "API key imported with usage plan association",
            extra={"api_key_id": api_key_response.id, "usage_plan_id": usage_plan_id},
        )

    return api_key_response


_mock_import_responses: list[tuple[dict, ApiKeyImportResponse]] = []


def _handle_mock_import_response(
    api_key: str, name: str, description: str | None, enabled: bool, usage_plan_id: str | None
) -> ApiKeyImportResponse:
    response = ApiKeyImportResponse(
        id=f"mock-{str(uuid.uuid4())[:8]}",
        name=name,
        description=description,
        enabled=enabled,
        stageKeys=[],
        tags={},
    )

    global _mock_import_responses
    request_data = {
        "api_key": api_key,
        "name": name,
        "description": description,
        "enabled": enabled,
        "usage_plan_id": usage_plan_id,
    }
    _mock_import_responses.append((request_data, response))

    logger.info(
        "Mock API key import",
        extra={"mock_key_id": response.id, "key_name": name, "usage_plan_id": usage_plan_id},
    )

    return response


def _clear_mock_import_responses() -> None:
    global _mock_import_responses
    _mock_import_responses = []


def _get_mock_import_responses() -> list[tuple[dict, ApiKeyImportResponse]]:
    return _mock_import_responses
