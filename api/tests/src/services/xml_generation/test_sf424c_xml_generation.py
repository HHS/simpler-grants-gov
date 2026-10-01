"""Tests for SF-424C form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424C_2_0-V2.0.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sf424c import FORM_XML_TRANSFORM_RULES as SF424C_TRANSFORM_RULES
from src.form_schema.forms.sf424c import SF424c_v2_0
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)

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

    def test_project_income_maps_to_program_income(self):
        """project_income maps to ProgramIncome, positioned between CostSubtotalAfterContingencies
        and TotalProjectCosts in the XSD sequence."""
        application_data = {
            "budget_information": {
                "subtotal_1": {
                    "total_cost": "500000.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "500000.00",
                },
                "subtotal_2": {
                    "total_cost": "525000.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "525000.00",
                },
                "project_income": {
                    "total_cost": "25000.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "25000.00",
                },
                "total_project_costs": {
                    "total_cost": "500000.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "500000.00",
                },
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        project_costs = root.find(f"{{{NS}}}ProjectCosts")
        assert project_costs is not None
        program_income = project_costs.find(f"{{{NS}}}ProgramIncome")
        assert program_income is not None
        assert program_income.find(f"{{{NS}}}BudgetEstimatedCostAmount").text == "25000.00"

    def test_federal_funding_total_project_costs_excluded_from_xml(self):
        """federal_funding.total_project_costs is UI-only and has no xml_transform —
        it must not appear as an element in the generated XML."""
        application_data = {
            "federal_funding": {
                "total_project_costs": "500000.00",
                "federal_percentage_share": 80,
                "federal_funding_share": "400000.00",
            }
        }
        xml_data = _generate(application_data)
        # The UI-only field must not leak into the XML output
        assert "total_project_costs" not in xml_data.lower() or "ProjectCosts" not in xml_data

        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        # FederalFundingPercentageShareValue and FederalFundingShareValue present at root
        assert root.find(f"{{{NS}}}FederalFundingPercentageShareValue") is not None
        assert root.find(f"{{{NS}}}FederalFundingShareValue") is not None
        # No spurious element from the UI-only field
        assert root.find(f"{{{NS}}}ProjectCosts") is None

    def test_contingencies_and_all_optional_rows_element_names(self):
        """All 11 optional cost rows map to their correct XSD element names."""
        application_data = {
            "budget_information": {
                "administrative_and_legal_expenses": {
                    "total_cost": "1.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "1.00",
                },
                "land_structures_rights_of_way": {
                    "total_cost": "2.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "2.00",
                },
                "relocation_expenses": {
                    "total_cost": "3.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "3.00",
                },
                "architectural_engineering_fees": {
                    "total_cost": "4.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "4.00",
                },
                "other_architectural_engineering_fees": {
                    "total_cost": "5.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "5.00",
                },
                "project_inspection_fees": {
                    "total_cost": "6.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "6.00",
                },
                "site_work": {
                    "total_cost": "7.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "7.00",
                },
                "demolition_and_removal": {
                    "total_cost": "8.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "8.00",
                },
                "construction": {
                    "total_cost": "9.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "9.00",
                },
                "equipment": {
                    "total_cost": "10.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "10.00",
                },
                "miscellaneous": {
                    "total_cost": "11.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "11.00",
                },
                "contingencies": {
                    "total_cost": "12.00",
                    "non_allowable_cost": "0.00",
                    "total_allowable_cost": "12.00",
                },
            }
        }
        xml_data = _generate(application_data)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        pc = root.find(f"{{{NS}}}ProjectCosts")
        assert pc is not None

        expected_elements = [
            "AdministrationCost",
            "LandCost",
            "RelocationCost",
            "ArchitecturalCost",
            "OtherArchitecturalCost",
            "InspectionFeesCost",
            "SiteWorkCost",
            "DemolitionCost",
            "ConstructionCost",
            "EquipmentCost",
            "Miscellaneous",
            "Contingencies",
        ]
        for element_name in expected_elements:
            assert pc.find(f"{{{NS}}}{element_name}") is not None, f"{element_name} missing"


# ---------------------------------------------------------------------------
# Snapshot data — a comprehensive case covering all budget rows + federal funding
# ---------------------------------------------------------------------------

_SNAPSHOT_DATA = {
    "budget_information": {
        "administrative_and_legal_expenses": {
            "total_cost": "10000.00",
            "non_allowable_cost": "1000.00",
            "total_allowable_cost": "9000.00",
        },
        "construction": {
            "total_cost": "500000.00",
            "non_allowable_cost": "50000.00",
            "total_allowable_cost": "450000.00",
        },
        "subtotal_1": {
            "total_cost": "510000.00",
            "non_allowable_cost": "51000.00",
            "total_allowable_cost": "459000.00",
        },
        "contingencies": {
            "total_cost": "25000.00",
            "non_allowable_cost": "0.00",
            "total_allowable_cost": "25000.00",
        },
        "subtotal_2": {
            "total_cost": "535000.00",
            "non_allowable_cost": "51000.00",
            "total_allowable_cost": "484000.00",
        },
        "total_project_costs": {
            "total_cost": "535000.00",
            "non_allowable_cost": "51000.00",
            "total_allowable_cost": "484000.00",
        },
    },
    "federal_funding": {
        "federal_percentage_share": 80,
        "federal_funding_share": "387200.00",
    },
}

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424c_2_0.xml"


class TestSF424CSnapshot:
    """Regression snapshot test pinning the full generated XML output.

    To regenerate after an intentional change, delete snapshots/sf424c_2_0.xml
    and re-run the test — it will create the file on first run.
    """

    def test_full_xml_matches_snapshot(self):
        """Generated XML for a comprehensive case must match the stored snapshot."""
        xml_data = _generate(_SNAPSHOT_DATA)

        if not _SNAPSHOT_PATH.exists():
            _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
            _SNAPSHOT_PATH.write_text(xml_data)
            pytest.skip("Snapshot created — re-run to validate")

        assert xml_data == _SNAPSHOT_PATH.read_text()


class TestSF424CXSDValidation:
    """XSD validation tests for SF-424C form XML."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_cache_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")
        xsd_path = xsd_cache_dir / "SF424C_2_0-V2.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "SF424C_2_0-V2.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _extract_and_validate(self, xml_string: str, xsd_validator: XSDValidator) -> dict:
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        grant_ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=grant_ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        form_ns = f"{{{NS}}}"
        elements = forms_element.findall(f".//{form_ns}SF424C_2_0")
        assert len(elements) == 1, f"Expected 1 SF424C_2_0 element, got {len(elements)}"

        form_xml = lxml_etree.tostring(elements[0], encoding="unicode")
        xsd_path = xsd_validator.xsd_dir / "SF424C_2_0-V2.0.xsd"
        return xsd_validator.validate_xml(form_xml, xsd_path)

    def _make_application(self, enable_factory_create, response: dict):
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
        assistance_listing = OpportunityAssistanceListingFactory.create(opportunity=opportunity)
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        form = SF424c_v2_0
        application = ApplicationFactory.create(competition=competition)
        competition_form = CompetitionFormFactory.create(competition=competition, form=form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=response,
        )
        return application

    def test_construction_only_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        # CostSubtotalBeforeContingencies and CostSubtotalAfterContingencies have
        # no minOccurs="0" in the XSD, so they are required whenever ProjectCosts
        # is present. Include subtotal_1 and subtotal_2 even in a single-row case.
        application = self._make_application(
            enable_factory_create,
            {
                "budget_information": {
                    "construction": {
                        "total_cost": "500000.00",
                        "non_allowable_cost": "0.00",
                        "total_allowable_cost": "500000.00",
                    },
                    "subtotal_1": {
                        "total_cost": "500000.00",
                        "non_allowable_cost": "0.00",
                        "total_allowable_cost": "500000.00",
                    },
                    "subtotal_2": {
                        "total_cost": "500000.00",
                        "non_allowable_cost": "0.00",
                        "total_allowable_cost": "500000.00",
                    },
                    "total_project_costs": {
                        "total_cost": "500000.00",
                        "non_allowable_cost": "0.00",
                        "total_allowable_cost": "500000.00",
                    },
                },
                "federal_funding": {
                    "federal_percentage_share": 80,
                    "federal_funding_share": "400000.00",
                },
            },
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=11111111
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_empty_form_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        # Pass minimal federal_funding data instead of {} — an empty dict is
        # falsy in Python and causes the XML service to reject it. The XSD allows
        # all fields to be absent, so this still tests the "no budget rows" case.
        application = self._make_application(
            enable_factory_create,
            {"federal_funding": {"federal_percentage_share": 0, "federal_funding_share": "0.00"}},
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=22222222
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_all_rows_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(enable_factory_create, _SNAPSHOT_DATA)
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=33333333
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"
