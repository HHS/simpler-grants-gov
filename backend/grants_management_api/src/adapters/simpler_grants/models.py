"""Models for Simpler Grants API responses."""

from datetime import date
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class OpportunityStatus(StrEnum):
    """Opportunity status enum matching the API's OpportunityStatus."""

    FORECASTED = "forecasted"
    POSTED = "posted"
    CLOSED = "closed"
    ARCHIVED = "archived"


class OpportunitySummary(BaseModel):
    """Minimal opportunity summary fields."""

    post_date: date | None = Field(None, description="The date the opportunity was posted")


class Opportunity(BaseModel):
    """Minimal opportunity fields needed for grants management integration."""

    opportunity_id: UUID = Field(description="The internal ID of the opportunity")
    opportunity_title: str | None = Field(None, description="The title of the opportunity")
    opportunity_status: OpportunityStatus = Field(
        description="The current status of the opportunity"
    )
    summary: OpportunitySummary | None = Field(None, description="Summary information")


class OpportunityGetResponse(BaseModel):
    """Response wrapper for GET opportunity endpoint."""

    message: str = Field(description="Response message")
    data: Opportunity = Field(description="Opportunity data")
