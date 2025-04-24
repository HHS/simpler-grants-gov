"""Factory for creating SAM.gov clients."""

import os
from typing import Any, Dict

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.mock_client import MockSamGovClient


def create_sam_gov_client(
    use_mock: bool | None = None,
    config: SamGovConfig | None = None,
    config_override: Dict[str, Any] | None = None,
) -> BaseSamGovClient:
    """
    Create a SAM.gov API client based on environment settings.

    Args:
        use_mock: Whether to use the mock client. If None, determined from SAM_GOV_USE_MOCK env var.
        config: Optional SamGovConfig object to use for configuration.
        config_override: Optional dictionary with values to override environment variables.

    Returns:
        A SAM.gov API client instance
    """
    # Determine if we should use the mock client
    if use_mock is None:
        # Check environment variable - 'true' (case insensitive) means use mock
        use_mock = os.environ.get("SAM_GOV_USE_MOCK", "").lower() == "true"
    
    # If use_mock is True or SAM_GOV_MOCK is 'true', use the mock client
    if use_mock or os.environ.get("SAM_GOV_MOCK") == "true":
        # Check if a custom mock data file is provided
        mock_data_file = os.environ.get("SAM_GOV_MOCK_DATA_FILE")
        mock_extract_dir = os.environ.get("SAM_GOV_MOCK_EXTRACT_DIR")
        return MockSamGovClient(
            mock_data_file=mock_data_file,
            mock_extract_dir=mock_extract_dir,
        )

    # If config is provided, use that instead of building from env/params
    if config:
        return SamGovClient(config)

    # Create a dictionary for client parameters
    client_params = {
        "api_key": os.environ.get("SAM_GOV_API_KEY"),
        "username": os.environ.get("SAM_GOV_USERNAME"),
        "password": os.environ.get("SAM_GOV_PASSWORD"),
        "api_url": os.environ.get("SAM_GOV_API_URL"),
        "extract_url": os.environ.get("SAM_GOV_EXTRACT_URL"),
    }

    # Override with provided values if any
    if config_override:
        client_params.update(config_override)

    return SamGovClient(**client_params)
