import dataclasses
from typing import Any, Optional

from src.pagination.pagination_models import PaginationInfo


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
    data: Optional[Any] = None
    warnings: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)
    errors: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)
    status_code: int = 200

    pagination_info: PaginationInfo | None = None
