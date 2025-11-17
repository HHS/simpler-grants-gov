"""Integration tests for conditional transformations."""

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES as SF424A_TRANSFORM_RULES
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
            transform_config=FORM_XML_TRANSFORM_RULES,
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
            transform_config=FORM_XML_TRANSFORM_RULES,
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
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify no type codes are in the XML
        assert "ApplicantTypeCode1" not in response.xml_data
        assert "ApplicantTypeCode2" not in response.xml_data
        assert "ApplicantTypeCode3" not in response.xml_data


class TestArrayDecompositionIntegration:
    """Test end-to-end array decomposition transformation integration for SF-424A."""

    def test_sf424a_budget_sections_array_decomposition_integration(self):
        """Test complete array decomposition for SF-424A budget sections."""
        service = XMLGenerationService()

        # Test data with activity line items and totals
        application_data = {
            "activity_line_items": [
                {
                    "activity_title": "Activity 1",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "1000.00",
                        "total_amount": "5000.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "2000.00",
                        "total_amount": "5000.00",
                    },
                    "non_federal_resources": {
                        "applicant_amount": "500.00",
                        "total_amount": "1500.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "5000.00",
                    },
                },
                {
                    "activity_title": "Activity 2",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "2000.00",
                        "total_amount": "8000.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "3000.00",
                        "total_amount": "8000.00",
                    },
                    "non_federal_resources": {
                        "applicant_amount": "1000.00",
                        "total_amount": "3000.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "8000.00",
                    },
                },
            ],
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "3000.00",
                "total_amount": "13000.00",
            },
            "total_budget_categories": {
                "personnel_amount": "5000.00",
                "total_amount": "13000.00",
            },
            "total_non_federal_resources": {
                "applicant_amount": "1500.00",
                "total_amount": "4500.00",
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "13000.00",
            },
        }

        request = XMLGenerationRequest(
            transform_config=SF424A_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the transformation succeeded
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify the BudgetSections element is present
        assert "BudgetSections" in response.xml_data

        # Verify arrays are present in the output
        assert "BudgetSummaries" in response.xml_data
        assert "BudgetCategories" in response.xml_data
        assert "NonFederalResources" in response.xml_data
        assert "FederalFundEstimates" in response.xml_data

    def test_sf424a_budget_sections_with_minimal_data(self):
        """Test array decomposition with minimal budget data."""
        service = XMLGenerationService()

        # Test data with single activity line item
        application_data = {
            "activity_line_items": [
                {
                    "activity_title": "Single Activity",
                    "budget_summary": {
                        "total_amount": "10000.00",
                    },
                },
            ],
            "total_budget_summary": {
                "total_amount": "10000.00",
            },
        }

        request = XMLGenerationRequest(
            transform_config=SF424A_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the transformation succeeded
        assert response.success is True
        assert response.xml_data is not None

        # Verify BudgetSections is present
        assert "BudgetSections" in response.xml_data
        assert "BudgetSummaries" in response.xml_data

    def test_sf424a_budget_sections_without_totals(self):
        """Test array decomposition when totals are not provided."""
        service = XMLGenerationService()

        # Test data without total fields
        application_data = {
            "activity_line_items": [
                {
                    "activity_title": "Activity 1",
                    "budget_summary": {
                        "total_amount": "5000.00",
                    },
                },
                {
                    "activity_title": "Activity 2",
                    "budget_summary": {
                        "total_amount": "8000.00",
                    },
                },
            ],
            # No total_budget_summary provided
        }

        request = XMLGenerationRequest(
            transform_config=SF424A_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the transformation succeeded
        assert response.success is True
        assert response.xml_data is not None

        # Verify BudgetSections is present with only line items (no total)
        assert "BudgetSections" in response.xml_data
        assert "BudgetSummaries" in response.xml_data

    def test_sf424a_budget_sections_empty_line_items(self):
        """Test array decomposition with empty activity line items."""
        service = XMLGenerationService()

        # Test data with empty activity line items
        application_data = {
            "activity_line_items": [],
            "total_budget_summary": {
                "total_amount": "0.00",
            },
        }

        request = XMLGenerationRequest(
            transform_config=SF424A_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the transformation succeeded
        assert response.success is True
        assert response.xml_data is not None

        # BudgetSections should not be present with empty array
        # (conditional transform returns None for empty arrays)
        assert "BudgetSections" not in response.xml_data

    def test_sf424a_budget_sections_with_all_fields(self):
        """Test array decomposition with comprehensive budget data."""
        service = XMLGenerationService()

        # Test data with all budget section fields
        application_data = {
            "activity_line_items": [
                {
                    "activity_title": "Research",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "1000.00",
                        "non_federal_estimated_unobligated_amount": "200.00",
                        "federal_new_or_revised_amount": "4000.00",
                        "non_federal_new_or_revised_amount": "800.00",
                        "total_amount": "6000.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "3000.00",
                        "fringe_benefits_amount": "600.00",
                        "travel_amount": "1000.00",
                        "equipment_amount": "500.00",
                        "supplies_amount": "400.00",
                        "contractual_amount": "300.00",
                        "construction_amount": "0.00",
                        "other_amount": "200.00",
                        "total_direct_charge_amount": "6000.00",
                        "total_indirect_charge_amount": "0.00",
                        "total_amount": "6000.00",
                    },
                    "non_federal_resources": {
                        "applicant_amount": "800.00",
                        "state_amount": "100.00",
                        "other_amount": "100.00",
                        "total_amount": "1000.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "5000.00",
                        "second_year_amount": "0.00",
                        "third_year_amount": "0.00",
                        "fourth_year_amount": "0.00",
                    },
                },
            ],
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "1000.00",
                "non_federal_estimated_unobligated_amount": "200.00",
                "federal_new_or_revised_amount": "4000.00",
                "non_federal_new_or_revised_amount": "800.00",
                "total_amount": "6000.00",
            },
            "total_budget_categories": {
                "personnel_amount": "3000.00",
                "fringe_benefits_amount": "600.00",
                "travel_amount": "1000.00",
                "equipment_amount": "500.00",
                "supplies_amount": "400.00",
                "contractual_amount": "300.00",
                "construction_amount": "0.00",
                "other_amount": "200.00",
                "total_direct_charge_amount": "6000.00",
                "total_indirect_charge_amount": "0.00",
                "total_amount": "6000.00",
                "program_income_amount": "0.00",
            },
            "total_non_federal_resources": {
                "applicant_amount": "800.00",
                "state_amount": "100.00",
                "other_amount": "100.00",
                "total_amount": "1000.00",
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "5000.00",
                "second_year_amount": "0.00",
                "third_year_amount": "0.00",
                "fourth_year_amount": "0.00",
            },
        }

        request = XMLGenerationRequest(
            transform_config=SF424A_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the transformation succeeded
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify all budget sections are present
        assert "BudgetSections" in response.xml_data
        assert "BudgetSummaries" in response.xml_data
        assert "BudgetCategories" in response.xml_data
        assert "NonFederalResources" in response.xml_data
        assert "FederalFundEstimates" in response.xml_data
