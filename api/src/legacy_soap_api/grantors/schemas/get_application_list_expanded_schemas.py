from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_serializer, field_validator, model_validator

from src.legacy_soap_api.grantors.schemas.get_submission_list_schemas import ConsolidatedFilter
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema, SOAPInvalidEnvelope
from src.util.datetime_util import make_timezone_aware


class ExpandedApplicationInfo(BaseSOAPSchema):
    """Single application row in a GetApplicationListExpanded response.

    Includes CompetitionID per the SOAP Proxy supported fields table.
    UEI is not in the supported fields table for this endpoint and is omitted.
    """

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


class GetApplicationListExpandedResponse(BaseSOAPSchema):
    success: bool = Field(default=True, alias="ns2:Success")
    available_application_number: int | None = Field(
        default=None, alias="ns2:AvailableApplicationNumber"
    )
    expanded_application_info: list[ExpandedApplicationInfo] = Field(
        default_factory=list, alias="ns2:ExpandedApplicationInfo"
    )

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return super().to_soap_envelope_dict(f"ns2:{operation_name}")


class GetApplicationListExpandedRequest(BaseModel):
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
                    "The content of element 'ExpandedApplicationFilter' is not complete. One of "
                    "'{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' "
                    "is expected."
                )
        return data
