"""Tests for PDF generation clients."""

import uuid
from unittest.mock import Mock, patch

import pytest
import requests

from src.services.pdf_generation.clients import (
    DocRaptorClient,
    FrontendClient,
    MockDocRaptorClient,
    MockFrontendClient,
)
from src.services.pdf_generation.config import PdfGenerationConfig
from src.services.pdf_generation.models import PdfGenerationRequest


class TestFrontendClient:
    """Tests for the FrontendClient."""

    def test_init_with_config(self):
        """Test frontend client initialization with custom config."""
        config = PdfGenerationConfig(
            frontend_sidecar_url="http://test:8080",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=15,
        )
        client = FrontendClient(config)
        assert client.config.frontend_sidecar_url == "http://test:8080"

    def test_init_without_config(self, monkeypatch):
        """Test frontend client initialization with config from environment."""
        env_vars = {
            "FRONTEND_SIDECAR_URL": "http://localhost:3000",
            "DOCRAPTOR_API_KEY": "test-key",
            "DOCRAPTOR_TEST_MODE": "true",
            "DOCRAPTOR_API_URL": "https://docraptor.com/docs",
            "SHORT_LIVED_TOKEN_EXPIRATION_MINUTES": "15",
        }

        for key, value in env_vars.items():
            monkeypatch.setenv(key, value)

        client = FrontendClient()

        assert client.config.frontend_sidecar_url == "http://localhost:3000"

    @patch("src.services.pdf_generation.clients.requests.get")
    def test_get_application_form_html_success(self, mock_get):
        """Test successful HTML retrieval from frontend."""
        # Setup
        config = PdfGenerationConfig(
            frontend_sidecar_url="http://test:3000",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=15,
        )
        client = FrontendClient(config)

        mock_response = Mock()
        mock_response.text = "<html><body>Test Form</body></html>"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )
        token = "test-token"

        # Execute
        result = client.get_application_form_html(request, token)

        # Verify
        assert result == "<html><body>Test Form</body></html>"
        mock_get.assert_called_once()

        # Check the call arguments
        call_args = mock_get.call_args
        expected_url = (
            f"http://test:3000/print/application/{request.application_id}"
            f"/form/{request.application_form_id}"
        )
        assert call_args[0][0] == expected_url
        assert call_args[1]["headers"]["X-SGG-Internal-Token"] == "test-token"
        assert call_args[1]["headers"]["Accept"] == "text/html"

    @patch("src.services.pdf_generation.clients.requests.get")
    def test_get_application_form_html_http_error(self, mock_get):
        """Test HTTP error handling in frontend client."""
        client = FrontendClient()

        mock_get.side_effect = requests.exceptions.HTTPError("404 Not Found")

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with pytest.raises(requests.exceptions.HTTPError):
            client.get_application_form_html(request, "test-token")

    @patch("src.services.pdf_generation.clients.requests.get")
    def test_get_application_form_html_timeout(self, mock_get):
        """Test timeout handling in frontend client."""
        client = FrontendClient()

        mock_get.side_effect = requests.exceptions.Timeout("Request timed out")

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with pytest.raises(requests.exceptions.Timeout):
            client.get_application_form_html(request, "test-token")


class TestDocRaptorClient:
    """Tests for the DocRaptorClient."""

    def test_init_with_config(self):
        """Test DocRaptor client initialization with custom config."""
        config = PdfGenerationConfig(
            frontend_sidecar_url="http://localhost:3000",
            docraptor_api_key="test-key",
            docraptor_test_mode=False,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=15,
        )
        client = DocRaptorClient(config)
        assert client.config.docraptor_api_key == "test-key"
        assert client.config.docraptor_test_mode is False

    @patch("src.services.pdf_generation.clients.requests.post")
    def test_html_to_pdf_success(self, mock_post):
        """Test successful PDF conversion."""
        config = PdfGenerationConfig(
            frontend_sidecar_url="http://test:3000",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=15,
        )
        client = DocRaptorClient(config)

        mock_response = Mock()
        mock_response.content = b"Mock PDF content"
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        html_content = "<html><body>Test</body></html>"

        # Execute
        result = client.html_to_pdf(html_content)

        # Verify
        assert result == b"Mock PDF content"
        mock_post.assert_called_once()

        # Check the call arguments
        call_args = mock_post.call_args
        assert "docs" in call_args[0][0]  # URL contains docs endpoint

        # Check request payload
        payload = call_args[1]["json"]
        assert payload["doc"]["document_content"] == html_content
        assert payload["doc"]["document_type"] == "pdf"
        assert payload["doc"]["test"] is True
        assert payload["doc"]["prince_options"]["baseurl"] == "http://test:3000"

        # Check authentication
        assert call_args[1]["auth"] == ("test-key", "")

    @patch("src.services.pdf_generation.clients.requests.post")
    def test_html_to_pdf_http_error(self, mock_post):
        """Test HTTP error handling in DocRaptor client."""
        client = DocRaptorClient()

        mock_post.side_effect = requests.exceptions.HTTPError("API Error")

        with pytest.raises(requests.exceptions.HTTPError):
            client.html_to_pdf("<html><body>Test</body></html>")

    @patch("src.services.pdf_generation.clients.requests.post")
    def test_html_to_pdf_connection_error(self, mock_post):
        """Test connection error handling in DocRaptor client."""
        client = DocRaptorClient()

        mock_post.side_effect = requests.exceptions.ConnectionError("Connection failed")

        with pytest.raises(requests.exceptions.ConnectionError):
            client.html_to_pdf("<html><body>Test</body></html>")


class TestMockFrontendClient:
    """Tests for the MockFrontendClient."""

    def test_default_html(self):
        """Test mock frontend client with default HTML."""
        client = MockFrontendClient()
        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        result = client.get_application_form_html(request, "test-token")
        assert result == "<html><body>Mock Application Form</body></html>"

    def test_custom_html(self):
        """Test mock frontend client with custom HTML."""
        custom_html = "<html><body>Custom Mock</body></html>"
        client = MockFrontendClient(mock_html=custom_html)

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        result = client.get_application_form_html(request, "test-token")
        assert result == custom_html


class TestMockDocRaptorClient:
    """Tests for the MockDocRaptorClient."""

    def test_default_pdf_data(self):
        """Test mock DocRaptor client with default PDF data."""
        client = MockDocRaptorClient()

        result = client.html_to_pdf("<html><body>Test</body></html>")
        assert result == b"Mock PDF content"

    def test_custom_pdf_data(self):
        """Test mock DocRaptor client with custom PDF data."""
        custom_pdf = b"Custom PDF content"
        client = MockDocRaptorClient(mock_pdf_data=custom_pdf)

        result = client.html_to_pdf("<html><body>Test</body></html>")
        assert result == custom_pdf
