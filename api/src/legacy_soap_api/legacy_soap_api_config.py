import json
import logging
from typing import Any

from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LegacySoapAPIConfig(PydanticBaseEnvConfig):
    grants_gov_uri: str = Field(alias="GRANTS_GOV_URI")
    soap_api_enabled: bool = Field(default=False, alias="ENABLE_SOAP_API")
    inject_uuid_data: bool = Field(default=False, alias="INJECT_UUID_SOAP_RESPONSE")
    gg_s2s_proxy_header_key: str = Field(default="", alias="GG_S2S_PROXY_HEADER_KEY")
    soap_auth_content: str | None = Field(None, alias="SOAP_AUTH_CONTENT")
    soap_auth_map: dict = Field(default_factory=dict)

    def model_post_init(self, _context: Any) -> None:
        self.soap_auth_map = {}
        if self.soap_auth_content is not None:
            try:
                self.soap_auth_map = json.loads(self.soap_auth_content)
            except Exception:
                # This except is to prevent the entire API from starting up if the value is malformed
                logger.exception("Could not load soap auth content")
