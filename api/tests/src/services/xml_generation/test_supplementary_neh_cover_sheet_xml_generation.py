"""Tests for Supplementary Cover Sheet for NEH Grant Programs form XML generation."""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.supplementary_neh_cover_sheet import (
    FORM_XML_TRANSFORM_RULES as NEH_COVER_SHEET_TRANSFORM_RULES,
)
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
    FormFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


class TestSupplementaryNEHCoverSheetXMLGeneration:
    """Test cases for Supplementary Cover Sheet for NEH Grant Programs XML generation service."""

    def test_generate_neh_cover_sheet_xml_basic_success(self):
        """Test basic NEH Cover Sheet XML generation with all required fields."""
        application_data = {
            "major_field": "History: U.S. History",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "50000.00",
                "total_from_neh": "50000.00",
                "total_project_costs": "50000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "History: U.S. History",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data
        # Verify root element with namespace
        assert "<SupplementaryCoverSheetforNEHGrantPrograms_3_0:" in xml_data
        # Verify discipline codes are transformed correctly
        assert "PDMajorField>4<" in xml_data  # "History: U.S. History" -> "4"
        assert "ProjFieldCode>4<" in xml_data  # Same mapping, moved to ApplicationInfoGroup
        # Verify organization type (passed through as full value)
        assert "OrganizationType>1330: University<" in xml_data  # Full value preserved

    def test_generate_neh_cover_sheet_xml_discipline_code_mapping(self):
        """Test that discipline display values are correctly mapped to XSD numeric codes."""
        test_cases = [
            ("Arts: General", "117"),
            ("History: Classical History", "6"),
            ("Philosophy: Ethics", "1249"),
            ("Literature: American Literature", "55"),
            ("Religion: General", "63"),
            ("Social Science: Anthropology", "108"),
        ]

        for display_value, expected_code in test_cases:
            application_data = {
                "major_field": display_value,
                "organization_type": "1330: University",
                "funding_group": {
                    "outright_funds": "10000.00",
                    "total_from_neh": "10000.00",
                    "total_project_costs": "10000.00",
                },
                "application_info": {
                    "additional_funding": False,
                    "application_type": "New",
                },
                "primary_project_discipline": display_value,
            }

            service = XMLGenerationService()
            request = XMLGenerationRequest(
                application_data=application_data,
                transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
            )

            response = service.generate_xml(request)

            assert response.success is True, f"Failed for {display_value}"
            assert f"PDMajorField>{expected_code}<" in response.xml_data
            assert f"ProjFieldCode>{expected_code}<" in response.xml_data

    def test_generate_neh_cover_sheet_xml_organization_type_passthrough(self):
        """Test that organization type values are passed through as-is (full value)."""
        test_cases = [
            "1326: Center For Advanced Study/Research Institute",
            "1330: University",
            "1344: Public Library",
            "1349: Art Museum",
            "1329: Four-Year College",
            "2819: Unknown",
        ]

        for display_value in test_cases:
            application_data = {
                "major_field": "History: U.S. History",
                "organization_type": display_value,
                "funding_group": {
                    "outright_funds": "10000.00",
                    "total_from_neh": "10000.00",
                    "total_project_costs": "10000.00",
                },
                "application_info": {
                    "additional_funding": False,
                    "application_type": "New",
                },
                "primary_project_discipline": "History: U.S. History",
            }

            service = XMLGenerationService()
            request = XMLGenerationRequest(
                application_data=application_data,
                transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
            )

            response = service.generate_xml(request)

            assert response.success is True, f"Failed for {display_value}"
            # Organization type should be passed through as full value
            assert f"OrganizationType>{display_value}<" in response.xml_data

    def test_generate_neh_cover_sheet_xml_with_federal_match(self):
        """Test NEH Cover Sheet XML generation with federal match funding."""
        application_data = {
            "major_field": "Philosophy: General",
            "organization_type": "1329: Four-Year College",
            "funding_group": {
                "outright_funds": "25000.00",
                "federal_match": "25000.00",
                "total_from_neh": "50000.00",
                "cost_sharing": "10000.00",
                "total_project_costs": "60000.00",
            },
            "application_info": {
                "additional_funding": True,
                "additional_funding_explanation": "NSF pending grant application",
                "application_type": "New",
            },
            "primary_project_discipline": "Philosophy: General",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify funding structure
        assert "ProjectFundingGroup>" in xml_data
        assert "ReqOutrightAmount>25000.00<" in xml_data
        assert "ReqMatchAmount>25000.00<" in xml_data
        assert "TotalFromNEH>50000.00<" in xml_data
        assert "CostSharing>10000.00<" in xml_data
        assert "TotalProjectCosts>60000.00<" in xml_data

    def test_generate_neh_cover_sheet_xml_application_info_structure(self):
        """Test NEH Cover Sheet XML generation with application info nested structure."""
        application_data = {
            "major_field": "Literature: General",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "30000.00",
                "total_from_neh": "30000.00",
                "total_project_costs": "30000.00",
            },
            "application_info": {
                "additional_funding": True,
                "additional_funding_explanation": "State humanities council",
                "application_type": "Supplement",
                "supplemental_grant_numbers": "NEH-12345-20",
            },
            "primary_project_discipline": "Literature: General",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify application info structure
        assert "ApplicationInfoGroup>" in xml_data
        assert "AdditionalFunding>Yes<" in xml_data  # Boolean converted to Yes
        assert "AdditionalFundingExplanation>State humanities council<" in xml_data
        assert "TypeofApplication>Supplement<" in xml_data
        assert "SupplementalGrantNumber>NEH-12345-20<" in xml_data

    def test_generate_neh_cover_sheet_xml_additional_funding_false(self):
        """Test NEH Cover Sheet XML generation with additional_funding=False."""
        application_data = {
            "major_field": "Religion: General",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "20000.00",
                "total_from_neh": "20000.00",
                "total_project_costs": "20000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "Religion: General",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify boolean conversion
        assert "AdditionalFunding>No<" in xml_data

    def test_generate_neh_cover_sheet_xml_with_secondary_and_tertiary_disciplines(self):
        """Test NEH Cover Sheet XML generation with optional secondary and tertiary disciplines."""
        application_data = {
            "major_field": "Interdisciplinary: American Studies",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "75000.00",
                "total_from_neh": "75000.00",
                "total_project_costs": "75000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "Interdisciplinary: American Studies",
            "secondary_project_discipline": "History: U.S. History",
            "tertiary_project_discipline": "Literature: American Literature",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify all three disciplines
        assert "ProjFieldCode>76<" in xml_data  # "Interdisciplinary: American Studies" -> "76"
        assert "SecondaryProjFieldCode>4<" in xml_data  # "History: U.S. History" -> "4"
        assert "TertiaryProjFieldCode>55<" in xml_data  # "Literature: American Literature" -> "55"

    def test_generate_neh_cover_sheet_xml_without_optional_disciplines(self):
        """Test NEH Cover Sheet XML generation without optional secondary/tertiary disciplines."""
        application_data = {
            "major_field": "Languages: English",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "40000.00",
                "total_from_neh": "40000.00",
                "total_project_costs": "40000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "Languages: English",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify primary is present, secondary/tertiary are not
        assert "ProjFieldCode>40<" in xml_data  # "Languages: English" -> "40"
        assert "SecondaryProjFieldCode" not in xml_data
        assert "TertiaryProjFieldCode" not in xml_data

    def test_generate_neh_cover_sheet_xml_namespace_and_version(self):
        """Test that NEH Cover Sheet XML includes proper namespace and version attribute."""
        application_data = {
            "major_field": "History: U.S. History",
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "10000.00",
                "total_from_neh": "10000.00",
                "total_project_costs": "10000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "History: U.S. History",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace
        assert (
            "xmlns:SupplementaryCoverSheetforNEHGrantPrograms_3_0="
            '"http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0"'
            in xml_data
        )
        # Verify FormVersion attribute
        assert 'FormVersion="3.0"' in xml_data

    def test_generate_neh_cover_sheet_xml_field_of_study_additional_values(self):
        """Test that field of study values (which extend project discipline) work correctly."""
        # These values are only available for major_field, not for project disciplines
        application_data = {
            "major_field": "Other: Digital Humanities",  # Additional field of study value
            "organization_type": "1330: University",
            "funding_group": {
                "outright_funds": "60000.00",
                "total_from_neh": "60000.00",
                "total_project_costs": "60000.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "Interdisciplinary: General",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify the additional field of study code
        assert "PDMajorField>2872<" in xml_data  # "Other: Digital Humanities" -> "2872"

    def test_generate_neh_cover_sheet_xml_matches_legacy_structure(self):
        """Test NEH Cover Sheet XML generation matches legacy XML structure exactly.

        This test validates that generated XML contains all required elements and values
        from the legacy system output, without enforcing element ordering.
        """
        # Input JSON matching database structure
        application_data = {
            "major_field": "Arts: General",
            "organization_type": "1326: Center For Advanced Study/Research Institute",
            "funding_group": {
                "outright_funds": "1",
                "federal_match": "2",
                "total_from_neh": "3.00",
                "total_project_costs": "3.00",
            },
            "application_info": {
                "additional_funding": False,
                "application_type": "New",
            },
            "primary_project_discipline": "Arts: General",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify root element and namespaces
        assert (
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0:SupplementaryCoverSheetforNEHGrantPrograms_3_0"
            in xml_data
        )
        assert 'xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"' in xml_data
        assert 'xmlns:glob="http://apply.grants.gov/system/Global-V1.0"' in xml_data
        assert 'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"' in xml_data
        assert 'FormVersion="3.0"' in xml_data
        assert (
            'xmlns:SupplementaryCoverSheetforNEHGrantPrograms_3_0="http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0"'
            in xml_data
        )

        # Verify PDMajorField (Project Director Major Field)
        assert "PDMajorField>117<" in xml_data  # "Arts: General" -> "117"

        # Verify OrganizationType (passed through as-is)
        assert "OrganizationType>1326: Center For Advanced Study/Research Institute<" in xml_data

        # Verify ProjectFundingGroup structure
        assert "ProjectFundingGroup>" in xml_data
        assert "ReqOutrightAmount>1.00<" in xml_data
        assert "ReqMatchAmount>2.00<" in xml_data
        assert "TotalFromNEH>3.00<" in xml_data
        assert "TotalProjectCosts>3.00<" in xml_data

        # Verify ApplicationInfoGroup structure
        assert "ApplicationInfoGroup>" in xml_data
        assert "AdditionalFunding>No<" in xml_data  # False -> "No"
        assert "TypeofApplication>New<" in xml_data

        # CRITICAL: Verify ProjFieldCode is present and correctly nested in ApplicationInfoGroup
        assert "ProjFieldCode>117<" in xml_data  # "Arts: General" -> "117"

        # Verify ProjFieldCode appears after ApplicationInfoGroup opens (proper nesting)
        # This ensures the field is inside the group, not at root level
        app_info_start = xml_data.find("ApplicationInfoGroup>")
        app_info_end = xml_data.find(
            "</SupplementaryCoverSheetforNEHGrantPrograms_3_0:ApplicationInfoGroup"
        )
        proj_field_pos = xml_data.find("ProjFieldCode>117")

        assert (
            app_info_start < proj_field_pos < app_info_end
        ), "ProjFieldCode must be nested inside ApplicationInfoGroup"


@pytest.mark.xml_validation
class TestSupplementaryNEHCoverSheetXSDValidation:
    """XSD validation tests for Supplementary Cover Sheet for NEH Grant Programs form XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD cache directory not found. Run 'make fetch-xsds' to download schemas.")
        # Check if NEH Cover Sheet XSD exists
        xsd_path = xsd_cache_dir / "SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd not found in cache. "
                "Run 'make fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def neh_cover_sheet_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with NEH Cover Sheet form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-NEH-001",
            opportunity_title="NEH Cover Sheet Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="45.160"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-NEH-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create NEH Cover Sheet form with XML transform config
        neh_form = FormFactory.create(
            form_name="Supplementary Cover Sheet for NEH Grant Programs",
            short_form_name="SupplementaryCoverSheetforNEHGrantPrograms",
            form_version="3.0",
            json_to_xml_schema=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="NEH Cover Sheet Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=neh_form)

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "major_field": "History: U.S. History",
                "organization_type": "1330: University",
                "funding_group": {
                    "outright_funds": "50000.00",
                    "federal_match": "25000.00",
                    "total_from_neh": "75000.00",
                    "cost_sharing": "15000.00",
                    "total_project_costs": "90000.00",
                },
                "application_info": {
                    "additional_funding": True,
                    "additional_funding_explanation": "State Council pending",
                    "application_type": "New",
                },
                "primary_project_discipline": "History: U.S. History",
                "secondary_project_discipline": "Interdisciplinary: American Studies",
            },
        )

        return application

    def test_neh_cover_sheet_submission_xml_validates_against_xsd(
        self, neh_cover_sheet_application, xsd_validator, db_session
    ):
        """Test that complete NEH Cover Sheet submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=neh_cover_sheet_application,
            legacy_tracking_number=77777777,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(neh_cover_sheet_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract NEH Cover Sheet form element
        neh_ns = (
            "{http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0}"
        )
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        neh_elements = forms_element.findall(
            f".//{neh_ns}SupplementaryCoverSheetforNEHGrantPrograms_3_0"
        )
        assert (
            len(neh_elements) == 1
        ), "Expected exactly one SupplementaryCoverSheetforNEHGrantPrograms_3_0 element"

        # Validate NEH Cover Sheet form against XSD
        neh_element = neh_elements[0]
        neh_xml = lxml_etree.tostring(neh_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/"
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(neh_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"NEH Cover Sheet XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{neh_xml[:2000]}"
        )

    def test_neh_cover_sheet_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that NEH Cover Sheet with minimal required data validates against XSD."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-NEH-MIN-001",
            opportunity_title="NEH Cover Sheet Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="45.161"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-NEH-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        neh_form = FormFactory.create(
            form_name="Supplementary Cover Sheet for NEH Grant Programs",
            short_form_name="SupplementaryCoverSheetforNEHGrantPrograms",
            form_version="3.0",
            json_to_xml_schema=NEH_COVER_SHEET_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition,
            application_name="NEH Cover Sheet Minimal Test Application",
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=neh_form)

        # Minimal required data per XSD
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "major_field": "Philosophy: General",
                "organization_type": "1329: Four-Year College",
                "funding_group": {
                    "outright_funds": "10000.00",
                    "total_from_neh": "10000.00",
                    "total_project_costs": "10000.00",
                },
                "application_info": {
                    "additional_funding": False,
                    "application_type": "New",
                },
                "primary_project_discipline": "Philosophy: General",
            },
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=88888888,
        )

        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        neh_ns = (
            "{http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0}"
        )
        forms_element = root.find(".//Forms")
        neh_elements = forms_element.findall(
            f".//{neh_ns}SupplementaryCoverSheetforNEHGrantPrograms_3_0"
        )
        assert len(neh_elements) == 1

        neh_xml = lxml_etree.tostring(neh_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/"
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(neh_xml, xsd_path)

        assert validation_result["valid"], (
            f"NEH Cover Sheet minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{neh_xml}"
        )
