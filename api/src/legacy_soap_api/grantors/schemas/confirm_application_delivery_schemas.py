import re

from pydantic import Field, field_validator

from src.legacy_soap_api.applicants.fault_messages import (
    ConfirmApplicationDeliveryInvalidTrackingNumber,
)
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

CONFIRM_APPLICATION_DELIVERY_INVALID_TRACKING_NUMBER_ERR = (
    "Invalid grants_gov_tracking_number provided."
)


class ConfirmApplicationDeliveryResponseSOAPEnvelope(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")
    response_message: str | None = Field(default=None, alias="ResponseMessage")

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return super().to_soap_envelope_dict(f"ns2:{operation_name}")


class ConfirmApplicationDeliveryRequest(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(default=None, alias="GrantsGovTrackingNumber")

    @field_validator("grants_gov_tracking_number", mode="after")
    @classmethod
    def validate_required_properties(cls, value: str) -> str:
        if not value or not re.fullmatch(r"GRANT[0-9]{8}", value):
            raise SOAPFaultException(
                CONFIRM_APPLICATION_DELIVERY_INVALID_TRACKING_NUMBER_ERR,
                fault=ConfirmApplicationDeliveryInvalidTrackingNumber,
            )
        return value
