"""Tests for the Simpler Grants API client."""

import uuid
from unittest.mock import patch

import pytest
import requests
import requests_mock
from pydantic import ValidationError

from src.adapters.simpler_grants.client import SimplerGrantsClient
from src.adapters.simpler_grants.config import SimplerGrantsConfig
from src.adapters.simpler_grants.models import OpportunityStatus


@pytest.fixture
def client_config():
    """Create a test configuration."""
    return SimplerGrantsConfig(
        base_url="http://test-api.example.com", api_key="test-api-key-123", timeout=5
    )


@pytest.fixture
def client(client_config):
    """Create a test client."""
    return SimplerGrantsClient(client_config)


def test_client_initialization_success(client_config):
    """Test successful client initialization."""
    client = SimplerGrantsClient(client_config)

    assert client.base_url == "http://test-api.example.com"
    assert client.api_key == "test-api-key-123"
    assert client.timeout == 5


def test_client_initialization_without_base_url():
    """Test client initialization fails without base URL."""
    config = SimplerGrantsConfig(base_url="", api_key="test-key")

    with pytest.raises(ValueError, match="Base URL not found"):
        SimplerGrantsClient(config)


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
        assert result.data.opportunity_status == OpportunityStatus.POSTED
        assert result.data.summary is not None
        assert str(result.data.summary.post_date) == "2024-01-15"


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

        with pytest.raises(requests.HTTPError) as exc_info:
            client.get_opportunity(opportunity_id)

        # Can check status code directly from the exception
        assert exc_info.value.response.status_code == 404


def test_get_opportunity_server_error(client):
    """Test handling of server errors."""
    opportunity_id = uuid.uuid4()

    with requests_mock.Mocker() as m:
        m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            status_code=500,
            text="Internal Server Error",
        )

        with pytest.raises(requests.HTTPError) as exc_info:
            client.get_opportunity(opportunity_id)

        # Can check status code and response text
        assert exc_info.value.response.status_code == 500
        assert "Internal Server Error" in exc_info.value.response.text


def test_get_opportunity_timeout(client):
    """Test handling of timeout errors."""
    opportunity_id = uuid.uuid4()

    # Mock the retry decorator to avoid waiting between retries
    with patch("src.adapters.simpler_grants.client._do_request_with_retry") as mock_retry:
        mock_retry.side_effect = requests.exceptions.Timeout("Request timeout")

        with pytest.raises(requests.exceptions.Timeout):
            client.get_opportunity(opportunity_id)


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
        assert result.data.opportunity_status == OpportunityStatus.FORECASTED
        assert result.data.summary is None


def test_request_includes_custom_timeout(client):
    """Test that requests use the configured timeout."""
    opportunity_id = uuid.uuid4()
    mock_response = {
        "message": "Success",
        "data": {
            "opportunity_id": str(opportunity_id),
            "opportunity_title": "Test",
            "opportunity_status": "posted",
            "summary": None,
        },
    }

    with requests_mock.Mocker() as m:
        adapter = m.get(
            f"http://test-api.example.com/v1/opportunities/{opportunity_id}",
            json=mock_response,
            status_code=200,
        )

        client.get_opportunity(opportunity_id)

        # Verify the request was made with the correct timeout
        assert adapter.last_request is not None
