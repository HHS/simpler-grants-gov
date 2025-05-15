from pydantic import BaseModel, Field, model_validator
from typing_extensions import Self


class OpportunityListFilter(BaseModel):
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(default=None, alias="CFDANumber")
    competition_id: str | None = Field(default=None, alias="CompetitionID")

    @model_validator(mode="after")
    def validate(self) -> Self:
        if not any([self.cfda_number, self.competition_id, self.funding_opportunity_number]):
            raise ValueError("Error")
        if self.competition_id and not (self.cfda_number or self.funding_opportunity_number):
            raise ValueError("Error")
        return self


class GetOpportunityListRequest(BaseModel):
    package_id: str | None = Field(default=None, alias="PackageID")
    opportunity_list_filter: OpportunityListFilter | None = Field(
        default=None, alias="OpportunityListFilter"
    )

    @model_validator(mode="after")
    def validate(self) -> Self:
        if not any([self.package_id, self.opportunity_list_filter]):
            raise ValueError("Error")
        return self
