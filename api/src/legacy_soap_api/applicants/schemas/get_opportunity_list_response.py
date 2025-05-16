from pydantic import BaseModel, Field

from src.legacy_soap_api.applicants.schemas import OpportunityDetails


class GetOpportunityListResponse(BaseModel):
    opportunity_details: list[OpportunityDetails] | None = Field(
        default=None, alias="OpportunityDetails"
    )
