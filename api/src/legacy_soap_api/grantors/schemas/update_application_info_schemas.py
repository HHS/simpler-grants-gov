"""
This file defines pydantic schemas for the UpdateApplicationInfo SOAP operations in the grants.gov Agency API.

The XML schemas can be found at the following URLs:
Training: https://trainingapply.grants.gov/apply/system/schemas/AgencyUpdateApplicationInfo-V1.0.xsd
Production: https://apply07.grants.gov/apply/system/schemas/AgencyUpdateApplicationInfo-V1.0.xsd
"""

from pydantic import Field

from src.legacy_soap_api.grantors.schemas.grants_gov_tracking_number_schema import (
    GrantsGovTrackingNumberRequiredSchema,
)
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema


class UpdateApplicationInfoRequest(GrantsGovTrackingNumberRequiredSchema):
    assign_agency_tracking_number: str | None = Field(
        default=None, alias="AssignAgencyTrackingNumber"
    )
    save_agency_notes: str | None = Field(default=None, alias="SaveAgencyNotes", min_length=1)


class SaveAgencyNotesResult(BaseSOAPSchema):
    success: str = Field(alias="Success")
    error_message: str | None = Field(default=None, alias="ErrorMessage")


class AssignAgencyTrackingNumberResult(BaseSOAPSchema):
    success: str = Field(alias="Success")
    error_message: str | None = Field(default=None, alias="ErrorMessage")


class UpdateApplicationInfoResponse(GrantsGovTrackingNumberRequiredSchema):
    success: str = Field(alias="Success")
    assign_agency_tracking_number_result: AssignAgencyTrackingNumberResult | None = Field(
        default=None, alias="AssignAgencyTrackingNumberResult"
    )
    save_agency_notes_result: SaveAgencyNotesResult | None = Field(
        default=None, alias="SaveAgencyNotesResult"
    )
