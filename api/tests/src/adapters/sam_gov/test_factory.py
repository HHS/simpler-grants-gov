"""Tests for the SAM.gov client factory."""

from unittest import mock

from src.adapters.sam_gov.client import SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.factory import create_sam_gov_client
from src.adapters.sam_gov.mock_client import MockSamGovClient


class TestSamGovClientFactory:
    """Tests for the SAM.gov client factory."""

    def test_create_real_client(self):
        """Test creating a real client."""
        # Create config directly instead of relying on environment variables
        config = SamGovConfig(
            api_key="test-api-key", base_url="https://test-api.sam.gov", use_mock=False
        )
        client = create_sam_gov_client(config=config)
        assert isinstance(client, SamGovClient)
        assert not isinstance(client, MockSamGovClient)

    def test_create_mock_client(self):
        """Test creating a mock client."""
        # Create config directly instead of relying on environment variables
        config = SamGovConfig(
            api_key="test-api-key",  # Need to provide api_key even for mock client
            base_url="https://test-api.sam.gov",
            use_mock=True,
        )
        client = create_sam_gov_client(config=config)
        assert isinstance(client, MockSamGovClient)

    def test_create_client_with_config(self):
        """Test creating a client with custom config."""
        config = SamGovConfig(
            base_url="https://custom-api.sam.gov", api_key="custom-key", use_mock=False
        )
        client = create_sam_gov_client(config=config)
        assert isinstance(client, SamGovClient)
        assert client.api_url == "https://custom-api.sam.gov"
        assert client.api_key == "custom-key"

    def test_create_client_with_config_and_override(self):
        """Test creating a client with config and override values."""
        config = SamGovConfig(
            base_url="https://custom-api.sam.gov", api_key="custom-key", use_mock=False
        )
        client = create_sam_gov_client(config=config, config_override={"api_key": "override-key"})
        assert isinstance(client, SamGovClient)
        assert client.api_url == "https://custom-api.sam.gov"
        assert client.api_key == "override-key"

    def test_create_mock_client_with_mock_params(self):
        """Test creating a mock client with custom mock parameters."""
        # We need to patch the MockSamGovClient.__init__ method to avoid actually trying to read the file
        with mock.patch(
            "src.adapters.sam_gov.mock_client.MockSamGovClient.__init__", return_value=None
        ):
            config = SamGovConfig(
                use_mock=True,
                mock_data_file="/path/to/data.json",
                mock_extract_dir="/path/to/extracts",
            )
            create_sam_gov_client(config=config)

            # Since we mocked the __init__ method, we'll manually assert that the factory tried to create
            # a MockSamGovClient with the correct parameters
            from src.adapters.sam_gov.mock_client import MockSamGovClient

            MockSamGovClient.__init__.assert_called_once_with(
                mock_data_file="/path/to/data.json", mock_extract_dir="/path/to/extracts"
            )
