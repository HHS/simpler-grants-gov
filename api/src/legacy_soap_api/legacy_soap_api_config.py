from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class LegacySoapAPIConfig(PydanticBaseEnvConfig):
    grants_gov_uri: str = Field(alias="GRANTS_GOV_URI")
    soap_api_enabled: bool = Field(default=False, alias="ENABLE_SOAP_API")
