from datetime import date
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class StrSearchFilter(BaseModel):
    # str | StrEnum keeps Pydantic from converting
    # something that is a StrEnum to just a string
    # helping preserve the type where relevant like
    # when we do a SQLAlchemy where clause
    one_of: list[str | StrEnum] | None = None


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
