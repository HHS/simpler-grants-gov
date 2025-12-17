from collections import defaultdict
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema, SOAPInvalidEnvelope


class SubmissionInfo(BaseSOAPSchema):
    funding_opportunity_number: str | None = Field(alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(alias="CFDANumber")
    grants_gov_tracking_number: str | None = Field(alias="GrantsGovTrackingNumber")
    received_date_time: datetime | None = Field(alias="ns2:ReceivedDateTime")
    grants_gov_application_status: str | None = Field(alias="GrantsGovApplicationStatus")
    submission_method: str | None = Field(alias="SubmissionMethod")
    submission_title: str | None = Field(alias="SubmissionTitle")
    package_id: str | None = Field(alias="PackageID")
    delinquent_federal_debt: str | None = Field(alias="DelinquentFederalDebt")
    active_exclusions: str | None = Field(alias="ActiveExclusions")
    uei: str | None = Field(alias="UEI")


class GetSubmissionListExpandedResponse(BaseSOAPSchema):
    success: bool = Field(default=True, alias="ns2:Success")
    available_application_number: int = Field(alias="ns2:AvailableApplicationNumber")
    submission_info: list[SubmissionInfo] = Field(alias="ns2:SubmissionInfo")


class GetSubmissionListExpandedResponseSOAPBody(BaseSOAPSchema):
    get_submission_list_expanded_response: GetSubmissionListExpandedResponse = Field(
        alias="ns2:GetSubmissionListExpandedResponse"
    )


class GetSubmissionListExpandedResponseSOAPEnvelope(BaseSOAPSchema):
    Body: GetSubmissionListExpandedResponseSOAPBody

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        body = self.Body.model_dump(by_alias=True, mode="json")
        cleaned_submissions = []
        if body.get("ns2:GetSubmissionListExpandedResponse"):
            for item in body["ns2:GetSubmissionListExpandedResponse"].get("ns2:SubmissionInfo", []):
                cleaned_submissions.append(
                    {key: val for key, val in item.items() if val is not None}
                )
            body["ns2:GetSubmissionListExpandedResponse"][
                "ns2:SubmissionInfo"
            ] = cleaned_submissions
        return {"Body": body}


class ExpandedApplicationFilter(BaseModel):
    filter_value: list[str | int] = Field(default_factory=list, alias="FilterValue")
    filter_type: str = Field(alias="FilterType")

    @field_validator("filter_value", mode="before")
    @classmethod
    def convert_grants_gov_tracking_numbers_to_int(cls, v: Any, info: Any) -> Any:
        return [
            (
                int(item.split("GRANT")[1])
                if isinstance(item, str) and item.startswith("GRANT")
                else item
            )
            for item in v
        ]


def update_consolidated(consolidated: dict, filter_type: str, filter_value: str | list) -> dict:
    value = filter_value if isinstance(filter_value, list) else [filter_value]
    filter_item = ExpandedApplicationFilter.model_validate(
        {"FilterType": filter_type, "FilterValue": value}
    )
    consolidated[filter_item.filter_type].extend(filter_item.filter_value)
    return consolidated


class ConsolidatedFilter(BaseModel):
    filters: dict[str, list[str] | list[int]]

    @model_validator(mode="before")
    @classmethod
    def consolidate_filters(
        cls, data: dict[str, list[str] | str] | list
    ) -> dict[str, dict[str, str]]:
        if not isinstance(data, list):
            data = [data]

        # Consolidate the filter values here by type
        consolidated: dict = defaultdict(list)
        for item in data:
            # Check for missing keys
            for value in ["FilterType", "FilterValue"]:
                if value not in item:
                    raise SOAPInvalidEnvelope(
                        "The content of element 'ExpandedApplicationFilter' is not complete. One of "
                        '\'{"http://apply.grants.gov/system/GrantsCommonElements-V1.0":'
                        f"{value}}}' is expected."
                    )
            consolidated = update_consolidated(
                consolidated, item["FilterType"], item["FilterValue"]
            )

        return {"filters": consolidated}


class GetSubmissionListExpandedRequest(BaseModel):
    expanded_application_filter: ConsolidatedFilter | None = Field(
        alias="ExpandedApplicationFilter", default=None
    )

    @model_validator(mode="before")
    @classmethod
    def check_if_expanded_application_filter_is_empty(cls, data: Any) -> dict[str, Any]:
        if isinstance(data, dict):
            filter_alias = "ExpandedApplicationFilter"
            if filter_alias in data and data[filter_alias] is None:
                raise SOAPInvalidEnvelope(
                    "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' is expected."
                )
        return data
