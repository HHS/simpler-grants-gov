"""Integration tests for conditional transformations."""

from lxml import etree as lxml_etree

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
    """Test end-to-end array decomposition transformation integration for SF-424A.

    These tests verify that the array_decomposition transform correctly reorganizes
    row-oriented data into column-oriented structure AND that the XML generation
    properly handles the wrapper elements and attributes to produce the correct XML.
    """

    def test_sf424a_budget_sections_array_decomposition_integration(self):
        """Test complete array decomposition for SF-424A budget sections.

        Verifies that:
        1. Array decomposition transforms data correctly
        2. XML generation creates proper wrapper elements (ResourceLineItem vs ResourceTotals)
        3. Activity title appears as an attribute on line items only
        """
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

        # Verify wrapper elements are used correctly
        assert "SummaryLineItem" in response.xml_data
        assert "SummaryTotals" in response.xml_data
        assert "ResourceLineItem" in response.xml_data
        assert "ResourceTotals" in response.xml_data

        # Get the XML data for detailed assertions
        xml_data = response.xml_data

        # Verify activityTitle appears as an attribute on line items (XSD-compliant name and namespace)
        assert 'SF424A:activityTitle="Activity 1"' in xml_data
        assert 'SF424A:activityTitle="Activity 2"' in xml_data

        # Verify NonFederalResources section structure matches XSD expectations
        # The XSD expects this specific structure for the NonFederalResources section
        assert "NonFederalResources>" in xml_data
        assert "ResourceLineItem" in xml_data  # Line items
        assert "ResourceTotals>" in xml_data  # Totals use different wrapper

        # Verify the activityTitle is an attribute on line items (not in totals) - XSD-compliant name and namespace
        assert "ResourceLineItem" in xml_data and 'SF424A:activityTitle="Activity 1"' in xml_data
        assert "ResourceLineItem" in xml_data and 'SF424A:activityTitle="Activity 2"' in xml_data

        # Verify totals don't have activityTitle attribute using XML parsing
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Find all ResourceTotals elements (regardless of namespace prefix)
        totals_elements = root.xpath(".//*[local-name()='ResourceTotals']")
        assert len(totals_elements) == 1, "Should have exactly one ResourceTotals element"

        # Verify ResourceTotals has no activityTitle attribute (XSD-compliant name)
        totals_element = totals_elements[0]
        # Check if any attribute name ends with 'activityTitle' (to handle namespaced attributes)
        totals_has_activity_title = any(
            attr_name.endswith("activityTitle") for attr_name in totals_element.attrib.keys()
        )
        assert (
            not totals_has_activity_title
        ), "ResourceTotals should not have activityTitle attribute"

        # Find all ResourceLineItem elements
        line_item_elements = root.xpath(".//*[local-name()='ResourceLineItem']")
        assert len(line_item_elements) == 2, "Should have exactly two ResourceLineItem elements"

        # Verify each line item HAS activityTitle attribute (XSD-compliant name)
        for line_item in line_item_elements:
            # Check if any attribute name ends with 'activityTitle' (to handle namespaced attributes)
            has_activity_title = any(
                attr_name.endswith("activityTitle") for attr_name in line_item.attrib.keys()
            )
            assert has_activity_title, "ResourceLineItem should have activityTitle attribute"

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

    def test_sf424a_non_federal_resources_xml_structure(self):
        """Test that NonFederalResources produces the exact XML structure with attributes.

        This test validates the complete XML structure including:
        - ResourceLineItem elements with activity_title attribute
        - ResourceTotals element without activity_title
        - Proper nesting and namespacing
        """
        service = XMLGenerationService()

        # Test data matching the PR comment example
        application_data = {
            "activity_line_items": [
                {
                    "activity_title": "Line 1",
                    "non_federal_resources": {
                        "applicant_amount": "10.00",
                        "state_amount": "20.00",
                        "other_amount": "30.00",
                        "total_amount": "60.00",
                    },
                },
            ],
            "total_non_federal_resources": {
                "applicant_amount": "120.00",
                "state_amount": "150.00",
                "other_amount": "180.00",
                "total_amount": "450.00",
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

        # Verify the exact XML structure
        xml_data = response.xml_data

        # Check ResourceLineItem with activityTitle attribute (XSD-compliant name and namespace)
        assert 'SF424A:activityTitle="Line 1"' in xml_data
        assert (
            "<SF424A:BudgetApplicantContributionAmount>10.00</SF424A:BudgetApplicantContributionAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetStateContributionAmount>20.00</SF424A:BudgetStateContributionAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetOtherContributionAmount>30.00</SF424A:BudgetOtherContributionAmount>"
            in xml_data
        )

        # Check ResourceTotals without activityTitle attribute
        assert "<SF424A:ResourceTotals>" in xml_data
        assert (
            "<SF424A:BudgetApplicantContributionAmount>120.00</SF424A:BudgetApplicantContributionAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetStateContributionAmount>150.00</SF424A:BudgetStateContributionAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetOtherContributionAmount>180.00</SF424A:BudgetOtherContributionAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetTotalContributionAmount>450.00</SF424A:BudgetTotalContributionAmount>"
            in xml_data
        )

        # Verify ResourceTotals does NOT have activityTitle attribute
        assert "ResourceTotals SF424A:activityTitle" not in xml_data

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
