from pydantic import Field

from src.legacy_soap_api.grantors.schemas.grants_gov_tracking_number_schema import (
    GrantsGovTrackingNumberRequiredSchema,
)


class ConfirmApplicationDeliveryResponseSOAPEnvelope(GrantsGovTrackingNumberRequiredSchema):
    response_message: str | None = Field(default=None, alias="ResponseMessage")

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return super().to_soap_envelope_dict(f"ns2:{operation_name}")


class ConfirmApplicationDeliveryRequest(GrantsGovTrackingNumberRequiredSchema):
    pass
