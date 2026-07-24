"""Models for Simpler Grants API responses."""

from datetime import date
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class SimplerOpportunityStatus(StrEnum):
    """Opportunity status enum matching the API's OpportunityStatus."""

    FORECASTED = "forecasted"
    POSTED = "posted"
    CLOSED = "closed"
    ARCHIVED = "archived"


class SimplerOpportunitySummary(BaseModel):
    """Minimal opportunity summary fields."""

    post_date: date | None = None


class SimplerOpportunity(BaseModel):
    """Minimal opportunity fields needed for grants management integration."""

    opportunity_id: UUID
    opportunity_title: str | None = None
    opportunity_status: SimplerOpportunityStatus | None = None
    summary: SimplerOpportunitySummary | None = None


class SimplerOpportunityGetResponse(BaseModel):
    """Response wrapper for GET opportunity endpoint."""

    message: str
    data: SimplerOpportunity
