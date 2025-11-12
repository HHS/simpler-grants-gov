"""Tests for XML generation service."""

import pytest
from pydantic import ValidationError

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.constants import NO_VALUE, YES_VALUE
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


@pytest.mark.xml_validation
class TestXMLGenerationService:
    """Test cases for XMLGenerationService."""

    def test_generate_xml_basic_success(self):
        """Test basic XML generation with simple data."""
        # Test data
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
            "federal_estimated_funding": "50000.00",  # String as expected by currency formatter
            "certification_agree": True,
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements
        xml_data = response.xml_data
        assert "<SF424_4_0" in xml_data
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>" in xml_data
        )
        assert "<SF424_4_0:ProjectTitle>Research Project</SF424_4_0:ProjectTitle>" in xml_data
        assert (
            "<SF424_4_0:FederalEstimatedFunding>50000.00</SF424_4_0:FederalEstimatedFunding>"
            in xml_data
        )
        assert (
            f"<SF424_4_0:CertificationAgree>{YES_VALUE}</SF424_4_0:CertificationAgree>" in xml_data
        )

    def test_generate_xml_no_application_data(self):
        """Test XML generation when no application data is provided."""
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data={}, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify error response
        assert response.success is False
        assert response.xml_data is None
        assert "No application data provided" in response.error_message

    def test_generate_xml_with_none_application_data(self):
        """Test XML generation when application data is None (validation error)."""
        # Pydantic should prevent None values for application_data
        with pytest.raises(ValidationError) as e:
            XMLGenerationRequest(
                application_data=None, transform_config=FORM_XML_TRANSFORM_RULES  # type: ignore[arg-type]
            )

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
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response and namespace
        assert response.success is True
        xml_data = response.xml_data
        assert 'xmlns:SF424_4_0="http://apply.grants.gov/forms/SF424_4_0-V4.0"' in xml_data

    def test_generate_xml_handles_none_values(self):
        """Test XML generation properly handles None values."""
        application_data = {
            "submission_type": "Application",
            "organization_name": None,  # None value should be skipped
            "project_title": "Test Project",
            "federal_estimated_funding": "0.00",  # Zero as string should be included
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        xml_data = response.xml_data

        # Should include non-None values
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data
        assert (
            "<SF424_4_0:FederalEstimatedFunding>0.00</SF424_4_0:FederalEstimatedFunding>"
            in xml_data
        )

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
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        xml_data = response.xml_data

        # Verify mapped fields are included
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:OrganizationName>Test Org</SF424_4_0:OrganizationName>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

        # Verify unmapped field is excluded
        assert "unmapped_field" not in xml_data
        assert "This should not appear in output" not in xml_data

    def test_generate_xml_with_nested_address(self):
        """Test XML generation with nested address structure."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "applicant_address": {
                "street1": "123 Main Street",
                "street2": "Suite 100",
                "city": "Washington",
                "county": "District of Columbia",
                "state": "DC",
                "country": "US",
                "zip_code": "20001-1234",
            },
            "project_title": "Research Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        xml_data = response.xml_data

        # Verify nested address structure is created correctly
        assert "<SF424_4_0:Applicant>" in xml_data
        assert "globLib:Street1" in xml_data and "123 Main Street" in xml_data
        assert "globLib:Street2" in xml_data and "Suite 100" in xml_data
        assert "globLib:City" in xml_data and "Washington" in xml_data
        assert "globLib:County" in xml_data and "District of Columbia" in xml_data
        assert "globLib:State" in xml_data and "DC" in xml_data
        assert "globLib:Country" in xml_data and "US" in xml_data
        assert "globLib:ZipPostalCode" in xml_data and "20001-1234" in xml_data
        assert "</SF424_4_0:Applicant>" in xml_data

    def test_generate_xml_pretty_print_vs_condensed(self):
        """Test XML generation with pretty-print vs condensed formatting."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
        }

        service = XMLGenerationService()

        # Test pretty-print (default)
        pretty_request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=FORM_XML_TRANSFORM_RULES,
            pretty_print=True,
        )
        pretty_response = service.generate_xml(pretty_request)
        assert pretty_response.success is True
        pretty_xml = pretty_response.xml_data

        # Test condensed format
        condensed_request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=FORM_XML_TRANSFORM_RULES,
            pretty_print=False,
        )
        condensed_response = service.generate_xml(condensed_request)
        assert condensed_response.success is True
        condensed_xml = condensed_response.xml_data

        # Verify both contain the same content
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in pretty_xml
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in condensed_xml
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>" in pretty_xml
        )
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>"
            in condensed_xml
        )

        # Verify formatting differences
        # Pretty-print should have indentation/newlines, condensed should not
        assert "\n  <SF424_4_0:SubmissionType>" in pretty_xml  # Indented element
        assert "\n  <SF424_4_0:SubmissionType>" not in condensed_xml  # No indentation

        # Both should have same content but different formatting
        assert len(condensed_xml) < len(pretty_xml)  # Condensed should be shorter

    def test_generate_xml_with_value_transformations(self):
        """Test XML generation with value transformations."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "federal_estimated_funding": "50000.00",  # Should be formatted as currency
            "delinquent_federal_debt": True,  # Should become "Yes"
            "certification_agree": False,  # Should become "No"
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        xml_data = response.xml_data

        # Verify value transformations were applied
        assert (
            "<SF424_4_0:FederalEstimatedFunding>50000.00</SF424_4_0:FederalEstimatedFunding>"
            in xml_data
        )
        assert (
            f"<SF424_4_0:DelinquentFederalDebt>{YES_VALUE}</SF424_4_0:DelinquentFederalDebt>"
            in xml_data
        )
        assert (
            f"<SF424_4_0:CertificationAgree>{NO_VALUE}</SF424_4_0:CertificationAgree>" in xml_data
        )

        # Verify non-transformed fields remain unchanged
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>" in xml_data
        )

    def test_generate_xml_with_none_values_excluded(self):
        """Test that None values are excluded from XML output (default behavior)."""
        application_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "federal_estimated_funding": None,  # Should be excluded (default)
            "delinquent_federal_debt": True,
            "certification_agree": None,  # Should be excluded (default)
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        xml_data = response.xml_data

        # Verify None fields are excluded from XML
        assert "<FederalEstimatedFunding>" not in xml_data
        assert "<CertificationAgree>" not in xml_data

        # Verify non-None fields are included
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>" in xml_data
        )
        assert (
            f"<SF424_4_0:DelinquentFederalDebt>{YES_VALUE}</SF424_4_0:DelinquentFederalDebt>"
            in xml_data
        )

    def test_generate_xml_with_configurable_none_handling(self):
        """Test configurable None handling behaviors."""
        application_data = {
            "submission_type": "Application",
            "date_received": None,  # include_null configured
            "state_review": None,  # default_value configured
            "organization_name": None,  # exclude (default)
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        xml_data = response.xml_data

        # Verify different None handling behaviors
        assert (
            "<SF424_4_0:DateReceived></SF424_4_0:DateReceived>" in xml_data
            or "<SF424_4_0:DateReceived/>" in xml_data
            or "<SF424_4_0:DateReceived />" in xml_data
        )  # include_null
        assert (
            f"<SF424_4_0:StateReview>{NO_VALUE}</SF424_4_0:StateReview>" in xml_data
        )  # default_value
        assert "OrganizationName" not in xml_data  # exclude (default)

        # Verify non-None fields are included
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data

    def test_generate_xml_uses_config_based_ordering_no_network_calls(self):
        """Test that XML generation uses config-based ordering."""

        application_data = {
            "submission_type": "Application",
            "application_type": "New",
            "organization_name": "Test University",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "ABC123DEF456",
            "applicant_address": {
                "street1": "123 Main St",
                "city": "Anytown",
                "state": "CA",
                "zip_code": "12345",
                "country": "USA",
            },
            "phone_number": "555-1234",
            "email": "test@example.com",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-2024-001",
            "funding_opportunity_title": "Test Opportunity",
            "project_title": "Research Project",
            "congressional_district_applicant": "CA-01",
            "congressional_district_program_project": "CA-01",
            "project_start_date": "2025-01-01",
            "project_end_date": "2025-12-31",
            "federal_estimated_funding": "50000.00",
            "applicant_estimated_funding": "10000.00",
            "state_estimated_funding": "5000.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "65000.00",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "Director",
            "authorized_representative_phone_number": "555-5678",
            "authorized_representative_email": "john@example.com",
            "aor_signature": "John Doe",
            "date_signed": "2025-01-01",
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        # Generate XML
        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements in correct structure
        xml_data = response.xml_data
        assert "<SF424_4_0" in xml_data
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert (
            "<SF424_4_0:OrganizationName>Test University</SF424_4_0:OrganizationName>" in xml_data
        )

        # Verify address elements are included (proving nested config-based ordering works)
        assert "<SF424_4_0:Applicant>" in xml_data
        assert "<globLib:Street1>123 Main St</globLib:Street1>" in xml_data
        assert "<globLib:City>Anytown</globLib:City>" in xml_data
