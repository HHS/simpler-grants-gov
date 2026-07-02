"""Tests for SF-424C form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424C_2_0-V2.0.xsd
"""

from lxml import etree as lxml_etree

from src.form_schema.forms.sf424c import FORM_XML_TRANSFORM_RULES as SF424C_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

NS = "http://apply.grants.gov/forms/SF424C_2_0-V2.0"
NS_PREFIX = "SF424C_2_0"
NSMAP = {NS_PREFIX: NS}


def _generate(application_data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data, transform_config=SF424C_TRANSFORM_RULES
        )
    )
    assert response.success is True
    assert response.xml_data is not None
    return response.xml_data


class TestSF424CXMLGeneration:
    def test_root_element_and_attributes(self):
        """Root element is SF424C_2_0 with programType=Construction and FormVersion=2.0."""
        application_data = {
            "federal_funding": {
                "federal_percentage_share": 0,
                "federal_funding_share": "0.00",
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        assert root.tag == f"{{{NS}}}SF424C_2_0"
        assert root.get(f"{{{NS}}}programType") == "Construction"
        assert root.get(f"{{{NS}}}FormVersion") == "2.0"

    def test_namespace_declaration(self):
        """Generated XML includes the SF424C_2_0 namespace declaration."""
        application_data = {
            "federal_funding": {
                "federal_percentage_share": 0,
                "federal_funding_share": "0.00",
            }
        }
        xml_data = _generate(application_data)
        assert f'xmlns:{NS_PREFIX}="{NS}"' in xml_data

    def test_budget_row_maps_to_project_costs(self):
        """A single budget row is nested inside ProjectCosts with correct element names."""
        application_data = {
            "budget_information": {
                "construction": {
                    "total_cost": "500000.00",
                    "non_allowable_cost": "50000.00",
                    "total_allowable_cost": "450000.00",
                }
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        project_costs = root.find(f"{{{NS}}}ProjectCosts")
        assert project_costs is not None

        construction = project_costs.find(f"{{{NS}}}ConstructionCost")
        assert construction is not None

        assert construction.find(f"{{{NS}}}BudgetEstimatedCostAmount").text == "500000.00"
        assert construction.find(f"{{{NS}}}BudgetNonAllowableCostAmount").text == "50000.00"
        assert construction.find(f"{{{NS}}}BudgetTotalAllowableCostAmount").text == "450000.00"

    def test_federal_funding_fields_at_root_level(self):
        """Federal funding fields bubble to root level (no wrapper element)."""
        application_data = {
            "federal_funding": {
                "federal_percentage_share": 80,
                "federal_funding_share": "800000.00",
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        # These must be direct children of root, not nested under a federal_funding element
        pct = root.find(f"{{{NS}}}FederalFundingPercentageShareValue")
        share = root.find(f"{{{NS}}}FederalFundingShareValue")

        assert pct is not None
        assert share is not None
        assert share.text == "800000.00"

    def test_absent_rows_excluded_from_xml(self):
        """Budget rows with no data are excluded from the XML output."""
        application_data = {
            "budget_information": {
                "construction": {
                    "total_cost": "100000.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "100000.00",
                }
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        project_costs = root.find(f"{{{NS}}}ProjectCosts")
        assert project_costs is not None

        # Only construction was provided; other rows should be absent
        assert project_costs.find(f"{{{NS}}}AdministrationCost") is None
        assert project_costs.find(f"{{{NS}}}LandCost") is None
        assert project_costs.find(f"{{{NS}}}ConstructionCost") is not None

    def test_subtotal_rows_use_correct_element_names(self):
        """Calculated subtotal rows map to their correct XSD element names."""
        application_data = {
            "budget_information": {
                "subtotal_1": {
                    "total_cost": "1100000.00",
                    "non_allowable_cost": "110000.00",
                    "total_allowable_cost": "990000.00",
                },
                "subtotal_2": {
                    "total_cost": "1155000.00",
                    "non_allowable_cost": "115000.00",
                    "total_allowable_cost": "1040000.00",
                },
                "total_project_costs": {
                    "total_cost": "1145000.00",
                    "non_allowable_cost": "115000.00",
                    "total_allowable_cost": "1030000.00",
                },
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        project_costs = root.find(f"{{{NS}}}ProjectCosts")
        assert project_costs.find(f"{{{NS}}}CostSubtotalBeforeContingencies") is not None
        assert project_costs.find(f"{{{NS}}}CostSubtotalAfterContingencies") is not None
        assert project_costs.find(f"{{{NS}}}TotalProjectCosts") is not None

    def test_no_budget_rows_excludes_project_costs(self):
        """When no budget rows are provided, ProjectCosts is absent from the XML."""
        application_data = {
            "federal_funding": {
                "federal_percentage_share": 0,
                "federal_funding_share": "0.00",
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.tag == f"{{{NS}}}SF424C_2_0"
        assert root.find(f"{{{NS}}}ProjectCosts") is None
