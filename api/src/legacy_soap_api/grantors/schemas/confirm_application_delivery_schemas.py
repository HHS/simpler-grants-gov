from typing import Self

from pydantic import AliasChoices, Field, model_validator

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

GET_APPLICATION_ZIP_REQUEST_ERR = "No grants_gov_tracking_number provided."


class ConfirmApplicationDeliveryResponse(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")
    response_message: str | None = Field(default=None, alias="ResponseMessage")


class ConfirmApplicationDeliveryResponseSOAPBody(BaseSOAPSchema):
    confirm_application_delivery_response: ConfirmApplicationDeliveryResponse = Field(
        alias="ns2:ConfirmApplicationDeliveryResponse",
        # From testing it looks like the response comes in with the namespace ns2 but when we convert
        # it to a dict via the SOAPPayload the namespace can be lost so using validation_alias in order
        # to handle both cases
        validation_alias=AliasChoices(
            "ns2:ConfirmApplicationDeliveryResponse", "ConfirmApplicationDeliveryResponse"
        ),
    )


class ConfirmApplicationDeliveryResponseSOAPEnvelope(BaseSOAPSchema):
    body: ConfirmApplicationDeliveryResponseSOAPBody = Field(alias="Body")

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        envelope_dict = {"Envelope": self.model_dump(by_alias=True)}
        return envelope_dict


class ConfirmApplicationDeliveryRequest(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not self.grants_gov_tracking_number:
            raise SOAPFaultException(
                GET_APPLICATION_ZIP_REQUEST_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return self
