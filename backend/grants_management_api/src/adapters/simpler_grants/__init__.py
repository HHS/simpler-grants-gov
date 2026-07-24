"""Simpler Grants API client adapter."""

from src.adapters.simpler_grants.client import (
    BaseSimplerGrantsClient,
    SimplerGrantsClient,
    SimplerResponseError,
    SimplerResponseException,
)
from src.adapters.simpler_grants.config import SimplerGrantsConfig, get_config
from src.adapters.simpler_grants.models import (
    SimplerOpportunity,
    SimplerOpportunityGetResponse,
    SimplerOpportunityStatus,
    SimplerOpportunitySummary,
)

__all__ = [
    "BaseSimplerGrantsClient",
    "SimplerGrantsClient",
    "SimplerResponseError",
    "SimplerResponseException",
    "SimplerGrantsConfig",
    "get_config",
    "SimplerOpportunity",
    "SimplerOpportunityGetResponse",
    "SimplerOpportunityStatus",
    "SimplerOpportunitySummary",
]
