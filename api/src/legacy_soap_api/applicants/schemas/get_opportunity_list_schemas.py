from typing import Self

from pydantic import Field, model_validator

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

GET_OPPORTUNITY_LIST_REQUEST_ERR = "No package_id or opportunity_filter provided."
OPPORTUNITY_LIST_NO_DATA_PROVIDED_ERR = (
    "No cfda_number, competition_id, or funding_opportunity_number provided."
)
OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR = (
    "Either cfda_number or funding_opportunity_number is required if competition_id is provided."
)


class CFDADetails(BaseSOAPSchema):
    number: str | None = Field(default=None, alias="Number")
    title: str | None = Field(default=None, alias="Title")


class OpportunityFilter(BaseSOAPSchema):
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(default=None, alias="CFDANumber")
    competition_id: str | None = Field(default=None, alias="CompetitionID")

    @model_validator(mode="after")
    def validate_opportunity_filter(self) -> Self:
        if not any([self.cfda_number, self.competition_id, self.funding_opportunity_number]):
            raise SOAPFaultException(
                OPPORTUNITY_LIST_NO_DATA_PROVIDED_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        if self.competition_id and not (self.cfda_number or self.funding_opportunity_number):
            raise SOAPFaultException(
                OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return self


class GetOpportunityListRequest(BaseSOAPSchema):
    package_id: str | None = Field(default=None, alias="PackageID")
    opportunity_filter: OpportunityFilter | None = Field(default=None, alias="OpportunityFilter")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not any([self.package_id, self.opportunity_filter]):
            raise SOAPFaultException(
                GET_OPPORTUNITY_LIST_REQUEST_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return self


class OpportunityDetails(BaseSOAPSchema):
    agency_contact_info: str | None = Field(default=None, alias="AgencyContactInfo")
    competition_title: str | None = Field(default=None, alias="CompetitionTitle")
    competition_id: str | None = Field(default=None, alias="CompetitionID")
    funding_opportunity_title: str | None = Field(default=None, alias="FundingOpportunityTitle")
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    opening_date: str | None = Field(default=None, alias="OpeningDate")
    closing_date: str | None = Field(default=None, alias="ClosingDate")
    offering_agency: str | None = Field(default=None, alias="OfferingAgency")
    schema_url: str | None = Field(default=None, alias="SchemaUrl")
    instructions_url: str | None = Field(default=None, alias="InstructionsUrl")
    is_multi_project: str | None = Field(default=None, alias="IsMultiProject")


class GetOpportunityListResponse(BaseSOAPSchema):
    opportunity_details: list[OpportunityDetails] | None = Field(
        default=None, alias="OpportunityDetails"
    )
