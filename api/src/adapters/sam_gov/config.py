"""Configuration for SAM.gov API client."""

from pydantic import Field
from pydantic_settings import SettingsConfigDict

from src.util.env_config import PydanticBaseEnvConfig


class SamGovConfig(PydanticBaseEnvConfig):
    """Configuration for SAM.gov API client."""

    model_config = SettingsConfigDict(env_prefix="SAM_GOV_", populate_by_name=True, extra="ignore")

    base_url: str = Field(default="https://api.sam.gov/data-services/v1/extracts", alias="BASE_URL")
    extract_url: str | None = Field(default=None, alias="EXTRACT_URL")
    api_key: str | None = Field(default=None, alias="API_KEY")
    timeout: int = Field(default=30, alias="API_TIMEOUT")  # Timeout in seconds


def get_config() -> SamGovConfig:
    """Get the SAM.gov configuration from environment variables."""
    return SamGovConfig()
