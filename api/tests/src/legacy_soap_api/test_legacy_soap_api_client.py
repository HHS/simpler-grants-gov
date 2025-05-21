import pytest

from src.legacy_soap_api.legacy_soap_api_client import BaseSOAPClient
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest


class TestSOAPClient:
    @pytest.fixture(scope="class")
    def base_soap_client(self):
        return BaseSOAPClient(
            SOAPRequest(
                method="POST",
                headers={},
                data=b"",
                full_path="/",
            )
        )

    def test_can_instantiate(self, base_soap_client) -> None:
        assert isinstance(base_soap_client, BaseSOAPClient)
