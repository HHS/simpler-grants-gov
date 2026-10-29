from datetime import date
from typing import Self

from pydantic import Field, field_validator, model_validator

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException
from src.util.datetime_util import parse_grants_gov_date

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
    cfda_details: CFDADetails | None = Field(default=None, alias="CFDADetails")
    closing_date: date | None = Field(default=None, alias="ClosingDate")
    competition_id: str | None = Field(default=None, alias="CompetitionID")
    competition_title: str | None = Field(default=None, alias="CompetitionTitle")
    funding_opportunity_title: str | None = Field(default=None, alias="FundingOpportunityTitle")
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    instructions_url: str | None = Field(default=None, alias="InstructionsURL")
    is_multi_project: str | None = Field(default=None, alias="IsMultiProject")
    offering_agency: str | None = Field(default=None, alias="OfferingAgency")
    opening_date: date | None = Field(default=None, alias="OpeningDate")
    package_id: str | None = Field(default=None, alias="PackageID")
    schema_url: str | None = Field(default=None, alias="SchemaURL")

    @field_validator("closing_date", mode="before")
    @classmethod
    def parse_closing_date(cls, value: str | date | None) -> date | None:
        """
        Parse closing date from grants.gov format which may include timezone suffix.

        Grants.gov returns dates like "2025-09-16-04:00" but we need just the date part.
        """
        if isinstance(value, date):
            return value
        return parse_grants_gov_date(value)

    @field_validator("opening_date", mode="before")
    @classmethod
    def parse_opening_date(cls, value: str | date | None) -> date | None:
        """
        Parse opening date from grants.gov format which may include timezone suffix.

        Grants.gov returns dates like "2025-09-16-04:00" but we need just the date part.
        """
        if isinstance(value, date):
            return value
        return parse_grants_gov_date(value)


class GetOpportunityListResponse(BaseSOAPSchema):
    opportunity_details: list[OpportunityDetails] = Field(
        default_factory=list, alias="OpportunityDetails"
    )

    @field_validator("opportunity_details", mode="before")
    @classmethod
    def force_list(cls, value: dict | list | None) -> list:
        """
        Parsing the xml into a dict may result in this property being a dict instead of
        a list so this method forces opportunity_details into list when there is only 1 opportunity
        returned.

        Always returns a list to ensure consistent behavior - empty list for no opportunities,
        populated list for one or more opportunities.
        """
        if isinstance(value, dict):
            return [value]
        elif value is None:
            return []
        return value
