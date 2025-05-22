from pydantic import Field, model_validator
from typing_extensions import Self

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

from .opportunity_filter import OpportunityFilter

GET_OPPORTUNITY_LIST_REQUEST_ERR = "No package_id or opportunity_filter provided."


class GetOpportunityListRequest(BaseSOAPSchema):
    package_id: str | None = Field(default=None, alias="PackageID")
    opportunity_filter: OpportunityFilter | None = Field(default=None, alias="OpportunityFilter")

    @model_validator(mode="after")
    def validate_required_properties(self) -> Self:
        if not any([self.package_id, self.opportunity_filter]):
            raise SOAPFaultException(
                GET_OPPORTUNITY_LIST_REQUEST_ERR,
                fault=OpportunityListRequestInvalidParams,
            )
        return self
