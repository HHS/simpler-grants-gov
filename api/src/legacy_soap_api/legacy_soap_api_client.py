import requests

from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig


class LegacySOAPClient:
    def __init__(self) -> None:
        self.config = LegacySoapAPIConfig()

    def proxy_request(
        self, method: str, full_path: str, headers: dict | None = None, body: bytes | None = None
    ) -> requests.models.Response:
        """Proxy incoming SOAP requests to grants.gov

        This method handles proxying requests to grants.gov SOAP API and retrieving
        and returning the xml data as is from the existing SOAP API.
        """
        url = f"{self.config.grants_gov_uri}{full_path}"
        return requests.request(method, url, data=body, headers=headers)
