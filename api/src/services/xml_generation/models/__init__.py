"""Models for XML generation."""

from typing import Any

from pydantic import BaseModel

from .attachment import AttachmentData, AttachmentFile, AttachmentGroup


class XMLGenerationRequest(BaseModel):
    """Request model for XML generation."""

    application_data: dict[str, Any]
    form_name: str = "SF424_4_0"
    pretty_print: bool = True


class XMLGenerationResponse(BaseModel):
    """Response model for XML generation."""

    success: bool
    xml_data: str | None = None
    error_message: str | None = None


__all__ = [
    "AttachmentData",
    "AttachmentFile",
    "AttachmentGroup",
    "XMLGenerationRequest",
    "XMLGenerationResponse",
]
