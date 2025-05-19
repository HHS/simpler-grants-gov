from pydantic import BaseModel, Field

from .opportunity_details import OpportunityDetails


class GetOpportunityListResponse(BaseModel):
    opportunity_details: list[OpportunityDetails] | None = Field(
        default=None, alias="OpportunityDetails"
    )
