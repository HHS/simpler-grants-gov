"""HTTP clients for PDF generation service."""

import abc
import logging
from urllib.parse import urljoin

import docraptor
import requests

from src.services.pdf_generation.config import PdfGenerationConfig
from src.services.pdf_generation.models import PdfGenerationRequest

logger = logging.getLogger(__name__)


class BaseFrontendClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for frontend HTTP clients."""

    @abc.abstractmethod
    def get_application_form_html(self, request: PdfGenerationRequest, token: str) -> str:
        """Get the HTML for an application form from the frontend.

        Args:
            request: The PDF generation request containing application and form IDs
            token: The short-lived authentication token

        Returns:
            HTML content as a string
        """
        pass


class BaseDocRaptorClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for DocRaptor PDF generation clients."""

    @abc.abstractmethod
    def html_to_pdf(self, html_content: str) -> bytes:
        """Convert HTML content to PDF using DocRaptor.

        Args:
            html_content: The HTML content to convert

        Returns:
            PDF data as bytes
        """
        pass


class FrontendClient(BaseFrontendClient):
    """Client for making requests to the frontend sidecar."""

    def __init__(self, config: PdfGenerationConfig | None = None):
        if config is None:
            config = PdfGenerationConfig()
        self.config = config

    def get_application_form_html(self, request: PdfGenerationRequest, token: str) -> str:
        """Get the HTML for an application form from the frontend sidecar."""

        # Construct the frontend URL for the application form
        url_path = f"/print/application/{request.application_id}/form/{request.application_form_id}"
        url = urljoin(self.config.frontend_url, url_path)

        headers = {
            "X-SGG-Internal-Token": token,
            "Accept": "text/html",
        }

        try:
            logger.info(
                "Requesting application form HTML from frontend",
                extra={
                    "application_id": str(request.application_id),
                    "application_form_id": str(request.application_form_id),
                    "url": url,
                },
            )

            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            return response.text

        except requests.exceptions.RequestException:
            logger.exception(
                "Error requesting application form HTML from frontend",
                extra={
                    "application_id": str(request.application_id),
                    "application_form_id": str(request.application_form_id),
                    "url": url,
                },
            )
            raise


class DocRaptorClient(BaseDocRaptorClient):
    """Client for converting HTML to PDF using DocRaptor."""

    def __init__(self, config: PdfGenerationConfig | None = None):
        if config is None:
            config = PdfGenerationConfig()
        self.config = config

    def html_to_pdf(self, html_content: str) -> bytes:
        """Convert HTML content to PDF using DocRaptor."""

        # Initialize DocRaptor API client
        doc_api = docraptor.DocApi()
        doc_api.api_client.configuration.username = self.config.docraptor_api_key

        # Build document request
        doc_request = {
            "test": self.config.docraptor_test_mode,
            "document_type": "pdf",
            "document_content": html_content,
            "prince_options": {
                "media": "print",
                "baseurl": self.config.frontend_url,
                "javascript": self.config.docraptor_enable_javascript,
            },
        }

        try:
            logger.info(
                "Converting HTML to PDF using DocRaptor",
                extra={
                    "test_mode": self.config.docraptor_test_mode,
                    "html_length": len(html_content),
                },
            )

            # Call DocRaptor API
            response = doc_api.create_doc(doc_request)

            # Convert response to bytes
            pdf_bytes = bytearray(response)

            logger.info(
                "Successfully converted HTML to PDF",
                extra={
                    "pdf_size": len(pdf_bytes),
                },
            )

            return bytes(pdf_bytes)

        except docraptor.rest.ApiException as e:
            logger.error(
                "DocRaptor API error",
                extra={
                    "status_code": e.status,
                    "reason": e.reason,
                    "body": e.body if hasattr(e, "body") else None,
                },
            )
            raise
        except Exception:
            logger.exception("Unexpected error calling DocRaptor API")
            raise


class MockFrontendClient(BaseFrontendClient):
    """Mock frontend client for testing."""

    def __init__(self, mock_html: str = "<html><body>Mock Application Form</body></html>"):
        self.mock_html = mock_html

    def get_application_form_html(self, request: PdfGenerationRequest, token: str) -> str:
        """Return mock HTML content."""
        logger.info(
            "Mock frontend client returning test HTML",
            extra={
                "application_id": str(request.application_id),
                "application_form_id": str(request.application_form_id),
            },
        )
        return self.mock_html


class MockDocRaptorClient(BaseDocRaptorClient):
    """Mock DocRaptor client for testing."""

    def __init__(self, mock_pdf_data: bytes = b"Mock PDF content"):
        self.mock_pdf_data = mock_pdf_data

    def html_to_pdf(self, html_content: str) -> bytes:
        """Return mock PDF content."""
        logger.info(
            "Mock DocRaptor client returning test PDF",
            extra={"html_length": len(html_content)},
        )
        return self.mock_pdf_data
