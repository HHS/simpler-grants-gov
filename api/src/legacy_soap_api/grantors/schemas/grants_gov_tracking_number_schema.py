import re

from pydantic import Field, field_validator

from src.legacy_soap_api.grantors.fault_messages import (
    InvalidGrantsGovTrackingNumber,
    MissingGrantsGovTrackingNumber,
)
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

INVALID_TRACKING_NUMBER_ERR = "Invalid grants_gov_tracking_number provided."
MISSING_TRACKING_NUMBER_ERR = "GrantsGovTrackingNumber is a required value."


class GrantsGovTrackingNumberRequiredSchema(BaseSOAPSchema):
    grants_gov_tracking_number: str | None = Field(alias="GrantsGovTrackingNumber")

    @field_validator("grants_gov_tracking_number", mode="after")
    @classmethod
    def validate_grants_gov_tracking_number(cls, value: str | None) -> str:
        if not value:
            raise SOAPFaultException(
                message=MISSING_TRACKING_NUMBER_ERR, fault=MissingGrantsGovTrackingNumber
            )

        if not re.fullmatch(r"GRANT[0-9]{8}", value):
            raise SOAPFaultException(
                message=INVALID_TRACKING_NUMBER_ERR, fault=InvalidGrantsGovTrackingNumber
            )
        return value
