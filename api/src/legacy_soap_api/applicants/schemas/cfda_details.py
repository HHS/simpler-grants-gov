from pydantic import BaseModel, Field


class CFDADetails(BaseModel):
    number: str | None = Field(default=None, alias="Number")
    title: str | None = Field(default=None, alias="Title")
