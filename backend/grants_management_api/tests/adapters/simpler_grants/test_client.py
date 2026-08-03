import uuid
from datetime import date
from unittest.mock import patch

import pytest
import requests
import requests_mock
from pydantic import ValidationError
from tenacity import wait_none

from src.adapters.simpler_grants.client import SimplerGrantsClient, SimplerResponseException
from src.adapters.simpler_grants.config import SimplerGrantsConfig
from src.adapters.simpler_grants.models import SimplerOpportunityStatus


@pytest.fixture
def client_config():
    """Create a test configuration."""
    return SimplerGrantsConfig(
        SIMPLER_GRANTS_API_BASE_URL="http://test-api.example.com",
        SIMPLER_GRANTS_API_KEY="test-api-key-123",
        SIMPLER_GRANTS_API_TIMEOUT=5,
    )


@pytest.fixture
def client(client_config):
    """Create a test client."""
    return SimplerGrantsClient(client_config)


def test_client_initialization_success(client_config):
    """Test successful client initialization."""
    client = SimplerGrantsClient(client_config)

    assert client.config.base_url == "http://test-api.example.com"
    assert client.config.api_key == "test-api-key-123"
    assert client.config.timeout == 5


def test_get_opportunity_success(client):
    """Test successful opportunity retrieval."""
    opportunity_id = uuid.uuid4()
    mock_response = {
        "message": "Success",
        "data": {
            "opportunity_id": str(opportunity_id),
            "opportunity_title": "Test Opportunity",
            "opportunity_status": "posted",
            "summary": {"post_date": "2024-01-15"},
        },
    }

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            json=mock_response,
            status_code=200,
        )

        result = client.get_opportunity(opportunity_id)

        assert result.message == "Success"
        assert result.data.opportunity_id == opportunity_id
        assert result.data.opportunity_title == "Test Opportunity"
        assert result.data.opportunity_status == SimplerOpportunityStatus.POSTED
        assert result.data.summary is not None
        assert result.data.summary.post_date == date(2024, 1, 15)


def test_get_opportunity_not_found(client):
    """Test opportunity not found error."""
    opportunity_id = uuid.uuid4()
    mock_response = {"message": "Opportunity not found"}

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            json=mock_response,
            status_code=404,
        )

        with pytest.raises(SimplerResponseException) as exc_info:
            client.get_opportunity(opportunity_id)

        # Verify the parsed error response
        error = exc_info.value.simpler_response_error
        assert error.status_code == 404
        assert error.message == "Opportunity not found"
        assert error.errors is None


def test_get_opportunity_server_error(client):
    """Test handling of server errors."""
    opportunity_id = uuid.uuid4()

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            status_code=500,
            text="Internal Server Error",
        )

        with pytest.raises(SimplerResponseException) as exc_info:
            client.get_opportunity(opportunity_id)

        # Verify the parsed error response (non-JSON response)
        error = exc_info.value.simpler_response_error
        assert error.status_code == 500
        assert error.message == "Internal Server Error"
        assert error.errors is None


def test_get_opportunity_with_validation_errors(client):
    """Test error response with validation errors."""
    opportunity_id = uuid.uuid4()
    mock_response = {
        "message": "Validation failed",
        "status_code": 422,
        "errors": [
            {
                "type": "invalid_field",
                "message": "Field is required",
                "field": "opportunity_title",
                "value": None,
            },
            {
                "type": "invalid_format",
                "message": "Invalid date format",
                "field": "summary.post_date",
                "value": "not-a-date",
            },
        ],
    }

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            json=mock_response,
            status_code=422,
        )

        with pytest.raises(SimplerResponseException) as exc_info:
            client.get_opportunity(opportunity_id)

        # Verify the parsed error response with validation errors
        error = exc_info.value.simpler_response_error
        assert error.status_code == 422
        assert error.message == "Validation failed"
        assert error.errors is not None
        assert len(error.errors) == 2
        assert error.errors[0].type == "invalid_field"
        assert error.errors[0].message == "Field is required"
        assert error.errors[0].field == "opportunity_title"
        assert error.errors[1].type == "invalid_format"
        assert error.errors[1].field == "summary.post_date"


def test_get_opportunity_timeout(client):
    """Test handling of timeout errors."""
    opportunity_id = uuid.uuid4()

    # Mock the retry decorator to avoid waiting between retries
    with patch("src.adapters.simpler_grants.client._do_request_with_retry") as mock_retry:
        mock_retry.side_effect = requests.exceptions.Timeout("Request timeout")

        with pytest.raises(requests.exceptions.Timeout):
            client.get_opportunity(opportunity_id)


def test_get_opportunity_retries_on_timeout(client):
    """Test that the client retries 3 times on timeout before failing."""
    opportunity_id = uuid.uuid4()

    # Patch the retry decorator to not wait between attempts (makes test fast)
    with patch("src.adapters.simpler_grants.client._do_request_with_retry.retry.wait", wait_none()):
        # Mock requests.request to fail twice with timeout, then succeed
        with patch("src.adapters.simpler_grants.client.requests.request") as mock_request:
            # Create a successful response for the third attempt
            mock_response = requests.Response()
            mock_response.status_code = 200
            mock_response._content = str.encode(
                '{"message": "Success", "data": {"opportunity_id": "'
                + str(opportunity_id)
                + '", "opportunity_title": "Test", "opportunity_status": "posted", "summary": null}}'
            )

            # First two calls raise Timeout, third call succeeds
            mock_request.side_effect = [
                requests.exceptions.Timeout("Timeout 1"),
                requests.exceptions.Timeout("Timeout 2"),
                mock_response,
            ]

            # Should succeed after retries
            result = client.get_opportunity(opportunity_id)

            # Verify it was called 3 times (2 failures + 1 success)
            assert mock_request.call_count == 3
            assert result.data.opportunity_id == opportunity_id


def test_get_opportunity_retries_exhausted(client):
    """Test that the client raises timeout after exhausting all 3 retry attempts."""
    opportunity_id = uuid.uuid4()

    # Patch the retry decorator to not wait between attempts (makes test fast)
    with patch("src.adapters.simpler_grants.client._do_request_with_retry.retry.wait", wait_none()):
        # Mock requests.request to always fail with timeout
        with patch("src.adapters.simpler_grants.client.requests.request") as mock_request:
            mock_request.side_effect = requests.exceptions.Timeout("Persistent timeout")

            # Should raise after 3 attempts
            with pytest.raises(requests.exceptions.Timeout):
                client.get_opportunity(opportunity_id)

            # Verify it tried 3 times
            assert mock_request.call_count == 3


def test_get_opportunity_retries_on_connection_error(client):
    """Test that the client retries 3 times on connection error before failing."""
    opportunity_id = uuid.uuid4()

    # Patch the retry decorator to not wait between attempts (makes test fast)
    with patch("src.adapters.simpler_grants.client._do_request_with_retry.retry.wait", wait_none()):
        # Mock requests.request to fail once with connection error, then succeed
        with patch("src.adapters.simpler_grants.client.requests.request") as mock_request:
            # Create a successful response for the second attempt
            mock_response = requests.Response()
            mock_response.status_code = 200
            mock_response._content = str.encode(
                '{"message": "Success", "data": {"opportunity_id": "'
                + str(opportunity_id)
                + '", "opportunity_title": "Test", "opportunity_status": "posted", "summary": null}}'
            )

            # First call raises ConnectionError, second call succeeds
            mock_request.side_effect = [
                requests.exceptions.ConnectionError("Connection failed"),
                mock_response,
            ]

            # Should succeed after retry
            result = client.get_opportunity(opportunity_id)

            # Verify it was called 2 times (1 failure + 1 success)
            assert mock_request.call_count == 2
            assert result.data.opportunity_id == opportunity_id


def test_get_opportunity_invalid_json_response(client):
    """Test handling of invalid JSON responses."""
    opportunity_id = uuid.uuid4()

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            text="Not valid JSON",
            status_code=200,
        )

        with pytest.raises(ValidationError):
            client.get_opportunity(opportunity_id)


def test_get_opportunity_minimal_response(client):
    """Test opportunity with minimal fields."""
    opportunity_id = uuid.uuid4()
    mock_response = {
        "message": "Success",
        "data": {
            "opportunity_id": str(opportunity_id),
            "opportunity_title": None,
            "opportunity_status": "forecasted",
            "summary": None,
        },
    }

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            json=mock_response,
            status_code=200,
        )

        result = client.get_opportunity(opportunity_id)

        assert result.data.opportunity_id == opportunity_id
        assert result.data.opportunity_title is None
        assert result.data.opportunity_status == SimplerOpportunityStatus.FORECASTED
        assert result.data.summary is None


def test_request_includes_custom_timeout():
    """Test that requests use the configured timeout."""
    # Use a different timeout value to prove it's reading from config
    custom_timeout = 15
    config = SimplerGrantsConfig(
        SIMPLER_GRANTS_API_BASE_URL="http://test-api.example.com",
        SIMPLER_GRANTS_API_KEY="test-api-key-123",
        SIMPLER_GRANTS_API_TIMEOUT=custom_timeout,
    )
    client = SimplerGrantsClient(config)
    opportunity_id = uuid.uuid4()

    # Mock at the requests.request level to verify timeout is passed
    with patch("src.adapters.simpler_grants.client.requests.request") as mock_request:
        # Create a mock response object
        mock_response_obj = requests.Response()
        mock_response_obj.status_code = 200
        mock_response_obj._content = str.encode(
            '{"message": "Success", "data": {"opportunity_id": "'
            + str(opportunity_id)
            + '", "opportunity_title": "Test", "opportunity_status": "posted", "summary": null}}'
        )
        mock_request.return_value = mock_response_obj

        client.get_opportunity(opportunity_id)

        # Verify timeout from config was actually passed to requests.request
        mock_request.assert_called_once()
        call_kwargs = mock_request.call_args.kwargs
        assert call_kwargs["timeout"] == custom_timeout
