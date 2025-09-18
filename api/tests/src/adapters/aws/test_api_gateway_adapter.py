from unittest.mock import Mock, patch

import pytest

from src.adapters.aws.api_gateway_adapter import (
    ApiGatewayConfig,
    ApiKeyImportResponse,
    _clear_mock_import_responses,
    _get_mock_import_responses,
    get_boto_api_gateway_client,
    import_api_key,
)


class TestApiGatewayConfig:
    """Test the configuration class for API Gateway."""

    def test_config_defaults(self, monkeypatch):
        """Test that configuration requires default_usage_plan_id to be set."""
        from pydantic import ValidationError

        # Clear any existing environment variable
        monkeypatch.delenv("API_GATEWAY_DEFAULT_USAGE_PLAN_ID", raising=False)

        # Should raise a ValidationError when required field is missing
        with pytest.raises(ValidationError):
            ApiGatewayConfig()

    def test_config_from_environment(self, monkeypatch):
        """Test that configuration can be loaded from environment variables."""
        monkeypatch.setenv("API_GATEWAY_DEFAULT_USAGE_PLAN_ID", "test-plan-123")
        config = ApiGatewayConfig()

        assert config.default_usage_plan_id == "test-plan-123"


class TestGetBotoApiGatewayClient:
    """Test the boto3 client factory function."""

    @patch("src.adapters.aws.api_gateway_adapter.get_boto_session")
    def test_uses_default_session(self, mock_get_session):
        """Test that default session is used when none provided."""
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        get_boto_api_gateway_client()

        mock_get_session.assert_called_once()
        mock_session.client.assert_called_once_with("apigateway")

    def test_uses_provided_session(self):
        """Test that provided session is used."""
        mock_session = Mock()

        get_boto_api_gateway_client(session=mock_session)

        mock_session.client.assert_called_once_with("apigateway")


class TestImportApiKeyFunction:
    """Test the main import_api_key function."""

    def setup_method(self):
        """Clear mock responses before each test."""
        _clear_mock_import_responses()

    @patch("src.adapters.aws.api_gateway_adapter.is_local_aws")
    def test_local_mock_import(self, mock_is_local):
        """Test that mock response is returned when running locally."""
        mock_is_local.return_value = True

        response = import_api_key(
            api_key="test-key-12345",
            name="Test API Key",
            description="Test description",
            enabled=True,
            usage_plan_id="test-plan-123",
        )

        # Verify the response structure
        assert response.name == "Test API Key"
        assert response.description == "Test description"
        assert response.enabled is True
        assert response.id.startswith("mock-")
        assert response.stage_keys == []
        assert response.tags == {}

        # Verify the mock response was stored
        mock_responses = _get_mock_import_responses()
        assert len(mock_responses) == 1

        request_data, response_data = mock_responses[0]
        assert request_data["api_key"] == "test-key-12345"
        assert request_data["name"] == "Test API Key"
        assert request_data["description"] == "Test description"
        assert request_data["enabled"] is True
        assert request_data["usage_plan_id"] == "test-plan-123"

    @patch("src.adapters.aws.api_gateway_adapter.is_local_aws")
    @patch("src.adapters.aws.api_gateway_adapter.get_boto_api_gateway_client")
    def test_real_aws_import_success(self, mock_get_client, mock_is_local):
        """Test successful API key import with real AWS client."""
        mock_is_local.return_value = False

        # Mock the boto3 client responses
        mock_boto_client = Mock()
        mock_get_client.return_value = mock_boto_client

        # Mock the import_api_keys response
        mock_boto_client.import_api_keys.return_value = {"ids": ["api-key-123"], "warnings": []}

        # Mock the get_api_key response
        mock_boto_client.get_api_key.return_value = {
            "id": "api-key-123",
            "name": "Test API Key",
            "description": "Test description",
            "enabled": True,
            "stageKeys": [],
            "tags": {},
        }

        response = import_api_key(
            api_key="test-key-12345",
            name="Test API Key",
            description="Test description",
            enabled=True,
        )

        # Verify the boto3 calls were made correctly
        expected_csv = "name,key,description,enabled,usageplanIds\nTest API Key,test-key-12345,Test description,true,"
        mock_boto_client.import_api_keys.assert_called_once_with(
            body=expected_csv.encode("utf-8"),
            format="csv",
            failOnWarnings=True,
        )
        mock_boto_client.get_api_key.assert_called_once_with(
            apiKey="api-key-123", includeValue=False
        )

        # Verify the response
        assert response.id == "api-key-123"
        assert response.name == "Test API Key"
        assert response.description == "Test description"
        assert response.enabled is True

    @patch("src.adapters.aws.api_gateway_adapter.is_local_aws")
    @patch("src.adapters.aws.api_gateway_adapter.get_boto_api_gateway_client")
    def test_real_aws_import_with_usage_plan(self, mock_get_client, mock_is_local):
        """Test API key import with usage plan association via CSV format."""
        mock_is_local.return_value = False

        mock_boto_client = Mock()
        mock_get_client.return_value = mock_boto_client

        # Mock responses
        mock_boto_client.import_api_keys.return_value = {"ids": ["api-key-123"], "warnings": []}

        mock_boto_client.get_api_key.return_value = {
            "id": "api-key-123",
            "name": "Test API Key",
            "description": "Test description",
            "enabled": True,
            "stageKeys": [],
            "tags": {},
        }

        response = import_api_key(
            api_key="test-key-12345",
            name="Test API Key",
            description="Test description",
            enabled=True,
            usage_plan_id="test-plan-123",
        )

        # Verify the CSV format includes the usage plan ID
        expected_csv = 'name,key,description,enabled,usageplanIds\nTest API Key,test-key-12345,Test description,true,"test-plan-123"'
        mock_boto_client.import_api_keys.assert_called_once_with(
            body=expected_csv.encode("utf-8"),
            format="csv",
            failOnWarnings=True,
        )

        # Verify no separate usage plan association call is made
        mock_boto_client.create_usage_plan_key.assert_not_called()

        assert response.id == "api-key-123"

    @patch("src.adapters.aws.api_gateway_adapter.is_local_aws")
    @patch("src.adapters.aws.api_gateway_adapter.get_boto_api_gateway_client")
    def test_real_aws_import_with_warnings(self, mock_get_client, mock_is_local, caplog):
        """Test API key import that generates warnings."""
        mock_is_local.return_value = False

        mock_boto_client = Mock()
        mock_get_client.return_value = mock_boto_client

        # Mock response with warnings
        mock_boto_client.import_api_keys.return_value = {
            "ids": ["api-key-123"],
            "warnings": ["Key already exists"],
        }

        mock_boto_client.get_api_key.return_value = {
            "id": "api-key-123",
            "name": "Test API Key",
            "description": None,
            "enabled": True,
            "stageKeys": [],
            "tags": {},
        }

        response = import_api_key(api_key="test-key-12345", name="Test API Key", enabled=True)

        # Verify warning was logged
        assert "API Gateway import warnings" in caplog.text
        # Verify warning details are in the log records
        warning_records = [
            record for record in caplog.records if "API Gateway import warnings" in record.message
        ]
        assert len(warning_records) > 0
        assert hasattr(warning_records[0], "warnings")
        assert "Key already exists" in warning_records[0].warnings

        assert response.id == "api-key-123"

    @patch("src.adapters.aws.api_gateway_adapter.is_local_aws")
    @patch("src.adapters.aws.api_gateway_adapter.get_boto_api_gateway_client")
    def test_real_aws_import_no_key_ids_returned(self, mock_get_client, mock_is_local):
        """Test error handling when no key IDs are returned."""
        mock_is_local.return_value = False

        mock_boto_client = Mock()
        mock_get_client.return_value = mock_boto_client

        # Mock response with no IDs
        mock_boto_client.import_api_keys.return_value = {"ids": [], "warnings": []}

        with pytest.raises(Exception, match="No API key IDs returned from import operation"):
            import_api_key(api_key="test-key-12345", name="Test API Key", enabled=True)

    def test_csv_format_generation(self):
        """Test that CSV format is generated correctly for different inputs."""
        # Test with all fields
        with patch("src.adapters.aws.api_gateway_adapter.is_local_aws", return_value=True):
            import_api_key(
                api_key="test-key-123",
                name="My API Key",
                description="Key description",
                enabled=True,
            )

            responses = _get_mock_import_responses()
            assert len(responses) == 1

        # Test with no description
        _clear_mock_import_responses()
        with patch("src.adapters.aws.api_gateway_adapter.is_local_aws", return_value=True):
            import_api_key(
                api_key="test-key-456", name="Another Key", description=None, enabled=False
            )

            responses = _get_mock_import_responses()
            assert len(responses) == 1
            request_data, _ = responses[0]
            assert request_data["description"] is None
            assert request_data["enabled"] is False


class TestMockResponseHelpers:
    """Test the mock response helper functions."""

    def setup_method(self):
        """Clear mock responses before each test."""
        _clear_mock_import_responses()

    def test_clear_mock_responses(self):
        """Test that mock responses can be cleared."""
        # Add some mock responses
        with patch("src.adapters.aws.api_gateway_adapter.is_local_aws", return_value=True):
            import_api_key("key1", "name1")
            import_api_key("key2", "name2")

        assert len(_get_mock_import_responses()) == 2

        _clear_mock_import_responses()

        assert len(_get_mock_import_responses()) == 0

    def test_get_mock_responses(self):
        """Test that mock responses can be retrieved."""
        _clear_mock_import_responses()

        with patch("src.adapters.aws.api_gateway_adapter.is_local_aws", return_value=True):
            import_api_key("test-key", "Test Name", "Test Description")

        responses = _get_mock_import_responses()
        assert len(responses) == 1

        request_data, response_data = responses[0]
        assert request_data["api_key"] == "test-key"
        assert request_data["name"] == "Test Name"
        assert request_data["description"] == "Test Description"
        assert isinstance(response_data, ApiKeyImportResponse)
        assert response_data.name == "Test Name"
