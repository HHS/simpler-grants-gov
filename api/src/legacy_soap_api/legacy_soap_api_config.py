from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class LegacySoapAPIConfig(PydanticBaseEnvConfig):
    grants_gov_uri: str = Field(alias="GRANTS_GOV_URI")
    soap_api_enabled: bool = Field(default=False, alias="ENABLE_SOAP_API")
    inject_uuid_data: bool = Field(default=False, alias="INJECT_UUID_SOAP_RESPONSE")
    gg_s2s_proxy_header_key: str = Field(default="", alias="GG_S2S_PROXY_HEADER_KEY")
