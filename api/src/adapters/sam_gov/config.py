"""Configuration for SAM.gov API client."""

import os
from typing import Optional

from pydantic import BaseModel


class SamGovConfig(BaseModel):
    """Configuration for SAM.gov API client."""

    base_url: str = "https://open.gsa.gov/api/sam-entity-extracts-api"
    extract_url: str = "https://open.gsa.gov/api/sam-entity-extracts-api/extracts"
    api_key: Optional[str] = None
    timeout: int = 30  # Timeout in seconds

    @classmethod
    def from_env(cls) -> "SamGovConfig":
        """Create a config from environment variables."""
        return cls(
            base_url=os.environ.get(
                "SAM_GOV_API_BASE_URL", "https://open.gsa.gov/api/sam-entity-extracts-api"
            ),
            extract_url=os.environ.get(
                "SAM_GOV_EXTRACT_URL", "https://open.gsa.gov/api/sam-entity-extracts-api/extracts"
            ),
            api_key=os.environ.get("SAM_GOV_API_KEY"),
            timeout=int(os.environ.get("SAM_GOV_API_TIMEOUT", "30")),
        )


def get_config() -> SamGovConfig:
    """Get the SAM.gov configuration from environment variables."""
    return SamGovConfig.from_env()
