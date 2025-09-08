"""Tests for XML generation service."""

from unittest.mock import Mock, patch
from uuid import uuid4

from src.db.models.competition_models import ApplicationForm
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestXMLGenerationService:
    """Test cases for XMLGenerationService."""

    def test_generate_xml_basic_success(self):
        """Test basic XML generation with simple data."""
        # Mock application form with basic data
        mock_application_form = Mock(spec=ApplicationForm)
        mock_application_form.application_response = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
            "federal_estimated_funding": 50000,
            "certification_agree": True,
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        # Mock database session and query
        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=mock_application_form):
            response = service.generate_xml(mock_db_session, request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements
        xml_data = response.xml_data
        assert "<SF424_4_0" in xml_data
        assert "<SubmissionType>Application</SubmissionType>" in xml_data
        assert "<OrganizationName>Test University</OrganizationName>" in xml_data
        assert "<ProjectTitle>Research Project</ProjectTitle>" in xml_data
        assert "<FederalEstimatedFunding>50000</FederalEstimatedFunding>" in xml_data

    def test_generate_xml_application_form_not_found(self):
        """Test XML generation when application form is not found."""
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=None):
            response = service.generate_xml(mock_db_session, request)

        # Verify error response
        assert response.success is False
        assert response.xml_data is None
        assert "Application form not found" in response.error_message

    def test_generate_xml_no_application_data(self):
        """Test XML generation when application has no response data."""
        mock_application_form = Mock(spec=ApplicationForm)
        mock_application_form.application_response = None

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=mock_application_form):
            response = service.generate_xml(mock_db_session, request)

        # Verify error response
        assert response.success is False
        assert response.xml_data is None
        assert "No application response data found" in response.error_message

    def test_generate_xml_with_namespace(self):
        """Test XML generation includes proper namespace."""
        mock_application_form = Mock(spec=ApplicationForm)
        mock_application_form.application_response = {
            "submission_type": "Application",
            "organization_name": "Test Organization",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=mock_application_form):
            response = service.generate_xml(mock_db_session, request)

        # Verify response and namespace
        assert response.success is True
        xml_data = response.xml_data
        assert 'xmlns="http://apply.grants.gov/forms/SF424_4_0-V4.0"' in xml_data

    def test_generate_xml_handles_none_values(self):
        """Test XML generation properly handles None values."""
        mock_application_form = Mock(spec=ApplicationForm)
        mock_application_form.application_response = {
            "submission_type": "Application",
            "organization_name": None,  # None value should be skipped
            "project_title": "Test Project",
            "federal_estimated_funding": 0,  # Zero should be included
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=mock_application_form):
            response = service.generate_xml(mock_db_session, request)

        # Verify response
        assert response.success is True
        xml_data = response.xml_data

        # Should include non-None values
        assert "<SubmissionType>Application</SubmissionType>" in xml_data
        assert "<ProjectTitle>Test Project</ProjectTitle>" in xml_data
        assert "<FederalEstimatedFunding>0</FederalEstimatedFunding>" in xml_data

        # Should not include None values
        assert "OrganizationName" not in xml_data

    def test_unmapped_fields_excluded(self):
        """Test that unmapped fields are excluded from XML output."""
        mock_application_form = Mock(spec=ApplicationForm)
        mock_application_form.application_response = {
            "submission_type": "Application",
            "organization_name": "Test Org",
            "project_title": "Test Project",
            "unmapped_field": "This should not appear in output",  # Not in field mappings
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_id=uuid4(), application_form_id=uuid4(), form_name="SF424_4_0"
        )

        mock_db_session = Mock()

        with patch.object(service, "_get_application_form", return_value=mock_application_form):
            response = service.generate_xml(mock_db_session, request)

        # Verify response
        assert response.success is True
        xml_data = response.xml_data

        # Verify mapped fields are included
        assert "<SubmissionType>Application</SubmissionType>" in xml_data
        assert "<OrganizationName>Test Org</OrganizationName>" in xml_data
        assert "<ProjectTitle>Test Project</ProjectTitle>" in xml_data

        # Verify unmapped field is excluded
        assert "unmapped_field" not in xml_data
        assert "This should not appear in output" not in xml_data
