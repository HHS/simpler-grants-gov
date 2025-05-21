from pydantic import Field, model_validator
from typing_extensions import Self

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema

from .opportunity_filter import OpportunityFilter


class GetOpportunityListRequest(BaseSOAPSchema):
    package_id: str | None = Field(default=None, alias="PackageID")
    opportunity_filter: OpportunityFilter | None = Field(default=None, alias="OpportunityFilter")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not any([self.package_id, self.opportunity_filter]):
            raise ValueError("Error")
        return self
