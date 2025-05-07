"""Factory for creating SAM.gov clients."""

import logging

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.mock_client import MockSamGovClient

logger = logging.getLogger(__name__)


def create_sam_gov_client(
    config: SamGovConfig | None = None,
) -> BaseSamGovClient:
    """
    Create and return the appropriate SAM.gov client based on environment variables.

    Args:
        config: Optional SamGovConfig object to use for configuration.
               If not provided, configuration will be loaded from environment variables.

    Returns:
        BaseSamGovClient: A SAM.gov client implementation
    """
    # If config is provided, use that, otherwise load from environment
    sam_config = config if config else SamGovConfig()

    # Use mock client if use_mock is True in the config
    if sam_config.use_mock:
        logger.info("Using mock SAM.gov client")
        return MockSamGovClient(
            mock_data_file=sam_config.mock_data_file,
            mock_extract_dir=sam_config.mock_extract_dir,
        )

    # Otherwise use the real client
    logger.info("Using real SAM.gov client with base URL: %s", sam_config.base_url)
    return SamGovClient(sam_config)
