"""Tests for the SAM.gov client factory."""

from unittest import mock

from src.adapters.sam_gov.client import SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.factory import create_sam_gov_client
from src.adapters.sam_gov.mock_client import MockSamGovClient


class TestSamGovClientFactory:
    """Tests for the SAM.gov client factory."""

    def test_create_real_client(self, monkeypatch):
        """Test creating a real client."""
        monkeypatch.setenv("SAM_GOV_USE_MOCK", "false")

        # Create config directly instead of relying on environment variables
        config = SamGovConfig(
            api_key="test-api-key", base_url="https://test-api.sam.gov", use_mock=False
        )
        client = create_sam_gov_client(config=config)
        assert isinstance(client, SamGovClient)
        assert not isinstance(client, MockSamGovClient)

    def test_create_mock_client(self, monkeypatch):
        """Test creating a mock client."""
        monkeypatch.setenv("SAM_GOV_USE_MOCK", "true")
        # Create config directly instead of relying on environment variables
        config = SamGovConfig()
        client = create_sam_gov_client(config=config)
        assert isinstance(client, MockSamGovClient)

    def test_create_client_with_config(self, monkeypatch):
        """Test creating a client with custom config."""
        monkeypatch.setenv("SAM_GOV_USE_MOCK", "false")
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://custom-api.sam.gov")
        monkeypatch.setenv("SAM_GOV_API_KEY", "custom-key")

        config = SamGovConfig()
        client = create_sam_gov_client(config=config)
        assert isinstance(client, SamGovClient)
        assert client.api_url == "https://custom-api.sam.gov"
        assert client.api_key == "custom-key"

    def test_create_mock_client_with_mock_params(self, monkeypatch):
        """Test creating a mock client with custom mock parameters."""
        # We need to patch the MockSamGovClient.__init__ method to avoid actually trying to read the file
        monkeypatch.setenv("SAM_GOV_USE_MOCK", "true")
        monkeypatch.setenv("SAM_GOV_MOCK_DATA_FILE", "/path/to/data.json")
        monkeypatch.setenv("SAM_GOV_MOCK_EXTRACT_DIR", "/path/to/extracts")

        with mock.patch(
            "src.adapters.sam_gov.mock_client.MockSamGovClient.__init__", return_value=None
        ) as mock_init:
            config = SamGovConfig(
                use_mock=True,
                mock_data_file="/path/to/data.json",
                mock_extract_dir="/path/to/extracts",
            )
            create_sam_gov_client(config=config)

            # Assert that the factory tried to create a MockSamGovClient with the correct parameters
            mock_init.assert_called_once_with(
                mock_data_file="/path/to/data.json", mock_extract_dir="/path/to/extracts"
            )
