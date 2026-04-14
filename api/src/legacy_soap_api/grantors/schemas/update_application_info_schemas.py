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
    success: str | None = Field(default=None, alias="ns9:Success")
    error_message: str | None = Field(default=None, alias="ns9:ErrorMessage")


class AssignAgencyTrackingNumberResult(BaseSOAPSchema):
    success: str | None = Field(default=None, alias="ns9:Success")
    error_message: str | None = Field(default=None, alias="ns9:ErrorMessage")


class UpdateApplicationInfoResponse(GrantsGovTrackingNumberRequiredSchema):
    success: str | None = Field(default=None, alias="ns2:Success")
    assign_agency_tracking_number_result: AssignAgencyTrackingNumberResult | None = Field(
        default=None, alias="ns9:AssignAgencyTrackingNumberResult"
    )
    save_agency_notes_result: SaveAgencyNotesResult | None = Field(
        default=None, alias="ns9:SaveAgencyNotesResult"
    )


class UpdateApplicationInfoResponseSOAPEnvelope(UpdateApplicationInfoResponse):
    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return super().to_soap_envelope_dict(f"ns2:{operation_name}")
