from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema, SOAPInvalidEnvelope


class SubmissionInfo(BaseSOAPSchema):
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
    uei: str | None = Field(alias="UEI")


class GetSubmissionListExpandedResponse(BaseSOAPSchema):
    success: bool = Field(default=True, alias="Success")
    available_application_number: int = Field(alias="AvailableApplicationNumber")
    submission_info: list[SubmissionInfo] = Field(alias="SubmissionInfo")


class GetSubmissionListExpandedResponseSOAPBody(BaseSOAPSchema):
    get_submission_list_expanded_response: GetSubmissionListExpandedResponse = Field(
        alias="GetSubmissionListExpandedResponse"
    )


class GetSubmissionListExpandedResponseSOAPEnvelope(BaseSOAPSchema):
    Body: GetSubmissionListExpandedResponseSOAPBody


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


class ConsolidatedFilter(BaseModel):
    filters: dict[str, list[str] | list[int]]

    @model_validator(mode="before")
    @classmethod
    def consolidate_filters(cls, data: dict[str, list[str] | str]) -> dict[str, dict[str, str]]:
        if not data:
            return {"filters": {}}
        type_list = data.get("FilterType", [])
        value_list = data.get("FilterValue", [])
        if not isinstance(type_list, list):
            type_list = [type_list]
        if not isinstance(value_list, list):
            value_list = [value_list]
        if not type_list and not value_list:
            return {"filters": {}}
        consolidated: dict = {}
        if len(type_list) == 1 and len(value_list) > 1:
            single_type = type_list[0]
            consolidated[single_type] = []
            filter_item = ExpandedApplicationFilter.model_validate(
                {"FilterType": single_type, "FilterValue": value_list}
            )
            consolidated[filter_item.filter_type].extend(filter_item.filter_value)
        elif len(type_list) == len(value_list):
            for f_type, f_value in zip(type_list, value_list, strict=True):
                filter_item = ExpandedApplicationFilter.model_validate(
                    {"FilterType": f_type, "FilterValue": [f_value]}
                )
                if filter_item.filter_type not in consolidated:
                    consolidated[filter_item.filter_type] = []
                consolidated[filter_item.filter_type].extend(filter_item.filter_value)
        elif len(type_list) > len(value_list):
            raise SOAPInvalidEnvelope(
                "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterValue}' is expected."
            )
        elif len(type_list) == 0 and len(value_list) > 0:
            raise SOAPInvalidEnvelope(
                "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' is expected."
            )
        return {"filters": consolidated}


class GetSubmissionListExpandedRequest(BaseModel):
    expanded_application_filter: Optional[ConsolidatedFilter] = Field(
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
