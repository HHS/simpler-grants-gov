from pydantic import BaseModel, Field, model_validator
from typing_extensions import Self

from .opportunity_filter import OpportunityFilter


class GetOpportunityListRequest(BaseModel):
    package_id: str | None = Field(default=None, alias="PackageID")
    opportunity_filter: OpportunityFilter | None = Field(default=None, alias="OpportunityFilter")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not any([self.package_id, self.opportunity_filter]):
            raise ValueError("Error")
        return self
