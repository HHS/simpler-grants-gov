from unittest.mock import patch

import pytest

from src.adapters.aws.apigateway_adapter import (
    ApiGatewayClient,
    ApiGatewayConfig,
    MockApiGatewayClient,
    get_apigateway_client,
)


class TestApiGatewayAdapter:
    def test_get_apigateway_client_returns_mock_when_configured(self):
        """Test that get_apigateway_client returns mock client when USE_MOCK_APIGATEWAY_CLIENT=True."""
        with patch.dict("os.environ", {"USE_MOCK_APIGATEWAY_CLIENT": "TRUE"}):
            client = get_apigateway_client()
            assert isinstance(client, MockApiGatewayClient)

    def test_get_apigateway_client_returns_real_when_not_configured(self):
        """Test that get_apigateway_client returns real client when USE_MOCK_APIGATEWAY_CLIENT=False."""
        with patch.dict("os.environ", {"USE_MOCK_APIGATEWAY_CLIENT": "FALSE"}):
            client = get_apigateway_client()
            assert isinstance(client, ApiGatewayClient)

    def test_get_apigateway_client_defaults_to_real_client(self):
        """Test that get_apigateway_client defaults to real client when env var not set."""
        with patch.dict("os.environ", {}, clear=True):
            client = get_apigateway_client()
            assert isinstance(client, ApiGatewayClient)

    def test_apigateway_config_defaults(self):
        """Test that ApiGatewayConfig has correct defaults when env var not set."""
        with patch.dict("os.environ", {}, clear=True):
            config = ApiGatewayConfig()
            assert config.use_mock_apigateway_client is False


class TestMockApiGatewayClient:
    def test_create_api_key(self):
        """Test creating an API key with mock client."""
        client = MockApiGatewayClient()

        response = client.create_api_key(
            name="test-key", description="Test API key", enabled=True, tags={"Environment": "test"}
        )

        assert response.name == "test-key"
        assert response.description == "Test API key"
        assert response.enabled is True
        assert response.tags == {"Environment": "test"}
        assert response.id.startswith("mock-api-key-")
        assert response.value.startswith("mock-key-value-")

    def test_get_api_key(self):
        """Test getting an API key with mock client."""
        client = MockApiGatewayClient()

        # Create a key first
        created_key = client.create_api_key(name="test-key", description="Test key")

        # Get the key without value
        retrieved_key = client.get_api_key(created_key.id, include_value=False)
        assert retrieved_key.id == created_key.id
        assert retrieved_key.name == "test-key"
        assert retrieved_key.value is None

        # Get the key with value
        retrieved_key_with_value = client.get_api_key(created_key.id, include_value=True)
        assert retrieved_key_with_value.value is not None

    def test_get_nonexistent_api_key_raises_error(self):
        """Test that getting a non-existent API key raises ClientError."""
        client = MockApiGatewayClient()

        with pytest.raises(Exception) as exc_info:
            client.get_api_key("nonexistent-key")

        assert "NotFoundException" in str(exc_info.value)

    def test_update_api_key(self):
        """Test updating an API key with mock client."""
        client = MockApiGatewayClient()

        # Create a key first
        created_key = client.create_api_key(name="test-key", description="Original description")

        # Update the key
        patch_ops = [
            {"op": "replace", "path": "description", "value": "Updated description"},
            {"op": "replace", "path": "enabled", "value": False},
        ]
        updated_key = client.update_api_key(created_key.id, patch_ops)

        assert updated_key.description == "Updated description"
        assert updated_key.enabled is False

    def test_delete_api_key(self):
        """Test deleting an API key with mock client."""
        client = MockApiGatewayClient()

        # Create a key first
        created_key = client.create_api_key(name="test-key")

        # Delete the key
        client.delete_api_key(created_key.id)

        # Verify it's deleted by trying to get it
        with pytest.raises(Exception) as exc_info:
            client.get_api_key(created_key.id)

        assert "NotFoundException" in str(exc_info.value)

    def test_usage_plan_operations(self):
        """Test usage plan operations with mock client."""
        client = MockApiGatewayClient()

        # Add a mock usage plan
        client.add_mock_usage_plan({"name": "test-plan", "description": "Test usage plan"})

        # Get usage plans
        plans = client.get_usage_plans()
        assert len(plans["items"]) == 1
        assert plans["items"][0]["name"] == "test-plan"

        # Create usage plan key association
        usage_plan_id = plans["items"][0]["id"]
        key_response = client.create_usage_plan_key(usage_plan_id, "test-key-id")
        assert key_response["id"] == "test-key-id"
        assert key_response["type"] == "API_KEY"

        # Delete usage plan key association
        client.delete_usage_plan_key(usage_plan_id, "test-key-id")

        # Verify association is removed (simplified check)
        filtered_plans = client.get_usage_plans(key_id="test-key-id")
        assert len(filtered_plans["items"]) == 0

    def test_get_usage_plans_with_key_filter(self):
        """Test getting usage plans filtered by key ID."""
        client = MockApiGatewayClient()

        # Add mock usage plans
        client.add_mock_usage_plan({"name": "plan-1"})
        client.add_mock_usage_plan({"name": "plan-2"})

        plans = client.get_usage_plans()
        plan1_id = plans["items"][0]["id"]
        plan2_id = plans["items"][1]["id"]

        # Associate key with only one plan
        client.create_usage_plan_key(plan1_id, "test-key")

        # Filter by key
        filtered_plans = client.get_usage_plans(key_id="test-key")
        assert len(filtered_plans["items"]) == 1
        assert filtered_plans["items"][0]["id"] == plan1_id
