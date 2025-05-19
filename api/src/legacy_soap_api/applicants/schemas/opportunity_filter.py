from pydantic import BaseModel, Field, model_validator
from typing_extensions import Self


class OpportunityFilter(BaseModel):
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(default=None, alias="CFDANumber")
    competition_id: str | None = Field(default=None, alias="CompetitionID")

    @model_validator(mode="after")
    def validate_opportunity_filter(self) -> Self:
        if not any([self.cfda_number, self.competition_id, self.funding_opportunity_number]):
            raise ValueError("Error")
        if self.competition_id and not (self.cfda_number or self.funding_opportunity_number):
            raise ValueError("Error")
        return self
