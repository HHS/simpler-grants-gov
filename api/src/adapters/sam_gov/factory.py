"""Factory for creating SAM.gov clients."""

import logging

from pydantic import Field
from pydantic_settings import SettingsConfigDict

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.mock_client import MockSamGovClient
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class SamGovFactoryConfig(PydanticBaseEnvConfig):
    """Configuration for the SAM.gov client factory."""

    model_config = SettingsConfigDict(env_prefix="SAM_EXTRACTS_")

    use_mock_client: bool = Field(default=True)


def create_sam_gov_client() -> BaseSamGovClient:
    """
    Create and return the appropriate SAM.gov client based on environment variables.

    Uses mock client if SAM_EXTRACTS_USE_MOCK_CLIENT=true or for local development,
    otherwise uses the real client.

    Returns:
        BaseSamGovClient: A SAM.gov client implementation
    """
    factory_config = SamGovFactoryConfig()
    sam_config = SamGovConfig()

    if factory_config.use_mock_client:
        logger.info("Using mock SAM.gov client")
        return MockSamGovClient()
    else:
        logger.info("Using real SAM.gov client with base URL: %s", sam_config.base_url)
        return SamGovClient(api_key=sam_config.api_key, api_url=sam_config.base_url)
