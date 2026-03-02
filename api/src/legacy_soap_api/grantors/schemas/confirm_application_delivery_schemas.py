import re

from pydantic import AliasChoices, Field, field_validator

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

CONFIRM_APPLICATION_DELIVERY_NO_TRACKING_NUMBER_ERR = "No grants_gov_tracking_number provided."
CONFIRM_APPLICATION_DELIVERY_INVALID_TRACKING_NUMBER_ERR = (
    "Invalid grants_gov_tracking_number provided."
)


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
        return {"Envelope": self.model_dump(by_alias=True)}


class ConfirmApplicationDeliveryRequest(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")

    @field_validator("grants_gov_tracking_number", mode="after")
    @classmethod
    def validate_required_properties(cls, value: str) -> str:
        if not value:
            raise SOAPFaultException(
                CONFIRM_APPLICATION_DELIVERY_NO_TRACKING_NUMBER_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        if not re.fullmatch(r"GRANT[0-9]{8}", value):
            raise SOAPFaultException(
                CONFIRM_APPLICATION_DELIVERY_INVALID_TRACKING_NUMBER_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return value
