"""Models for PDF generation service."""

from dataclasses import dataclass
from uuid import UUID


@dataclass
class PdfGenerationRequest:
    """Request object for PDF generation."""

    application_id: UUID
    application_form_id: UUID


@dataclass
class PdfGenerationResponse:
    """Response object for PDF generation."""

    pdf_data: bytes
    success: bool
    error_message: str | None = None
