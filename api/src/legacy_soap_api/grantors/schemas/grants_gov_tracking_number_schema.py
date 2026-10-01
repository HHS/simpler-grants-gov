import re

from pydantic import Field, field_validator, model_validator

from src.legacy_soap_api.grantors.fault_messages import (
    InvalidGrantsGovTrackingNumber,
    MissingGrantsGovTrackingNumber,
)
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

INVALID_TRACKING_NUMBER_ERR = "Invalid grants_gov_tracking_number provided."
MISSING_TRACKING_NUMBER_ERR = "GrantsGovTrackingNumber is a required value."


class GrantsGovTrackingNumberRequiredSchema(BaseSOAPSchema):
    grants_gov_tracking_number: str = Field(alias="GrantsGovTrackingNumber")

    @model_validator(mode="before")
    @classmethod
    def check_tag_present(cls, data: dict) -> dict:
        if "grants_gov_tracking_number" in data or "GrantsGovTrackingNumber" in data:
            return data
        else:
            raise SOAPFaultException(
                message=MISSING_TRACKING_NUMBER_ERR, fault=MissingGrantsGovTrackingNumber
            )

    @field_validator("grants_gov_tracking_number", mode="before")
    @classmethod
    def validate_grants_gov_tracking_number(cls, value: str) -> str:
        if not isinstance(value, str) or not re.fullmatch(r"GRANT[0-9]{8}", value):
            raise SOAPFaultException(
                message=INVALID_TRACKING_NUMBER_ERR, fault=InvalidGrantsGovTrackingNumber
            )
        return value

    @field_validator("grants_gov_tracking_number", mode="before")
    @classmethod
    def get_value_from_dict(cls, value: str | dict) -> str | None:
        if isinstance(value, dict):
            return value.get("#text")
        else:
            return value
