"""Tests for static values and XML attributes feature."""

from lxml import etree as lxml_etree

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestStaticValuesAndAttributes:
    """Test static values and XML attributes functionality."""

    def test_static_value(self):
        """Test that static_value populates fields with constant values alongside dynamic data."""
        service = XMLGenerationService()

        transform_config = {
            "_xml_config": {
                "namespaces": {"default": "http://example.org/test"},
                "xml_structure": {"root_element": "TestForm", "version": "1.0"},
                "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
            },
            "static_field": {
                "xml_transform": {"target": "StaticField", "static_value": "AlwaysThis"}
            },
            "dynamic_field": {"xml_transform": {"target": "DynamicField"}},
        }

        application_data = {"dynamic_field": "FromData"}

        request = XMLGenerationRequest(
            application_data=application_data, transform_config=transform_config
        )

        response = service.generate_xml(request)

        assert response.success

        # Parse and verify both static and dynamic fields
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(response.xml_data.encode("utf-8"), parser=parser)

        ns = {"test": "http://example.org/test"}
        static_field = root.find(".//test:StaticField", namespaces=ns)
        assert static_field is not None
        assert static_field.text == "AlwaysThis"

        dynamic_field = root.find(".//test:DynamicField", namespaces=ns)
        assert dynamic_field is not None
        assert dynamic_field.text == "FromData"

    def test_material_change_supplement_scenario(self):
        """Test the exact scenario from issue #6899 - parent element with static attribute containing dynamic child elements."""
        service = XMLGenerationService()

        transform_config = {
            "_xml_config": {
                "namespaces": {
                    "default": "http://apply.grants.gov/forms/SFLLL_2_0-V2.0",
                    "SFLLL_2_0": "http://apply.grants.gov/forms/SFLLL_2_0-V2.0",
                },
                "xml_structure": {"root_element": "SFLLL_2_0", "version": "2.0"},
                "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
            },
            "material_change_supplement": {
                "xml_transform": {
                    "target": "MaterialChangeSupplement",
                    "type": "nested_object",
                    "attributes": {"SFLLL_2_0:ReportType": "MaterialChange"},
                    "nested_fields": {
                        "year": {"xml_transform": {"target": "MaterialChangeYear"}},
                        "quarter": {"xml_transform": {"target": "MaterialChangeQuarter"}},
                        "last_report_date": {"xml_transform": {"target": "LastReportDate"}},
                    },
                }
            },
        }

        application_data = {
            "material_change_supplement": {
                "year": "2025",
                "quarter": "1",
                "last_report_date": "2025-01-01",
            }
        }

        request = XMLGenerationRequest(
            application_data=application_data, transform_config=transform_config
        )

        response = service.generate_xml(request)

        assert response.success
        assert response.xml_data is not None

        # Parse and verify the structure
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(response.xml_data.encode("utf-8"), parser=parser)

        ns = {"SFLLL_2_0": "http://apply.grants.gov/forms/SFLLL_2_0-V2.0"}

        # Verify parent element with static attribute
        material_change = root.find(".//SFLLL_2_0:MaterialChangeSupplement", namespaces=ns)
        assert material_change is not None
        assert (
            material_change.get("{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}ReportType")
            == "MaterialChange"
        )

        # Verify dynamic child elements
        year = material_change.find("SFLLL_2_0:MaterialChangeYear", namespaces=ns)
        assert year is not None
        assert year.text == "2025"

        quarter = material_change.find("SFLLL_2_0:MaterialChangeQuarter", namespaces=ns)
        assert quarter is not None
        assert quarter.text == "1"

        last_report_date = material_change.find("SFLLL_2_0:LastReportDate", namespaces=ns)
        assert last_report_date is not None
        assert last_report_date.text == "2025-01-01"
