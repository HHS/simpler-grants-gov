"""Tests for the SAM.gov client factory."""

from src.adapters.sam_gov.client import SamGovClient
from src.adapters.sam_gov.factory import create_sam_gov_client
from src.adapters.sam_gov.mock_client import MockSamGovClient


class TestSamGovClientFactory:
    """Tests for the SAM.gov client factory."""

    def test_create_real_client(self, monkeypatch):
        """Test creating a real client."""
        monkeypatch.setenv("SAM_GOV_EXTRACTS_USE_MOCK_CLIENT", "false")
        monkeypatch.setenv("SAM_GOV_API_KEY", "test-api-key")
        monkeypatch.setenv("SAM_GOV_BASE_URL", "https://test-api.sam.gov")
        client = create_sam_gov_client()
        assert isinstance(client, SamGovClient)
        assert not isinstance(client, MockSamGovClient)
        assert client.api_key == "test-api-key"
        assert client.api_url == "https://test-api.sam.gov"

    def test_create_mock_client(self, monkeypatch):
        """Test creating a mock client."""
        monkeypatch.setenv("SAM_GOV_EXTRACTS_USE_MOCK_CLIENT", "true")
        # Ensure other conflicting env vars are unset or set to something that won't cause issues
        monkeypatch.delenv("SAM_GOV_API_KEY", raising=False)
        monkeypatch.delenv("SAM_GOV_BASE_URL", raising=False)
        client = create_sam_gov_client()
        assert isinstance(client, MockSamGovClient)
