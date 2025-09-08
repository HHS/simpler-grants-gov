"""Data models for XML generation service."""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class XMLGenerationRequest(BaseModel):
    """Request model for XML generation."""
    
    application_id: UUID
    application_form_id: UUID
    form_name: str = "SF424_4_0"


class XMLGenerationResponse(BaseModel):
    """Response model for XML generation."""
    
    success: bool
    xml_data: Optional[str] = None
    error_message: Optional[str] = None
