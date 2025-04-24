"""Tests for the SAM.gov API client."""

import os
from unittest import mock

import pytest
import requests_mock
from requests.exceptions import HTTPError, Timeout

from src.adapters.sam_gov.client import SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.models import EntityStatus, EntityType, SamEntityRequest


class TestSamGovClient:
    """Tests for the SAM.gov API client."""

    @pytest.fixture
    def config(self):
        """Fixture to create a test configuration."""
        return SamGovConfig(
            base_url="https://test-api.sam.gov",
            api_key="test-api-key",
            timeout=5,
        )

    @pytest.fixture
    def client(self, config):
        """Fixture to create a test client."""
        return SamGovClient(
            api_key=config.api_key,
            api_url=config.base_url,
            extract_url="https://test-api.sam.gov/extracts",
        )

    @mock.patch.dict(
        os.environ,
        {
            "SAM_GOV_API_KEY": "env-api-key",
            "SAM_GOV_API_URL": "https://env-api.sam.gov",
            "SAM_GOV_EXTRACT_URL": "https://env-api.sam.gov/extracts",
        },
    )
    def test_init_with_default_config(self):
        """Test initializing the client with default configuration."""
        # This will use the environment variables
        client = SamGovClient()
        assert client.api_key == "env-api-key"
        assert client.api_url == "https://env-api.sam.gov"
        assert client.extract_url == "https://env-api.sam.gov/extracts"

    def test_init_with_custom_config(self, config):
        """Test initializing the client with custom configuration."""
        client = SamGovClient(config)
        assert client.api_key == "test-api-key"
        assert client.api_url == "https://test-api.sam.gov"
        # extract_url should be provided or it will use the environment variable
        assert client.extract_url is not None

    def test_get_entity_success(self, client, config):
        """Test successfully retrieving an entity."""
        uei = "ABCDEFGHIJK1"

        # Sample response that the API would return
        entity_data = {
            "uei": uei,
            "legal_business_name": "Test Corporation",
            "physical_address": {
                "address_line_1": "123 Main St",
                "city": "Anytown",
                "state_or_province": "MD",
                "zip_code": "20002",
                "country": "UNITED STATES",
            },
            "entity_status": "ACTIVE",
            "entity_type": "BUSINESS",
            "created_date": "2023-01-01T00:00:00+00:00",
            "last_updated_date": "2023-01-01T00:00:00+00:00",
        }

        # Mock the API response
        with requests_mock.Mocker() as m:
            m.get(f"{config.base_url}/entity/{uei}", json=entity_data)

            # Call the client method
            response = client.get_entity(SamEntityRequest(uei=uei))

            # Verify the response
            assert response is not None
            assert response.uei == uei
            assert response.legal_business_name == "Test Corporation"
            assert response.entity_status == EntityStatus.ACTIVE
            assert response.entity_type == EntityType.BUSINESS

    def test_get_entity_not_found(self, client, config):
        """Test entity not found."""
        uei = "NONEXISTENT1"

        # Mock a 404 response from the API
        with requests_mock.Mocker() as m:
            m.get(f"{config.base_url}/entity/{uei}", status_code=404)

            # Call the client method, should return None for 404
            response = client.get_entity(SamEntityRequest(uei=uei))

            # Verify the response is None for a 404
            assert response is None

    def test_get_entity_http_error(self, client, config):
        """Test handling of HTTP errors."""
        uei = "ERROR500"

        # Mock a 500 error response from the API
        with requests_mock.Mocker() as m:
            m.get(f"{config.base_url}/entity/{uei}", status_code=500)

            # Call the client method, should raise an HTTPError
            with pytest.raises(HTTPError):
                client.get_entity(SamEntityRequest(uei=uei))

    def test_get_entity_timeout(self, client, config):
        """Test handling of timeout errors."""
        uei = "TIMEOUT1"

        # Mock a timeout by raising a Timeout exception
        with requests_mock.Mocker() as m:
            m.get(f"{config.base_url}/entity/{uei}", exc=Timeout)

            # Call the client method, should raise a Timeout exception
            with pytest.raises(Timeout):
                client.get_entity(SamEntityRequest(uei=uei))

    def test_api_key_in_headers(self):
        """Test that the API key is included in request headers."""
        client = SamGovClient(
            api_key="test-api-key",
            api_url="https://test-api.sam.gov",
            extract_url="https://test-api.sam.gov/extracts",
        )
        headers = client._build_headers()
        assert headers.get("x-api-key") == "test-api-key"

        # Test with no API key should raise ValueError
        with pytest.raises(ValueError):
            SamGovClient(
                api_key=None,
                api_url="https://test-api.sam.gov",
                extract_url="https://test-api.sam.gov/extracts",
            )
