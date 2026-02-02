"""Models for XML generation."""

from typing import Any

from pydantic import BaseModel


class XMLGenerationRequest(BaseModel):
    """Request model for XML generation."""

    application_data: dict[str, Any]
    transform_config: dict[str, Any]
    pretty_print: bool = True
    attachment_mapping: dict[str, Any] | None = None


class XMLGenerationResponse(BaseModel):
    """Response model for XML generation."""

    success: bool
    xml_data: str | None = None
    error_message: str | None = None


__all__ = [
    "XMLGenerationRequest",
    "XMLGenerationResponse",
]
