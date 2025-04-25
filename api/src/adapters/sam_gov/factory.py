"""Factory for creating SAM.gov clients."""

from typing import Any, Dict

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.mock_client import MockSamGovClient


def create_sam_gov_client(
    use_mock: bool = False,
    config: SamGovConfig | None = None,
    config_override: Dict[str, Any] | None = None,
    mock_data_file: str | None = None,
    mock_extract_dir: str | None = None,
) -> BaseSamGovClient:
    """
    Create a SAM.gov API client based on provided parameters.

    Args:
        use_mock: Whether to use the mock client.
        config: Optional SamGovConfig object to use for configuration.
        config_override: Optional dictionary with values to override config properties.
        mock_data_file: Optional path to a JSON file with mock extract metadata.
        mock_extract_dir: Optional path to a directory with mock extract files.

    Returns:
        A SAM.gov API client instance
    """
    # If use_mock is True, return a mock client
    if use_mock:
        return MockSamGovClient(
            mock_data_file=mock_data_file,
            mock_extract_dir=mock_extract_dir,
        )

    # If config is provided, use that
    if config:
        # Create a copy if we need to apply overrides
        if config_override:
            sam_config = SamGovConfig(
                base_url=config.base_url,
                extract_url=config.extract_url,
                api_key=config.api_key,
                timeout=config.timeout,
            )
            # Apply any overrides
            for key, value in config_override.items():
                setattr(sam_config, key, value)
            return SamGovClient(sam_config)
        return SamGovClient(config)

    # Load config from environment and apply overrides
    sam_config = SamGovConfig()

    # Apply any overrides
    if config_override:
        for key, value in config_override.items():
            setattr(sam_config, key, value)

    return SamGovClient(sam_config)
