from unittest.mock import patch

import pytest

from src.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient


class TestSOAPClient:
    @pytest.fixture(scope="class")
    def legacy_soap_client(self):
        return LegacySOAPClient()

    def test_can_instantiate(self, legacy_soap_client) -> None:
        assert isinstance(legacy_soap_client, LegacySOAPClient)

    def test_cert_included_in_proxy_request(self, legacy_soap_client):
        with patch("requests.request") as mock_method:
            legacy_soap_client.proxy_request(
                method="POST",
                full_path="/full/path",
                headers={"X-Amzn-Mtls-Clientcert": "cert.pem"},
                body=b"data",
            )
            mock_method.assert_called_once_with(
                "POST",
                f"{legacy_soap_client.config.grants_gov_uri}/full/path",
                data=b"data",
                headers={"X-Amzn-Mtls-Clientcert": "cert.pem"},
                cert="cert.pem",
            )

    def test_cert_not_included_in_proxy_request(self, legacy_soap_client):
        with patch("requests.request") as mock_method:
            legacy_soap_client.proxy_request(
                method="POST",
                full_path="/full/path",
                headers={},
                body=b"data",
            )
            mock_method.assert_called_once_with(
                "POST",
                f"{legacy_soap_client.config.grants_gov_uri}/full/path",
                data=b"data",
                headers={},
                cert=None,
            )
