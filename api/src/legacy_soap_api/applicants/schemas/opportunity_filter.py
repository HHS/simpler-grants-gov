from pydantic import Field, model_validator
from typing_extensions import Self

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException


class OpportunityFilter(BaseSOAPSchema):
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(default=None, alias="CFDANumber")
    competition_id: str | None = Field(default=None, alias="CompetitionID")

    @model_validator(mode="after")
    def validate_opportunity_filter(self) -> Self:
        if not any([self.cfda_number, self.competition_id, self.funding_opportunity_number]):
            raise SOAPFaultException(
                "No cfda_number, competition_id, or funding_opportunity_number provided.",
                fault=OpportunityListRequestInvalidParams,
            )
        if self.competition_id and not (self.cfda_number or self.funding_opportunity_number):
            raise SOAPFaultException(
                "Either cfda_number or funding_opportunity_number is required if competition_id is provided.",
                fault=OpportunityListRequestInvalidParams,
            )
        return self
