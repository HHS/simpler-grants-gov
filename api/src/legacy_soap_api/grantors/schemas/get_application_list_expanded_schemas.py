from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema


class ExpandedApplicationInfo(BaseSOAPSchema):
    funding_opportunity_number: str | None = Field(alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(alias="CFDANumber")
    grants_gov_tracking_number: str | None = Field(alias="GrantsGovTrackingNumber")
    received_date_time: datetime | None = Field(alias="n2:ReceivedDateTime")
    grants_gov_application_status: str | None = Field(alias="GrantsGovApplicationStatus")
    submission_method: str | None = Field(alias="SubmissionMethod")
    submission_title: str | None = Field(alias="SubmissionTitle")
    package_id: str | None = Field(alias="PackageID")
    delinquent_federal_debt: str | None = Field(alias="DelinquentFederalDebt")
    active_exclusions: str | None = Field(alias="ActiveExclusions")


class GetApplicationListExpandedResponse(BaseSOAPSchema):
    success: bool = Field(default=True, alias="Success")
    available_application_number: int = Field(alias="AvailableApplicationNumber")
    expanded_application_info: list[ExpandedApplicationInfo] = Field(
        alias="ExpandedApplicationInfo"
    )


class GetApplicationListExpandedResponseSOAPBody(BaseSOAPSchema):
    get_application_list_expanded_response: GetApplicationListExpandedResponse = Field(
        alias="GetApplicationListExpandedResponse"
    )


class GetApplicationListExpandedResponseSOAPEnvelope(BaseSOAPSchema):
    Body: GetApplicationListExpandedResponseSOAPBody


class ExpandedApplicationFilter(BaseModel):
    filter_type: str = Field(alias="FilterType")
    grants_gov_tracking_numbers: list[int] = Field(
        alias="FilterValue", description="Zero or more repetitions", default_factory=list
    )

    @field_validator("grants_gov_tracking_numbers", mode="before")
    def convert_tracking_numbers(cls, value: str | list[str]) -> list[int]:
        if isinstance(value, str):
            return [int(value.split("GRANT")[1])]
        else:
            return [int(n.split("GRANT")[1]) for n in value if n]


class GetApplicationListExpandedRequest(BaseModel):
    expanded_application_filter: ExpandedApplicationFilter | None = Field(
        alias="ExpandedApplicationFilter"
    )
