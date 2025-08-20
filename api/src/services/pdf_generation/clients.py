"""HTTP clients for PDF generation service."""

import abc
import logging
from urllib.parse import urljoin

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
        url = urljoin(self.config.frontend_sidecar_url, url_path)

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

        # DocRaptor API endpoint
        url = "https://docraptor.com/docs"

        # Request payload for DocRaptor
        payload = {
            "doc": {
                "document_content": html_content,
                "document_type": "pdf",
                "test": self.config.docraptor_test_mode,
                "prince_options": {
                    "media": "print",
                    "baseurl": self.config.frontend_sidecar_url,
                },
            }
        }

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "simpler-grants-gov-pdf-generator/1.0",
        }

        # Use API key authentication
        auth = (self.config.docraptor_api_key, "")

        try:
            logger.info(
                "Converting HTML to PDF using DocRaptor",
                extra={
                    "test_mode": self.config.docraptor_test_mode,
                    "html_length": len(html_content),
                },
            )

            response = requests.post(url, json=payload, headers=headers, auth=auth, timeout=60)
            response.raise_for_status()

            return response.content

        except requests.exceptions.RequestException as e:
            logger.error(
                "Error converting HTML to PDF using DocRaptor",
                extra={
                    "error": str(e),
                    "html_length": len(html_content),
                },
            )
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
