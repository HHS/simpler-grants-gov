from pydantic import Field

from src.legacy_soap_api.legacy_soap_api_schemas import BaseSOAPSchema


class CFDADetails(BaseSOAPSchema):
    number: str | None = Field(default=None, alias="Number")
    title: str | None = Field(default=None, alias="Title")
