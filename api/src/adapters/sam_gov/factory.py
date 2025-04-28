"""Factory for creating SAM.gov clients."""

import logging
import os

from src.adapters.sam_gov.client import BaseSamGovClient, SamGovClient
from src.adapters.sam_gov.mock_client import MockSamGovClient

logger = logging.getLogger(__name__)


def create_sam_gov_client() -> BaseSamGovClient:
    """
    Create and return the appropriate SAM.gov client based on environment variables.

    Uses mock client if USE_MOCK_SAM_GOV_CLIENT=true or for local development,
    otherwise uses the real client.

    Returns:
        BaseSamGovClient: A SAM.gov client implementation
    """
    api_url = os.environ.get("SAM_API_URL", "https://open.gsa.gov/api/sam-entity-extracts-api/")
    use_mock = os.environ.get("USE_MOCK_SAM_GOV_CLIENT", "true").lower() == "true"

    if use_mock:
        logger.info("Using mock SAM.gov client")
        return MockSamGovClient()
    else:
        logger.info("Using real SAM.gov client")
        return SamGovClient(api_url=api_url)
