from typing import Any

from pydantic import BaseModel, Field, PrivateAttr

from src.legacy_soap_api.grantors.schemas.grants_gov_tracking_number_schema import (
    GrantsGovTrackingNumberRequiredSchema,
)

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
    _mtom_file_stream: Any | None = PrivateAttr(default=None)
    _content_id: str

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        # We need the _content_id for the header
        envelope_dict = {
            "Envelope": {"Body": self.Body.model_dump(by_alias=True)},
            "_content_id": self._content_id,
        }
        if self._mtom_file_stream:
            envelope_dict["_mtom_file_stream"] = self._mtom_file_stream
        return envelope_dict


class GetApplicationZipRequest(GrantsGovTrackingNumberRequiredSchema):
    pass
