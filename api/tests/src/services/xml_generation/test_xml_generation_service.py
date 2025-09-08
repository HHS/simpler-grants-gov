"""Tests for XML generation service."""

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestXMLGenerationService:
    """Test cases for XMLGenerationService."""

    def test_generate_xml_basic_success(self):
        """Test basic XML generation with simple data."""
        # Test data
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
            "federal_estimated_funding": 50000,
            "certification_agree": True,
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

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

    def test_generate_xml_no_application_data(self):
        """Test XML generation when no application data is provided."""
        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data={}, form_name="SF424_4_0")

        response = service.generate_xml(request)

        # Verify error response
        assert response.success is False
        assert response.xml_data is None
        assert "No application data provided" in response.error_message

    def test_generate_xml_with_none_application_data(self):
        """Test XML generation when application data is None (validation error)."""
        from pydantic import ValidationError

        # Pydantic should prevent None values for application_data
        try:
            XMLGenerationRequest(
                application_data=None, form_name="SF424_4_0"  # type: ignore[arg-type]
            )
            raise AssertionError("Expected ValidationError for None application_data")
        except ValidationError as e:
            # Verify that Pydantic correctly validates the input
            assert "dict_type" in str(e)
            assert "application_data" in str(e)

    def test_generate_xml_with_namespace(self):
        """Test XML generation includes proper namespace."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test Organization",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

        # Verify response and namespace
        assert response.success is True
        xml_data = response.xml_data
        assert 'xmlns="http://apply.grants.gov/forms/SF424_4_0-V4.0"' in xml_data

    def test_generate_xml_handles_none_values(self):
        """Test XML generation properly handles None values."""
        application_data = {
            "submission_type": "Application",
            "organization_name": None,  # None value should be skipped
            "project_title": "Test Project",
            "federal_estimated_funding": 0,  # Zero should be included
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

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
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test Org",
            "project_title": "Test Project",
            "unmapped_field": "This should not appear in output",  # Not in field mappings
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

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

    def test_generate_xml_with_nested_address(self):
        """Test XML generation with nested address structure."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "applicant_address": {
                "address_line_1": "123 Main Street",
                "address_line_2": "Suite 100",
                "city": "Washington",
                "county": "District of Columbia",
                "state_code": "DC",
                "country_code": "US",
                "zip_code": "20001-1234",
            },
            "project_title": "Research Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        xml_data = response.xml_data

        # Verify nested address structure is created correctly
        assert "<Applicant>" in xml_data
        assert "<Street1>123 Main Street</Street1>" in xml_data
        assert "<Street2>Suite 100</Street2>" in xml_data
        assert "<City>Washington</City>" in xml_data
        assert "<County>District of Columbia</County>" in xml_data
        assert "<State>DC</State>" in xml_data
        assert "<Country>US</Country>" in xml_data
        assert "<ZipPostalCode>20001-1234</ZipPostalCode>" in xml_data
        assert "</Applicant>" in xml_data
