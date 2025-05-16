from pydantic import BaseModel, Field


class OpportunityDetails(BaseModel):
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
