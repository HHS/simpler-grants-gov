"""Configuration for SAM.gov API client."""

from pydantic import Field
from pydantic_settings import SettingsConfigDict

from src.util.env_config import PydanticBaseEnvConfig


class SamGovConfig(PydanticBaseEnvConfig):
    """Configuration for SAM.gov API client."""

    model_config = SettingsConfigDict(
        env_prefix="SAM_GOV_", validate_by_name=True, validate_by_alias=True, extra="ignore"
    )

    base_url: str = Field(default="https://api.sam.gov/", alias="BASE_URL")
    api_key: str | None = Field(default=None, alias="API_KEY")
    timeout: int = Field(default=30, alias="API_TIMEOUT")  # Timeout in seconds

    # Mock configuration (only used locally for testing)
    use_mock: bool = Field(default=False, alias="USE_MOCK")
    mock_data_file: str | None = Field(default=None, alias="MOCK_DATA_FILE")
    mock_extract_dir: str | None = Field(default=None, alias="MOCK_EXTRACT_DIR")


def get_config() -> SamGovConfig:
    """Get the SAM.gov configuration from environment variables."""
    return SamGovConfig()
