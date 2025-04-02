import pytest

from src.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient


class TestSOAPClient:
    @pytest.fixture(scope="class")
    def legacy_soap_client(self):
        return LegacySOAPClient()

    def test_can_instantiate(self, legacy_soap_client) -> None:
        assert isinstance(legacy_soap_client, LegacySOAPClient)
