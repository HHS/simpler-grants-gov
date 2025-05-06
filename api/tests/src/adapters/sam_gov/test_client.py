"""Tests for the SAM.gov API client."""

import os
import tempfile
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
        # Create a config from environment variables
        config = SamGovConfig()
        client = SamGovClient(config)
        assert client.api_key == "env-api-key"
        assert client.api_url == "https://env-api.sam.gov"

    def test_init_with_custom_config(self, config):
        """Test initializing the client with custom configuration."""
        client = SamGovClient(config)
        assert client.api_key == "test-api-key"
        assert client.api_url == "https://test-api.sam.gov"

    def test_download_extract_success(self, client, config):
        """Test successfully downloading an extract."""
        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            output_path = tmp.name

        try:
            # Sample response for the download
            file_content = b"Mock extract file content"
            file_name = "SAM_PUBLIC_MONTHLY_V2_20220406.ZIP"

            request = SamExtractRequest(file_name=file_name)

            # Mock the API response with API key in query params
            with requests_mock.Mocker() as m:
                m.get(
                    f"{config.base_url}/extracts/v1/file?fileName={file_name}&api_key={config.api_key}",
                    content=file_content,
                    headers={
                        "Content-Type": "application/zip",
                        "Content-Disposition": f'attachment; filename="{file_name}"',
                        "Content-Length": str(len(file_content)),
                    },
                )

                # Call the client method
                response = client.download_extract(request, output_path)

                # Verify the response
                assert response is not None
                assert response.file_name == output_path
                # content_type was removed from the model
                # assert response.content_type == "application/zip"

                # Verify the file was downloaded
                with open(output_path, "rb") as f:
                    assert f.read() == file_content
        finally:
            # Clean up the temporary file
            if os.path.exists(output_path):
                os.unlink(output_path)

    def test_download_extract_not_found(self, client, config):
        """Test extract not found."""
        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            output_path = tmp.name

        try:
            # Create the request
            file_name = "NONEXISTENT_FILE.ZIP"
            request = SamExtractRequest(file_name=file_name)

            # Mock a 404 response from the API
            with requests_mock.Mocker() as m:
                m.get(
                    f"{config.base_url}/extracts/v1/file?fileName={file_name}&api_key={config.api_key}",
                    status_code=404,
                    json={"error": "File not found"},
                )

                # Call the client method, should raise an exception
                with pytest.raises(Exception) as exc_info:
                    client.download_extract(request, output_path)

                # Verify the exception message
                assert "Failed to download extract: 404" in str(exc_info.value)
        finally:
            # Clean up the temporary file
            if os.path.exists(output_path):
                os.unlink(output_path)

    def test_download_extract_http_error(self, client, config):
        """Test handling of HTTP errors."""
        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            output_path = tmp.name

        try:
            # Create the request
            file_name = "ERROR_FILE.ZIP"
            request = SamExtractRequest(file_name=file_name)

            # Mock a 500 error response from the API
            with requests_mock.Mocker() as m:
                m.get(
                    f"{config.base_url}/extracts/v1/file?fileName={file_name}&api_key={config.api_key}",
                    status_code=500,
                    json={"error": "Internal server error"},
                )

                # Call the client method, should raise an exception
                with pytest.raises(Exception) as exc_info:
                    client.download_extract(request, output_path)

                # Verify the exception message
                assert "Failed to download extract: 500" in str(exc_info.value)
        finally:
            # Clean up the temporary file
            if os.path.exists(output_path):
                os.unlink(output_path)

    def test_download_extract_timeout(self, client, config):
        """Test handling of timeout errors."""
        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            output_path = tmp.name

        try:
            # Create the request
            file_name = "TIMEOUT_FILE.ZIP"
            request = SamExtractRequest(file_name=file_name)

            # Mock a timeout by raising a Timeout exception
            with requests_mock.Mocker() as m:
                m.get(
                    f"{config.base_url}/extracts/v1/file?fileName={file_name}&api_key={config.api_key}",
                    exc=Timeout,
                )

                # Call the client method, should raise a Timeout exception
                with pytest.raises(Exception) as exc_info:
                    client.download_extract(request, output_path)

                # Verify the exception message
                assert "Request failed" in str(exc_info.value)
        finally:
            # Clean up the temporary file
            if os.path.exists(output_path):
                os.unlink(output_path)

    def test_api_key_in_query_params(self):
        """Test that the API key is included in the query parameters."""
        config = SamGovConfig(
            base_url="https://test-api.sam.gov",
            api_key="test-api-key",
        )
        client = SamGovClient(config)

        with requests_mock.Mocker() as m:
            m.get(
                "https://test-api.sam.gov/test-endpoint?api_key=test-api-key", json={"status": "ok"}
            )

            # Make a request using the _request method
            client._request("GET", "test-endpoint")

            # Verify the request was made with the API key in the query parameters
            assert m.called
            assert "api_key=test-api-key" in m.last_request.url

            # Verify headers don't include the API key
            assert "x-api-key" not in m.last_request.headers
