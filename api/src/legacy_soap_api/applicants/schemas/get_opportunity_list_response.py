from pydantic import Field

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema

from .opportunity_details import OpportunityDetails


class GetOpportunityListResponse(BaseSOAPSchema):
    opportunity_details: list[OpportunityDetails] | None = Field(
        default=None, alias="OpportunityDetails"
    )
