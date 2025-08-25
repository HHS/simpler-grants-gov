"""PDF generation service for converting application forms to PDF."""

import logging
from datetime import timedelta
from uuid import UUID

import src.adapters.db as db
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.services.pdf_generation.clients import (
    BaseDocRaptorClient,
    BaseFrontendClient,
    DocRaptorClient,
    FrontendClient,
    MockDocRaptorClient,
    MockFrontendClient,
)
from src.services.pdf_generation.config import PdfGenerationConfig, get_config
from src.services.pdf_generation.models import PdfGenerationRequest, PdfGenerationResponse
from src.util import datetime_util

logger = logging.getLogger(__name__)


class PdfGenerationService:
    """Service for generating PDFs from application forms."""

    def __init__(
        self,
        config: PdfGenerationConfig | None = None,
        frontend_client: BaseFrontendClient | None = None,
        docraptor_client: BaseDocRaptorClient | None = None,
    ):
        if config is None:
            config = get_config()
        self.config = config

        if frontend_client is None:
            frontend_client = FrontendClient(config)
        self.frontend_client = frontend_client

        if docraptor_client is None:
            docraptor_client = DocRaptorClient(config)
        self.docraptor_client = docraptor_client

    def generate_pdf(
        self, db_session: db.Session, request: PdfGenerationRequest, token: str | None = None
    ) -> PdfGenerationResponse:
        """Generate a PDF for an application form.

        Args:
            db_session: Database session for creating short-lived tokens
            request: PDF generation request with application and form IDs
            token: Optional pre-generated token (avoids DB transaction conflicts)

        Returns:
            PdfGenerationResponse with raw PDF bytes ready for task consumption
        """
        try:
            logger.info(
                "Starting PDF generation",
                extra={
                    "application_id": str(request.application_id),
                    "application_form_id": str(request.application_form_id),
                },
            )

            # Step 1: Use provided token or generate one
            if token is None:
                if isinstance(self.frontend_client, MockFrontendClient):
                    token = "mock-token"  # Mock clients don't need real tokens
                else:
                    token = self._generate_short_lived_token(db_session)

            # Step 2: Get HTML from frontend
            html_content = self.frontend_client.get_application_form_html(request, token)

            # Step 3: Convert HTML to PDF using DocRaptor
            pdf_data = self.docraptor_client.html_to_pdf(html_content)

            logger.info(
                "Successfully generated PDF",
                extra={
                    "application_id": str(request.application_id),
                    "application_form_id": str(request.application_form_id),
                    "pdf_size_bytes": len(pdf_data),
                },
            )

            return PdfGenerationResponse(pdf_data=pdf_data, success=True)

        except Exception as e:
            logger.exception(
                "Error generating PDF",
                extra={
                    "application_id": str(request.application_id),
                    "application_form_id": str(request.application_form_id),
                },
            )

            return PdfGenerationResponse(
                pdf_data=b"",
                success=False,
                error_message=str(e),
            )

    def _generate_short_lived_token(self, db_session: db.Session) -> str:
        """Generate a short-lived JWT token for frontend authentication."""

        # Calculate expiration time
        expires_at = datetime_util.utcnow() + timedelta(
            minutes=self.config.short_lived_token_expiration_minutes
        )

        # Create the JWT token and database record
        token, short_lived_token = create_jwt_for_internal_token(
            expires_at=expires_at, db_session=db_session
        )

        logger.info(
            "Generated short-lived token for PDF generation",
            extra={
                "token_id": str(short_lived_token.short_lived_internal_token_id),
                "expires_at": expires_at.isoformat(),
            },
        )

        return token


def create_pdf_generation_service(
    config: PdfGenerationConfig | None = None,
    use_mocks: bool = False,
) -> PdfGenerationService:
    """Factory function to create a PDF generation service.

    Args:
        config: Optional configuration override
        use_mocks: Whether to use mock clients for testing

    Returns:
        Configured PdfGenerationService instance
    """
    if config is None:
        config = get_config()

    frontend_client = MockFrontendClient() if use_mocks else FrontendClient(config)
    docraptor_client = MockDocRaptorClient() if use_mocks else DocRaptorClient(config)

    return PdfGenerationService(
        config=config,
        frontend_client=frontend_client,
        docraptor_client=docraptor_client,
    )


def generate_application_form_pdf(
    db_session: db.Session,
    application_id: UUID,
    application_form_id: UUID,
    use_mocks: bool = False,
    token: str | None = None,
) -> PdfGenerationResponse:
    """Convenience function to generate a PDF for an application form.

    This service generates PDF bytes that can be consumed by tasks (e.g., for zip files).
    The service handles frontend rendering and DocRaptor conversion, returning raw PDF data.

    Args:
        db_session: Database session
        application_id: UUID of the application
        application_form_id: UUID of the application form
        use_mocks: Whether to use mock clients for testing
        token: Optional pre-generated token (for batch operations)

    Returns:
        PdfGenerationResponse with PDF bytes ready for consumption by tasks
    """
    service = create_pdf_generation_service(use_mocks=use_mocks)
    request = PdfGenerationRequest(
        application_id=application_id,
        application_form_id=application_form_id,
    )

    return service.generate_pdf(db_session, request, token)
