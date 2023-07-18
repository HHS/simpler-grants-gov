import dataclasses
from typing import Optional

from src.api.schemas import response_schema
from src.db.models.base import Base


@dataclasses.dataclass
class ValidationErrorDetail:
    type: str
    message: str = ""
    rule: Optional[str] = None
    field: Optional[str] = None
    value: Optional[str] = None  # Do not store PII data here, as it gets logged in some cases


class ValidationException(Exception):
    __slots__ = ["errors", "message", "data"]

    def __init__(
        self,
        errors: list[ValidationErrorDetail],
        message: str = "Invalid request",
        data: Optional[dict | list[dict]] = None,
    ):
        self.errors = errors
        self.message = message
        self.data = data or {}


@dataclasses.dataclass
class ApiResponse:
    """Base response model for all API responses."""

    message: str
    data: Optional[Base] = None
    warnings: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)
    errors: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)

    # This method is used to convert ApiResponse objects to a dictionary
    # This is necessary because APIFlask has a bug that causes an exception to be
    # thrown when returning objects from routes when BASE_RESPONSE_SCHEMA is set
    # (See https://github.com/apiflask/apiflask/issues/384)
    # Once that issue is fixed, this method can be removed and routes can simply
    # return ApiResponse objects directly and allow APIFlask to serealize the objects
    # to JSON automatically.
    def asdict(self) -> dict:
        return response_schema.ResponseSchema().dump(self)
