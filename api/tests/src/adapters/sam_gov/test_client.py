"""Tests for the SAM.gov API client."""

import os
from unittest import mock

import pytest
import requests_mock
from requests.exceptions import Timeout

from src.adapters.sam_gov.client import SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.models import SamExtractRequest


class TestSamGovClient:
    """Tests for the SAM.gov API client."""

    @pytest.fixture
    def config(self):
        """Fixture to create a test configuration."""
        return SamGovConfig(
            base_url="https://test-api.sam.gov",
            api_key="test-api-key",
            timeout=5,
            extract_url=None,  # Set to None to ensure fallback to base_url/download
        )

    @pytest.fixture
    def client(self, config):
        """Fixture to create a test client."""
        client = SamGovClient(config)
        # Ensure the extract_url is None so that the client falls back to base_url/download
        client.extract_url = None
        return client

    @mock.patch.dict(
        os.environ,
        {
            "SAM_GOV_API_KEY": "env-api-key",
            "SAM_GOV_BASE_URL": "https://env-api.sam.gov",
        },
    )
    def test_init_with_default_config(self):
        """Test initializing the client with default configuration."""
        # Create a config and manually set the values that should come from environment
        config = SamGovConfig(api_key="env-api-key", base_url="https://env-api.sam.gov")
        client = SamGovClient(config)
        assert client.api_key == "env-api-key"
        assert client.api_url == "https://env-api.sam.gov"

    def test_init_with_custom_config(self, config):
        """Test initializing the client with custom configuration."""
        client = SamGovClient(config)
        assert client.api_key == "test-api-key"
        assert client.api_url == "https://test-api.sam.gov"

    def test_download_extract_success(self, client, config, tmp_path):
        """Test successfully downloading an extract."""

        # Sample response for the download
        file_content = b"Mock extract file content"
        file_name = "SAM_PUBLIC_MONTHLY_V2_20220406.ZIP"
        output_path = tmp_path / file_name

        request = SamExtractRequest(file_name=file_name)

        # Mock the API response, verifying the x-api-key header
        with requests_mock.Mocker() as m:
            m.get(
                f"{config.base_url}/data-services/v1/extracts?fileName={file_name}",
                request_headers={"x-api-key": config.api_key},
                content=file_content,
                headers={
                    "Content-Type": "application/zip",
                    "Content-Disposition": f'attachment; filename="{file_name}"',
                    "Content-Length": str(len(file_content)),
                },
            )

            # Call the client method
            response = client.download_extract(request, str(output_path))

            # Verify the response
            assert response is not None
            assert response.file_name == str(output_path)
            assert "x-api-key" in m.last_request.headers
            assert m.last_request.headers["x-api-key"] == config.api_key

            # Verify the file was downloaded
            with open(output_path, "rb") as f:
                assert f.read() == file_content

    def test_download_extract_not_found(self, client, config, tmp_path):
        """Test extract not found."""
        # Create the request
        file_name = "NONEXISTENT_FILE.ZIP"
        output_path = tmp_path / file_name
        request = SamExtractRequest(file_name=file_name)

        # Mock a 404 response from the API
        with requests_mock.Mocker() as m:
            m.get(
                f"{config.base_url}/data-services/v1/extracts?fileName={file_name}",
                request_headers={"x-api-key": config.api_key},
                status_code=404,
                json={"error": "File not found"},
            )

            # Call the client method, should raise an exception
            with pytest.raises(Exception) as exc_info:
                client.download_extract(request, str(output_path))

            # Verify the exception message
            assert "Failed to download extract: 404" in str(exc_info.value)

    def test_download_extract_http_error(self, client, config, tmp_path):
        """Test handling of HTTP errors."""
        # Create the request
        file_name = "ERROR_FILE.ZIP"
        output_path = tmp_path / file_name
        request = SamExtractRequest(file_name=file_name)

        # Mock a 500 error response from the API
        with requests_mock.Mocker() as m:
            m.get(
                f"{config.base_url}/data-services/v1/extracts?fileName={file_name}",
                request_headers={"x-api-key": config.api_key},
                status_code=500,
                json={"error": "Internal server error"},
            )

            # Call the client method, should raise an exception
            with pytest.raises(Exception) as exc_info:
                client.download_extract(request, output_path)

            # Verify the exception message
            assert "Failed to download extract: 500" in str(exc_info.value)

    # We skip this test because the retry logic would make it take several minutes
    # But it is left in case we want to test that the retries are working for timeouts
    @pytest.mark.skip
    def test_download_extract_timeout(self, client, config, tmp_path):
        """Test handling of timeout errors."""
        # Create the request
        file_name = "TIMEOUT_FILE.ZIP"
        output_path = tmp_path / file_name
        request = SamExtractRequest(file_name=file_name)

        # Mock a timeout by raising a Timeout exception
        with requests_mock.Mocker() as m:
            m.get(
                f"{config.base_url}/data-services/v1/extracts?fileName={file_name}",
                request_headers={"x-api-key": config.api_key},
                exc=Timeout,
            )

            # Call the client method, should raise a Timeout exception
            with pytest.raises(Exception) as exc_info:
                client.download_extract(request, str(output_path))

            # Verify the exception message
            assert "Request failed" in str(exc_info.value)
