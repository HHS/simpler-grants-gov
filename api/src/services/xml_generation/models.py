"""Data models for XML generation service."""

from typing import Any

from pydantic import BaseModel


class XMLGenerationRequest(BaseModel):
    """Request model for XML generation."""

    application_data: dict[str, Any]
    form_name: str = "SF424_4_0"


class XMLGenerationResponse(BaseModel):
    """Response model for XML generation."""

    success: bool
    xml_data: str | None = None
    error_message: str | None = None
