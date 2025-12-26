"""Tests for configurable XML namespaces feature."""

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestConfigurableNamespaces:
    """Test configurable XML namespace functionality."""

    def test_generate_xml_with_namespace_prefixes(self):
        """Test that XML generation uses correct namespace prefixes for configured fields."""
        service = XMLGenerationService()

        application_data = {
            "submission_type": "Application",
            "organization_name": "Test Organization",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC",
                "province": "Ontario",
                "zip_code": "20001",
                "country": "UNITED STATES",
            },
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
        }

        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success
        assert response.xml_data is not None

        # Verify that address fields use globLib namespace
        xml_content = response.xml_data
        assert "globLib:Street1" in xml_content
        assert "globLib:City" in xml_content
        assert "globLib:State" in xml_content
        assert "globLib:Province" in xml_content
        assert "globLib:ZipPostalCode" in xml_content
        assert "globLib:Country" in xml_content

        # Verify that authorized representative name fields use globLib namespace
        assert "globLib:FirstName" in xml_content
        assert "globLib:LastName" in xml_content

        # Verify that root-level fields still use SF424_4_0 namespace
        assert "SF424_4_0:OrganizationName" in xml_content
        assert "SF424_4_0:SubmissionType" in xml_content

    def test_backward_compatibility_without_namespace_config(self):
        """Test that fields without namespace config use default behavior."""
        service = XMLGenerationService()

        application_data = {
            "organization_name": "Test Organization",
            "submission_type": "Application",
        }

        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success
        assert response.xml_data is not None

        # Fields without namespace config should use SF424_4_0 namespace
        xml_content = response.xml_data
        assert "SF424_4_0:OrganizationName" in xml_content
        assert "SF424_4_0:SubmissionType" in xml_content

    def test_namespace_configuration_in_xml_output(self):
        """Test that namespace declarations are properly included in XML output."""
        service = XMLGenerationService()

        application_data = {
            "submission_type": "Application",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
            },
        }

        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success
        assert response.xml_data is not None

        xml_content = response.xml_data
        # Verify namespace declarations are present
        assert 'xmlns:SF424_4_0="http://apply.grants.gov/forms/SF424_4_0-V4.0"' in xml_content
        assert 'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"' in xml_content
