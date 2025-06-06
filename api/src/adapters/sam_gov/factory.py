"""Factory for creating SAM.gov clients."""

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.mock_client import MockSamGovClient


def create_sam_gov_client(
    config: SamGovConfig | None = None,
) -> BaseSamGovClient:
    """
    Create a SAM.gov API client based on provided parameters.

    Args:
        config: Optional SamGovConfig object to use for configuration.
               If not provided, configuration will be loaded from environment variables.

    Returns:
        A SAM.gov API client instance
    """
    # If config is provided, use that, otherwise load from environment
    sam_config = config if config else SamGovConfig()

    # Use mock client if use_mock is True in the config
    if sam_config.use_mock:
        return MockSamGovClient(
            mock_data_file=sam_config.mock_data_file,
            mock_extract_dir=sam_config.mock_extract_dir,
        )

    # Otherwise use the real client
    return SamGovClient(sam_config)
