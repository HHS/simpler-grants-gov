"""CommonGrants Protocol services."""

from .opportunity_service import CommonGrantsOpportunityService
from .transformation import transform_opportunity_to_common_grants

__all__ = ["CommonGrantsOpportunityService", "transform_opportunity_to_common_grants"]
