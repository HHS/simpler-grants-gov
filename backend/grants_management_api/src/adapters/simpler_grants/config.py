"""Configuration for the Simpler Grants API client."""

import os
from dataclasses import dataclass


@dataclass
class SimplerGrantsConfig:
    """Configuration for the Simpler Grants API client."""

    base_url: str
    api_key: str | None = None
    timeout: int = 5


def get_config() -> SimplerGrantsConfig:
    """Get the Simpler Grants API configuration from environment variables."""
    base_url = os.getenv("SIMPLER_GRANTS_API_BASE_URL", "http://localhost:8080")
    api_key = os.getenv("SIMPLER_GRANTS_API_KEY")

    return SimplerGrantsConfig(base_url=base_url, api_key=api_key)
