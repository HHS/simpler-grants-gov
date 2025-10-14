from typing import Self

from pydantic import BaseModel, Field, model_validator

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

GET_APPLICATION_ZIP_REQUEST_ERR = "No grants_gov_tracking_number provided."


class XOPIncludeData(BaseModel):
    href: str = Field(alias="@href")


class FileDataHandler(BaseModel):
    xop_data: XOPIncludeData = Field(alias="xop:Include")


class GetApplicationZipResponse(BaseModel):
    file_data_handler: FileDataHandler = Field(alias="ns2:FileDataHandler")


class GetApplicationZipResponseSOAPBody(BaseModel):
    get_application_zip_response: GetApplicationZipResponse = Field(
        alias="ns2:GetApplicationZipResponse"
    )


class GetApplicationZipResponseSOAPEnvelope(BaseModel):
    Body: GetApplicationZipResponseSOAPBody

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return self.model_dump(by_alias=True)


class GetApplicationZipRequest(BaseModel):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not self.grants_gov_tracking_number:
            raise SOAPFaultException(
                GET_APPLICATION_ZIP_REQUEST_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return self
