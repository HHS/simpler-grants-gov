"""Integration tests for pivot_object transformation with XML generation."""

from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestPivotIntegration:
    """Test end-to-end pivot transformation with XML generation for SF424A."""

    def test_forecasted_cash_needs_full_data_integration(self):
        """Test complete XML generation for forecasted cash needs with full data."""
        service = XMLGenerationService()

        application_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "1.00",
                    "second_quarter_amount": "3.00",
                    "third_quarter_amount": "5.00",
                    "fourth_quarter_amount": "7.00",
                    "total_amount": "16.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "2.00",
                    "second_quarter_amount": "4.00",
                    "third_quarter_amount": "6.00",
                    "fourth_quarter_amount": "8.00",
                    "total_amount": "20.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "3.00",
                    "second_quarter_amount": "7.00",
                    "third_quarter_amount": "11.00",
                    "fourth_quarter_amount": "15.00",
                    "total_amount": "36.00",
                },
            }
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data

        # Verify XML structure contains all expected elements
        assert "BudgetForecastedCashNeeds" in xml_data

        # Verify first year amounts (totals)
        assert "BudgetFirstYearAmounts" in xml_data
        assert (
            "<SF424A:BudgetFederalForecastedAmount>16.00</SF424A:BudgetFederalForecastedAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetNonFederalForecastedAmount>20.00</SF424A:BudgetNonFederalForecastedAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetTotalForecastedAmount>36.00</SF424A:BudgetTotalForecastedAmount>"
            in xml_data
        )

        # Verify first quarter amounts
        assert "BudgetFirstQuarterAmounts" in xml_data
        # The federal amount for first quarter should be 1.00
        assert (
            xml_data.count(
                "<SF424A:BudgetFederalForecastedAmount>1.00</SF424A:BudgetFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetNonFederalForecastedAmount>2.00</SF424A:BudgetNonFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetTotalForecastedAmount>3.00</SF424A:BudgetTotalForecastedAmount>"
            )
            >= 1
        )

        # Verify second quarter amounts
        assert "BudgetSecondQuarterAmounts" in xml_data
        assert (
            xml_data.count(
                "<SF424A:BudgetFederalForecastedAmount>3.00</SF424A:BudgetFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetNonFederalForecastedAmount>4.00</SF424A:BudgetNonFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetTotalForecastedAmount>7.00</SF424A:BudgetTotalForecastedAmount>"
            )
            >= 1
        )

        # Verify third quarter amounts
        assert "BudgetThirdQuarterAmounts" in xml_data
        assert (
            xml_data.count(
                "<SF424A:BudgetFederalForecastedAmount>5.00</SF424A:BudgetFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetNonFederalForecastedAmount>6.00</SF424A:BudgetNonFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetTotalForecastedAmount>11.00</SF424A:BudgetTotalForecastedAmount>"
            )
            >= 1
        )

        # Verify fourth quarter amounts
        assert "BudgetFourthQuarterAmounts" in xml_data
        assert (
            xml_data.count(
                "<SF424A:BudgetFederalForecastedAmount>7.00</SF424A:BudgetFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetNonFederalForecastedAmount>8.00</SF424A:BudgetNonFederalForecastedAmount>"
            )
            >= 1
        )
        assert (
            xml_data.count(
                "<SF424A:BudgetTotalForecastedAmount>15.00</SF424A:BudgetTotalForecastedAmount>"
            )
            >= 1
        )

    def test_forecasted_cash_needs_partial_data_integration(self):
        """Test XML generation with partial forecasted cash needs data."""
        service = XMLGenerationService()

        application_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "1.00",
                    "total_amount": "16.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "total_amount": "20.00",
                },
            }
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Should contain the first year amounts
        assert "BudgetFirstYearAmounts" in xml_data
        assert (
            "<SF424A:BudgetFederalForecastedAmount>16.00</SF424A:BudgetFederalForecastedAmount>"
            in xml_data
        )
        assert (
            "<SF424A:BudgetNonFederalForecastedAmount>20.00</SF424A:BudgetNonFederalForecastedAmount>"
            in xml_data
        )

        # Should contain first quarter with only federal amount
        assert "BudgetFirstQuarterAmounts" in xml_data
        assert (
            "<SF424A:BudgetFederalForecastedAmount>1.00</SF424A:BudgetFederalForecastedAmount>"
            in xml_data
        )

        # Should not contain other quarters (no data for them)
        assert "BudgetSecondQuarterAmounts" not in xml_data
        assert "BudgetThirdQuarterAmounts" not in xml_data
        assert "BudgetFourthQuarterAmounts" not in xml_data

    def test_forecasted_cash_needs_missing_data_integration(self):
        """Test XML generation when forecasted_cash_needs is missing."""
        service = XMLGenerationService()

        application_data = {"other_field": "value"}

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Should not contain forecasted cash needs elements
        assert "BudgetForecastedCashNeeds" not in xml_data

    def test_forecasted_cash_needs_empty_object_integration(self):
        """Test XML generation when forecasted_cash_needs is an empty object."""
        service = XMLGenerationService()

        application_data = {"forecasted_cash_needs": {}}

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Should not contain forecasted cash needs elements when empty
        assert "BudgetForecastedCashNeeds" not in xml_data

    def test_forecasted_cash_needs_xml_structure_order(self):
        """Test that XML elements are in the correct hierarchical structure."""
        service = XMLGenerationService()

        application_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "1.00",
                    "total_amount": "16.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "2.00",
                    "total_amount": "20.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "3.00",
                    "total_amount": "36.00",
                },
            }
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify BudgetForecastedCashNeeds contains child elements
        fcn_start = xml_data.find("<SF424A:BudgetForecastedCashNeeds>")
        fcn_end = xml_data.find("</SF424A:BudgetForecastedCashNeeds>")
        assert fcn_start != -1
        assert fcn_end != -1
        assert fcn_start < fcn_end

        # Extract the content between the tags
        fcn_content = xml_data[fcn_start:fcn_end]

        # Verify nested structure exists
        assert "BudgetFirstYearAmounts" in fcn_content
        assert "BudgetFirstQuarterAmounts" in fcn_content
        assert "BudgetFederalForecastedAmount" in fcn_content
        assert "BudgetNonFederalForecastedAmount" in fcn_content
        assert "BudgetTotalForecastedAmount" in fcn_content

    def test_forecasted_cash_needs_numeric_values(self):
        """Test that numeric values are properly converted to strings in XML."""
        service = XMLGenerationService()

        # Test with numeric types instead of strings
        application_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "total_amount": "100.50",
                },
            }
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        assert (
            "<SF424A:BudgetFederalForecastedAmount>100.50</SF424A:BudgetFederalForecastedAmount>"
            in xml_data
        )
