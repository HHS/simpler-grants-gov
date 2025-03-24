from typing import Literal

import requests

from src.adapters.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig


class LegacySOAPClient:
    def __init__(self) -> None:
        self.config = LegacySoapAPIConfig()

    def proxy_request(
        self, method: str, full_path: str, headers: dict | None = None, body: bytes | None = None
    ) -> str:
        """Proxy incoming requests to grants.gov

        This method handles proxying requests to grants.gov SOAP API.
        """
        url = f"{self.config.grants_gov_uri}{full_path}"
        response = requests.request(method, url, data=body, headers=headers)
        return response.text
