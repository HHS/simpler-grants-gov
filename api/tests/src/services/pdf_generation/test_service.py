"""Tests for PDF generation service."""

import uuid
from datetime import datetime
from unittest.mock import Mock, patch

from freezegun import freeze_time

from src.services.pdf_generation.clients import MockDocRaptorClient, MockFrontendClient
from src.services.pdf_generation.config import PdfGenerationConfig
from src.services.pdf_generation.models import PdfGenerationRequest, PdfGenerationResponse
from src.services.pdf_generation.service import (
    PdfGenerationService,
    create_pdf_generation_service,
    generate_application_form_pdf,
)


class TestPdfGenerationService:
    """Tests for the PdfGenerationService."""

    def test_init_with_default_config(self, monkeypatch):
        """Test service initialization with configuration from environment."""
        env_vars = {
            "FRONTEND_URL": "http://localhost:3000",
            "DOCRAPTOR_API_KEY": "test-key",
            "DOCRAPTOR_TEST_MODE": "true",
            "DOCRAPTOR_API_URL": "https://docraptor.com/docs",
            "SHORT_LIVED_TOKEN_EXPIRATION_MINUTES": "15",
            "PDF_GENERATION_USE_MOCKS": "false",
        }

        for key, value in env_vars.items():
            monkeypatch.setenv(key, value)

        service = PdfGenerationService()

        assert isinstance(service.config, PdfGenerationConfig)
        assert service.config.frontend_url == "http://localhost:3000"

    def test_init_with_custom_config(self):
        """Test service initialization with custom configuration."""
        config = PdfGenerationConfig(
            frontend_url="http://test:8080",
            docraptor_api_key="test-key",
            docraptor_test_mode=False,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=30,
            pdf_generation_use_mocks=True,
        )
        service = PdfGenerationService(config)
        assert service.config.frontend_url == "http://test:8080"
        assert service.config.docraptor_test_mode is False

    def test_init_with_custom_clients(self):
        """Test service initialization with custom clients."""
        mock_frontend = MockFrontendClient()
        mock_docraptor = MockDocRaptorClient()

        service = PdfGenerationService(
            frontend_client=mock_frontend,
            docraptor_client=mock_docraptor,
        )

        assert service.frontend_client == mock_frontend
        assert service.docraptor_client == mock_docraptor

    @freeze_time("2024-01-01 12:00:00")
    @patch("src.services.pdf_generation.service.create_jwt_for_internal_token")
    def test_generate_short_lived_token(self, mock_create_jwt, db_session):
        """Test short-lived token generation."""
        # Setup
        service = PdfGenerationService()

        # Mock the db_session.commit method
        mock_db_session = Mock()
        mock_db_session.commit = Mock()

        mock_token = "mock-jwt-token"
        mock_short_lived_token = Mock()
        mock_short_lived_token.short_lived_internal_token_id = uuid.uuid4()
        mock_create_jwt.return_value = (mock_token, mock_short_lived_token)

        # Execute
        result = service._generate_short_lived_token(mock_db_session)

        # Verify
        assert result == mock_token
        mock_create_jwt.assert_called_once()

        # Check the expiration time
        call_args = mock_create_jwt.call_args
        expires_at = call_args[1]["expires_at"]
        expected_expires_at = datetime(
            2024, 1, 1, 13, 0, 0, tzinfo=expires_at.tzinfo
        )  # 60 minutes later with same timezone
        assert expires_at == expected_expires_at

        # Note: commit is no longer called within the token generation function
        mock_db_session.commit.assert_not_called()

    def test_generate_pdf_success(self, db_session):
        """Test successful PDF generation."""
        # Setup
        mock_frontend = MockFrontendClient(
            mock_html="<html><body>Test Application Form</body></html>"
        )
        mock_docraptor = MockDocRaptorClient(mock_pdf_data=b"Test PDF content")

        service = PdfGenerationService(
            frontend_client=mock_frontend,
            docraptor_client=mock_docraptor,
        )

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with patch.object(service, "_generate_short_lived_token") as mock_token:
            mock_token.return_value = "test-token"

            # Execute
            result = service.generate_pdf(db_session, request)

        # Verify
        assert isinstance(result, PdfGenerationResponse)
        assert result.success is True
        assert result.pdf_data == b"Test PDF content"
        assert result.error_message is None

    def test_generate_pdf_frontend_error(self, db_session):
        """Test PDF generation with frontend error."""
        # Setup
        mock_frontend = Mock()
        mock_frontend.get_application_form_html.side_effect = Exception("Frontend error")
        mock_docraptor = MockDocRaptorClient()

        service = PdfGenerationService(
            frontend_client=mock_frontend,
            docraptor_client=mock_docraptor,
        )

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with patch.object(service, "_generate_short_lived_token") as mock_token:
            mock_token.return_value = "test-token"

            # Execute
            result = service.generate_pdf(db_session, request)

        # Verify
        assert isinstance(result, PdfGenerationResponse)
        assert result.success is False
        assert result.pdf_data == b""
        assert "Frontend error" in result.error_message

    def test_generate_pdf_docraptor_error(self, db_session):
        """Test PDF generation with DocRaptor error."""
        # Setup
        mock_frontend = MockFrontendClient()
        mock_docraptor = Mock()
        mock_docraptor.html_to_pdf.side_effect = Exception("DocRaptor error")

        service = PdfGenerationService(
            frontend_client=mock_frontend,
            docraptor_client=mock_docraptor,
        )

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with patch.object(service, "_generate_short_lived_token") as mock_token:
            mock_token.return_value = "test-token"

            # Execute
            result = service.generate_pdf(db_session, request)

        # Verify
        assert isinstance(result, PdfGenerationResponse)
        assert result.success is False
        assert result.pdf_data == b""
        assert "DocRaptor error" in result.error_message

    def test_generate_pdf_token_error(self, db_session):
        """Test PDF generation with token generation error."""
        service = PdfGenerationService()

        request = PdfGenerationRequest(
            application_id=uuid.uuid4(),
            application_form_id=uuid.uuid4(),
        )

        with patch.object(service, "_generate_short_lived_token") as mock_token:
            mock_token.side_effect = Exception("Token error")

            # Execute
            result = service.generate_pdf(db_session, request)

        # Verify
        assert isinstance(result, PdfGenerationResponse)
        assert result.success is False
        assert result.pdf_data == b""
        assert "Token error" in result.error_message


class TestFactoryFunctions:
    """Tests for factory functions."""

    def test_create_pdf_generation_service_default(self):
        """Test creating service with default settings."""
        service = create_pdf_generation_service()
        assert isinstance(service, PdfGenerationService)
        assert isinstance(service.config, PdfGenerationConfig)

    def test_create_pdf_generation_service_with_mocks(self):
        """Test creating service with mock clients."""
        service = create_pdf_generation_service(use_mocks=True)
        assert isinstance(service.frontend_client, MockFrontendClient)
        assert isinstance(service.docraptor_client, MockDocRaptorClient)

    def test_create_pdf_generation_service_with_config(self):
        """Test creating service with custom config."""
        config = PdfGenerationConfig(
            frontend_url="http://custom:8080",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=15,
            pdf_generation_use_mocks=False,
        )
        service = create_pdf_generation_service(config=config)
        assert service.config.frontend_url == "http://custom:8080"

    def test_generate_application_form_pdf_convenience_function(self, db_session):
        """Test the convenience function for PDF generation."""
        app_id = uuid.uuid4()
        form_id = uuid.uuid4()

        with patch(
            "src.services.pdf_generation.service.create_pdf_generation_service"
        ) as mock_create:
            mock_service = Mock()
            mock_response = PdfGenerationResponse(
                pdf_data=b"Test PDF",
                success=True,
            )
            mock_service.generate_pdf.return_value = mock_response
            mock_create.return_value = mock_service

            # Execute
            result = generate_application_form_pdf(
                db_session=db_session,
                application_id=app_id,
                application_form_id=form_id,
                use_mocks=True,
            )

            # Verify
            assert result == mock_response
            mock_create.assert_called_once_with(use_mocks=True)
            mock_service.generate_pdf.assert_called_once()

            # Check the request object
            call_args = mock_service.generate_pdf.call_args
            request = call_args[0][1]  # Second argument is the request
            assert request.application_id == app_id
            assert request.application_form_id == form_id
