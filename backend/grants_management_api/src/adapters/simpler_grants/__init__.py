"""Simpler Grants API client adapter."""

from src.adapters.simpler_grants.client import BaseSimplerGrantsClient, SimplerGrantsClient
from src.adapters.simpler_grants.config import SimplerGrantsConfig, get_config
from src.adapters.simpler_grants.models import (
    Opportunity,
    OpportunityGetResponse,
    OpportunityStatus,
    OpportunitySummary,
)

__all__ = [
    "BaseSimplerGrantsClient",
    "SimplerGrantsClient",
    "SimplerGrantsConfig",
    "get_config",
    "Opportunity",
    "OpportunityGetResponse",
    "OpportunityStatus",
    "OpportunitySummary",
]
