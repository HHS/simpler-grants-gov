from datetime import datetime
from typing import Any

from grants_shared.util.datetime_util import make_timezone_aware
from pydantic import BaseModel, Field, field_serializer, field_validator, model_validator

from src.legacy_soap_api.grantors.filters import GetSubmissionListFilter
from src.legacy_soap_api.legacy_soap_api_schemas import (
    BaseSOAPSchema,
    FaultMessage,
    SOAPInvalidEnvelope,
)
from src.legacy_soap_api.legacy_soap_api_utils import SOAPInvalidFilter


class SubmissionInfo(BaseSOAPSchema):
    funding_opportunity_number: str | None = Field(default=None, alias="FundingOpportunityNumber")
    cfda_number: str | None = Field(default=None, alias="CFDANumber")
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")
    received_date_time: datetime | None = Field(default=None, alias="ns2:ReceivedDateTime")
    grants_gov_application_status: str | None = Field(
        default=None, alias="GrantsGovApplicationStatus"
    )
    submission_method: str | None = Field(default=None, alias="SubmissionMethod")
    submission_title: str | None = Field(default=None, alias="SubmissionTitle")
    package_id: str | None = Field(default=None, alias="PackageID")
    competition_id: str | None = Field(default=None, alias="CompetitionID")
    delinquent_federal_debt: str | None = Field(default=None, alias="DelinquentFederalDebt")
    active_exclusions: str | None = Field(default=None, alias="ActiveExclusions")

    @field_validator("received_date_time", mode="before")
    @classmethod
    def ensure_timezone_aware(cls, received_date_time: datetime | None) -> datetime | None:
        if isinstance(received_date_time, datetime) and received_date_time.tzinfo is None:
            return make_timezone_aware(received_date_time, "US/Eastern")
        return received_date_time

    @field_serializer("received_date_time")
    def serialize_dt(self, dt: datetime) -> str:
        return dt.isoformat(timespec="milliseconds")


class SubmissionInfoExpanded(SubmissionInfo):
    uei: str | None = Field(default=None, alias="UEI")


class GetSubmissionListResponse(BaseSOAPSchema):
    success: bool = Field(default=True, alias="ns2:Success")
    available_application_number: int | None = Field(
        default=None, alias="ns2:AvailableApplicationNumber"
    )
    submission_info: list[SubmissionInfo] | list[SubmissionInfoExpanded] = Field(
        default_factory=list, alias="ns2:SubmissionInfo"
    )

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return super().to_soap_envelope_dict(f"ns2:{operation_name}")


class ExpandedApplicationFilter(BaseModel):
    filter_value: str | int = Field(alias="FilterValue")
    filter_type: str = Field(alias="FilterType")

    @field_validator("filter_value", mode="before")
    @classmethod
    def convert_grants_gov_tracking_numbers_to_int(cls, v: Any) -> Any:
        if isinstance(v, str) and v.startswith("GRANT"):
            return int(v.split("GRANT")[1])
        return v


def update_consolidated(
    consolidated: list[ExpandedApplicationFilter], filter_type: str, filter_value: str | list
) -> list[ExpandedApplicationFilter]:
    filter_item = ExpandedApplicationFilter.model_validate(
        {"FilterType": filter_type, "FilterValue": filter_value}
    )
    consolidated.append(filter_item)
    return consolidated


class ConsolidatedFilter(BaseModel):
    filters: list[ExpandedApplicationFilter]

    @model_validator(mode="before")
    @classmethod
    def consolidate_filters(
        cls, data: dict[str, list[str] | str] | list
    ) -> dict[str, list[ExpandedApplicationFilter]]:
        if not isinstance(data, list):
            data = [data]

        # Consolidate the filter values here by type
        # consolidated: dict = defaultdict(list)
        consolidated: list = []
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

    @model_validator(mode="after")
    def validate_filters(self) -> ConsolidatedFilter:
        for f in self.filters:
            filter_type = f.filter_type
            if filter_type not in GetSubmissionListFilter:
                log_msg = "legacy_soap_api: Invalid Filter"
                faultstring = f"Encountered invalid filter type {filter_type}"
                raise SOAPInvalidFilter(
                    log_msg, fault=FaultMessage(faultcode="soap:Server", faultstring=faultstring)
                )
        return self


class GetSubmissionListRequest(BaseModel):
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
