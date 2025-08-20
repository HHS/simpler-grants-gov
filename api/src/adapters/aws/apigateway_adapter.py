import logging
from abc import ABC, ABCMeta, abstractmethod
from typing import Any, Dict, List, Optional

import boto3
import botocore.client
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from src.adapters.aws.aws_session import get_boto_session
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ApiKeyResponse(BaseModel):
    id: str = Field(alias="id")
    name: str = Field(alias="name")
    description: str | None = Field(alias="description", default=None)
    enabled: bool = Field(alias="enabled", default=True)
    created_date: str | None = Field(alias="createdDate", default=None)
    last_updated_date: str | None = Field(alias="lastUpdatedDate", default=None)
    stage_keys: List[str] = Field(alias="stageKeys", default_factory=list)
    tags: Dict[str, str] = Field(alias="tags", default_factory=dict)
    value: str | None = Field(alias="value", default=None)


class UsagePlanResponse(BaseModel):
    id: str = Field(alias="id")
    name: str = Field(alias="name")
    description: str | None = Field(alias="description", default=None)
    api_stages: List[Dict[str, Any]] = Field(alias="apiStages", default_factory=list)
    throttle: Dict[str, Any] | None = Field(alias="throttle", default=None)
    quota: Dict[str, Any] | None = Field(alias="quota", default=None)
    product_code: str | None = Field(alias="productCode", default=None)
    tags: Dict[str, str] = Field(alias="tags", default_factory=dict)


class BaseApiGatewayClient(ABC, metaclass=ABCMeta):
    @abstractmethod
    def create_api_key(
        self,
        name: str,
        description: str | None = None,
        enabled: bool = True,
        generate_distinct_id: bool = True,
        value: str | None = None,
        stage_keys: List[Dict[str, str]] | None = None,
        tags: Dict[str, str] | None = None,
    ) -> ApiKeyResponse:
        pass

    @abstractmethod
    def get_api_key(self, api_key_id: str, include_value: bool = False) -> ApiKeyResponse:
        pass

    @abstractmethod
    def update_api_key(
        self,
        api_key_id: str,
        patch_ops: List[Dict[str, Any]],
    ) -> ApiKeyResponse:
        pass

    @abstractmethod
    def delete_api_key(self, api_key_id: str) -> None:
        pass

    @abstractmethod
    def get_usage_plans(
        self,
        position: str | None = None,
        limit: int | None = None,
        key_id: str | None = None,
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
        key_type: str = "API_KEY",
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
    ) -> None:
        pass


class ApiGatewayClient(BaseApiGatewayClient):
    def __init__(self) -> None:
        self.client = get_boto_apigateway_client()

    def create_api_key(
        self,
        name: str,
        description: str | None = None,
        enabled: bool = True,
        generate_distinct_id: bool = True,
        value: str | None = None,
        stage_keys: List[Dict[str, str]] | None = None,
        tags: Dict[str, str] | None = None,
    ) -> ApiKeyResponse:
        request_params: Dict[str, Any] = {
            "name": name,
            "enabled": enabled,
            "generateDistinctId": generate_distinct_id,
        }

        if description:
            request_params["description"] = description
        if value:
            request_params["value"] = value
        if stage_keys:
            request_params["stageKeys"] = stage_keys
        if tags:
            request_params["tags"] = tags

        try:
            response = self.client.create_api_key(**request_params)
            return ApiKeyResponse.model_validate(response)
        except ClientError:
            logger.exception("Error calling create_api_key")
            raise

    def get_api_key(self, api_key_id: str, include_value: bool = False) -> ApiKeyResponse:
        try:
            response = self.client.get_api_key(apiKey=api_key_id, includeValue=include_value)
            return ApiKeyResponse.model_validate(response)
        except ClientError:
            logger.exception("Error calling get_api_key")
            raise

    def update_api_key(
        self,
        api_key_id: str,
        patch_ops: List[Dict[str, Any]],
    ) -> ApiKeyResponse:
        try:
            response = self.client.update_api_key(apiKey=api_key_id, patchOps=patch_ops)
            return ApiKeyResponse.model_validate(response)
        except ClientError:
            logger.exception("Error calling update_api_key")
            raise

    def delete_api_key(self, api_key_id: str) -> None:
        try:
            self.client.delete_api_key(apiKey=api_key_id)
        except ClientError:
            logger.exception("Error calling delete_api_key")
            raise

    def get_usage_plans(
        self,
        position: str | None = None,
        limit: int | None = None,
        key_id: str | None = None,
    ) -> Dict[str, Any]:
        request_params: Dict[str, Any] = {}
        if position:
            request_params["position"] = position
        if limit:
            request_params["limit"] = limit
        if key_id:
            request_params["keyId"] = key_id

        try:
            response = self.client.get_usage_plans(**request_params)
            return response
        except ClientError:
            logger.exception("Error calling get_usage_plans")
            raise

    def create_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
        key_type: str = "API_KEY",
    ) -> Dict[str, Any]:
        try:
            response = self.client.create_usage_plan_key(
                usagePlanId=usage_plan_id, keyId=key_id, keyType=key_type
            )
            return response
        except ClientError:
            logger.exception("Error calling create_usage_plan_key")
            raise

    def delete_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
    ) -> None:
        try:
            self.client.delete_usage_plan_key(usagePlanId=usage_plan_id, keyId=key_id)
        except ClientError:
            logger.exception("Error calling delete_usage_plan_key")
            raise


class MockApiGatewayClient(BaseApiGatewayClient):
    def __init__(self) -> None:
        self.mock_api_keys: Dict[str, Dict[str, Any]] = {}
        self.mock_usage_plans: Dict[str, Dict[str, Any]] = {}
        self.mock_usage_plan_keys: Dict[str, List[str]] = {}
        self._key_counter = 1
        self._plan_counter = 1

    def create_api_key(
        self,
        name: str,
        description: str | None = None,
        enabled: bool = True,
        generate_distinct_id: bool = True,
        value: str | None = None,
        stage_keys: List[Dict[str, str]] | None = None,
        tags: Dict[str, str] | None = None,
    ) -> ApiKeyResponse:
        """Create a mock API key."""
        key_id = f"mock-api-key-{self._key_counter}"
        self._key_counter += 1

        api_key_data = {
            "id": key_id,
            "name": name,
            "description": description,
            "enabled": enabled,
            "createdDate": "2024-01-01T00:00:00Z",
            "lastUpdatedDate": "2024-01-01T00:00:00Z",
            "stageKeys": stage_keys or [],
            "tags": tags or {},
            "value": value or f"mock-key-value-{self._key_counter}",
        }

        self.mock_api_keys[key_id] = api_key_data
        return ApiKeyResponse.model_validate(api_key_data)

    def get_api_key(self, api_key_id: str, include_value: bool = False) -> ApiKeyResponse:
        """Get a mock API key."""
        if api_key_id not in self.mock_api_keys:
            raise ClientError(
                error_response={
                    "Error": {"Code": "NotFoundException", "Message": "API Key not found"}
                },
                operation_name="GetApiKey",
            )

        api_key_data = self.mock_api_keys[api_key_id].copy()
        if not include_value:
            api_key_data.pop("value", None)

        return ApiKeyResponse.model_validate(api_key_data)

    def update_api_key(
        self,
        api_key_id: str,
        patch_ops: List[Dict[str, Any]],
    ) -> ApiKeyResponse:
        """Update a mock API key."""
        if api_key_id not in self.mock_api_keys:
            raise ClientError(
                error_response={
                    "Error": {"Code": "NotFoundException", "Message": "API Key not found"}
                },
                operation_name="UpdateApiKey",
            )

        api_key_data = self.mock_api_keys[api_key_id]

        # Apply patch operations (simplified implementation)
        for patch_op in patch_ops:
            op = patch_op.get("op")
            path = patch_op.get("path", "").lstrip("/")
            value = patch_op.get("value")

            if op == "replace":
                if path in api_key_data:
                    api_key_data[path] = value
            elif op == "add":
                api_key_data[path] = value
            elif op == "remove":
                api_key_data.pop(path, None)

        api_key_data["lastUpdatedDate"] = "2024-01-01T00:00:00Z"
        return ApiKeyResponse.model_validate(api_key_data)

    def delete_api_key(self, api_key_id: str) -> None:
        """Delete a mock API key."""
        if api_key_id not in self.mock_api_keys:
            raise ClientError(
                error_response={
                    "Error": {"Code": "NotFoundException", "Message": "API Key not found"}
                },
                operation_name="DeleteApiKey",
            )
        del self.mock_api_keys[api_key_id]

    def get_usage_plans(
        self,
        position: str | None = None,
        limit: int | None = None,
        key_id: str | None = None,
    ) -> Dict[str, Any]:
        """Get mock usage plans."""
        plans = list(self.mock_usage_plans.values())

        # Filter by key_id if specified
        if key_id:
            filtered_plans = []
            for plan in plans:
                plan_id = plan["id"]
                if (
                    plan_id in self.mock_usage_plan_keys
                    and key_id in self.mock_usage_plan_keys[plan_id]
                ):
                    filtered_plans.append(plan)
            plans = filtered_plans

        # Apply pagination (simplified)
        if limit:
            plans = plans[:limit]

        return {"items": plans}

    def create_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
        key_type: str = "API_KEY",
    ) -> Dict[str, Any]:
        """Create a mock usage plan key association."""
        if usage_plan_id not in self.mock_usage_plan_keys:
            self.mock_usage_plan_keys[usage_plan_id] = []

        if key_id not in self.mock_usage_plan_keys[usage_plan_id]:
            self.mock_usage_plan_keys[usage_plan_id].append(key_id)

        return {
            "id": key_id,
            "type": key_type,
            "name": f"mock-key-{key_id}",
        }

    def delete_usage_plan_key(
        self,
        usage_plan_id: str,
        key_id: str,
    ) -> None:
        """Delete a mock usage plan key association."""
        if usage_plan_id in self.mock_usage_plan_keys:
            if key_id in self.mock_usage_plan_keys[usage_plan_id]:
                self.mock_usage_plan_keys[usage_plan_id].remove(key_id)

    def add_mock_usage_plan(self, usage_plan_data: Dict[str, Any]) -> None:
        """Helper method to add mock usage plans for testing."""
        plan_id = usage_plan_data.get("id", f"mock-usage-plan-{self._plan_counter}")
        self._plan_counter += 1
        usage_plan_data["id"] = plan_id
        self.mock_usage_plans[plan_id] = usage_plan_data


class ApiGatewayConfig(PydanticBaseEnvConfig):
    use_mock_apigateway_client: bool = False
    # Add any other API Gateway specific config here
    # For example, if you need to configure a specific API Gateway name/ID
    # api_gateway_name: str | None = None


def get_apigateway_client() -> BaseApiGatewayClient:
    """Get API Gateway client - mock or real based on configuration."""
    config = ApiGatewayConfig()
    if config.use_mock_apigateway_client:
        return MockApiGatewayClient()
    else:
        return ApiGatewayClient()


def get_boto_apigateway_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    """Get boto3 API Gateway client."""
    if session is None:
        session = get_boto_session()

    return session.client("apigateway")
