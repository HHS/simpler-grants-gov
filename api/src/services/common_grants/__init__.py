"""CommonGrants Protocol services."""

from .opportunity_service import CommonGrantsOpportunityService
from .transformation import transform_opportunity_to_cg

__all__ = ["CommonGrantsOpportunityService", "transform_opportunity_to_cg"]
