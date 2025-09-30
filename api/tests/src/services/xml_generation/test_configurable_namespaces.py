"""Tests for configurable XML namespaces functionality."""

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestConfigurableNamespaces:
    """Test cases for configurable XML namespace functionality."""

    def test_extract_namespace_fields(self):
        """Test extraction of namespace configuration from transform rules."""
        service = XMLGenerationService()

        # Sample transform config with namespace configurations
        transform_config = {
            "_xml_config": {
                "namespaces": {
                    "default": "http://example.com/default",
                    "globLib": "http://example.com/globLib",
                }
            },
            "field1": {"xml_transform": {"target": "Field1"}},
            "field2": {"xml_transform": {"target": "Field2", "namespace": "globLib"}},
            "nested_section": {
                "xml_transform": {"target": "NestedSection", "type": "nested_object"},
                "sub_field1": {"xml_transform": {"target": "SubField1"}},
                "sub_field2": {"xml_transform": {"target": "SubField2", "namespace": "globLib"}},
            },
        }

        namespace_fields = service._extract_namespace_fields(transform_config)

        # Verify extraction results
        assert namespace_fields == {"Field2": "globLib", "SubField2": "globLib"}

    def test_xml_generation_with_configured_namespaces(self):
        """Test XML generation uses configured namespaces from SF-424 rules."""
        service = XMLGenerationService()

        # Test data with address fields that should use globLib namespace
        application_data = {
            "organization_name": "Test Organization",
            "submission_type": "Application",
            "applicant_address": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC",
                "province": "Ontario",
                "zip_code": "20001",
                "country": "UNITED STATES",
            },
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
        }

        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

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

        request = XMLGenerationRequest(application_data=application_data, form_name="SF424_4_0")

        response = service.generate_xml(request)

        assert response.success
        assert response.xml_data is not None

        # Fields without namespace config should use SF424_4_0 namespace
        xml_content = response.xml_data
        assert "SF424_4_0:OrganizationName" in xml_content
        assert "SF424_4_0:SubmissionType" in xml_content
