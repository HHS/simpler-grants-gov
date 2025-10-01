"""Integration tests for conditional transformations (simplified for one-to-many only)."""

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestConditionalIntegration:
    """Test end-to-end conditional transformation integration."""

    def test_one_to_many_applicant_type_codes_integration(self):
        """Test complete one-to-many transformation for applicant type codes."""
        service = XMLGenerationService()

        # Test data with multiple applicant type codes
        application_data = {
            "applicant_type_code": ["A", "B", "C"],
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            form_name="SF424_4_0",
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the XML contains the mapped applicant type codes
        assert "ApplicantTypeCode1" in response.xml_data
        assert "ApplicantTypeCode2" in response.xml_data
        assert "ApplicantTypeCode3" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode1>A</SF424_4_0:ApplicantTypeCode1>" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode2>B</SF424_4_0:ApplicantTypeCode2>" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode3>C</SF424_4_0:ApplicantTypeCode3>" in response.xml_data

    def test_one_to_many_single_applicant_type_code_integration(self):
        """Test one-to-many transformation with single applicant type code."""
        service = XMLGenerationService()

        # Test data with single applicant type code
        application_data = {
            "applicant_type_code": ["A"],
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            form_name="SF424_4_0",
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify only the first type code is mapped
        assert "ApplicantTypeCode1" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode1>A</SF424_4_0:ApplicantTypeCode1>" in response.xml_data
        assert "ApplicantTypeCode2" not in response.xml_data

    def test_one_to_many_no_applicant_type_codes_integration(self):
        """Test one-to-many transformation with no applicant type codes."""
        service = XMLGenerationService()

        # Test data without applicant type codes
        application_data = {
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            form_name="SF424_4_0",
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify no type codes are in the XML
        assert "ApplicantTypeCode1" not in response.xml_data
        assert "ApplicantTypeCode2" not in response.xml_data
        assert "ApplicantTypeCode3" not in response.xml_data
