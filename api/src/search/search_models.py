from datetime import date
from uuid import UUID

from pydantic import BaseModel


class StrSearchFilter(BaseModel):
    one_of: list[str] | None = None


class BoolSearchFilter(BaseModel):
    one_of: list[bool] | None = None


class IntSearchFilter(BaseModel):
    min: int | None = None
    max: int | None = None


class DateSearchFilter(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    start_date_relative: int | None = None
    end_date_relative: int | None = None


class UuidSearchFilter(BaseModel):
    one_of: list[UUID] | None = None
