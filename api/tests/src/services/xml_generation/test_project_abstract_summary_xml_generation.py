"""Tests for Project Abstract Summary form XML generation.

This module tests the XML generation for the Project Abstract Summary form,
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.project_abstract_summary import (
    FORM_XML_TRANSFORM_RULES as PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
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


@pytest.mark.xml_validation
class TestProjectAbstractSummaryXMLGeneration:
    """Test cases for Project Abstract Summary XML generation service."""

    def test_generate_project_abstract_summary_xml_basic_success(self):
        """Test basic Project Abstract Summary XML generation with all required fields."""
        application_data = {
            "funding_opportunity_number": "HHS-2025-ACF-001",
            "applicant_name": "Test Research Organization",
            "project_title": "Research Study on Climate Change Adaptation",
            "project_abstract": "This project will study the effects of climate change on coastal communities.",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data
        # Elements use namespace prefix Project_AbstractSummary_2_0:
        assert "<Project_AbstractSummary_2_0:Project_AbstractSummary_2_0" in xml_data
        assert "FundingOpportunityNumber>HHS-2025-ACF-001<" in xml_data
        assert "OrganizationName>Test Research Organization<" in xml_data
        assert "ProjectTitle>Research Study on Climate Change Adaptation<" in xml_data
        assert (
            "ProjectAbstract>This project will study the effects of climate change on coastal communities.<"
            in xml_data
        )

    def test_generate_project_abstract_summary_xml_with_cfda_number(self):
        """Test Project Abstract Summary XML generation with optional CFDA/Assistance Listing number."""
        application_data = {
            "funding_opportunity_number": "NSF-2025-001",
            "assistance_listing_number": "47.070",
            "applicant_name": "University of Testing",
            "project_title": "Advanced Computing Research Initiative",
            "project_abstract": "This research initiative focuses on developing next-generation computing algorithms.",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify CFDA number is included (elements use namespace prefix)
        assert "CFDANumber>47.070<" in xml_data
        assert "FundingOpportunityNumber>NSF-2025-001<" in xml_data

    def test_generate_project_abstract_summary_xml_without_cfda_number(self):
        """Test Project Abstract Summary XML generation without CFDA number (optional field)."""
        application_data = {
            "funding_opportunity_number": "DOE-2025-FOA-001",
            "applicant_name": "Energy Research Institute",
            "project_title": "Renewable Energy Innovation Project",
            "project_abstract": "This project develops innovative renewable energy solutions for rural communities.",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # CFDA number should not be present
        assert "CFDANumber" not in xml_data
        # Other fields should be present (elements use namespace prefix)
        assert "FundingOpportunityNumber>DOE-2025-FOA-001<" in xml_data
        assert "OrganizationName>Energy Research Institute<" in xml_data

    def test_generate_project_abstract_summary_xml_namespace_and_version(self):
        """Test that Project Abstract Summary XML includes proper namespace and version attribute."""
        application_data = {
            "funding_opportunity_number": "TEST-2025-001",
            "applicant_name": "Test Organization",
            "project_title": "Test Project",
            "project_abstract": "Test abstract content.",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace (uses prefixed namespace)
        assert (
            'xmlns:Project_AbstractSummary_2_0="http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0"'
            in xml_data
        )
        # Verify FormVersion attribute
        assert 'FormVersion="2.0"' in xml_data

    def test_generate_project_abstract_summary_xml_element_order_matches_xsd(self):
        """Test that XML elements are in the correct order per XSD sequence."""
        application_data = {
            "funding_opportunity_number": "TEST-2025-001",
            "assistance_listing_number": "93.001",
            "applicant_name": "Test Organization",
            "project_title": "Test Project Title",
            "project_abstract": "Test project abstract content for validation.",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify elements appear in XSD order:
        # FundingOpportunityNumber, CFDANumber, OrganizationName, ProjectTitle, ProjectAbstract
        fon_pos = xml_data.find("FundingOpportunityNumber")
        cfda_pos = xml_data.find("CFDANumber")
        org_pos = xml_data.find("OrganizationName")
        title_pos = xml_data.find("ProjectTitle")
        abstract_pos = xml_data.find("ProjectAbstract")

        # All elements should exist and be in order
        assert fon_pos < cfda_pos < org_pos < title_pos < abstract_pos

    def test_generate_project_abstract_summary_xml_long_abstract(self):
        """Test Project Abstract Summary XML generation with a long abstract (up to 4000 chars)."""
        long_abstract = (
            "This comprehensive research project addresses multiple aspects of climate change "
            "adaptation in coastal communities. Our interdisciplinary team will examine the "
            "social, economic, and environmental factors that influence community resilience. "
            "The project includes extensive field research, community engagement activities, "
            "and policy analysis to develop actionable recommendations for local governments "
            "and community organizations."
        ) * 5  # Repeat to make it longer

        application_data = {
            "funding_opportunity_number": "NOAA-2025-001",
            "assistance_listing_number": "11.431",
            "applicant_name": "Coastal Research Consortium",
            "project_title": "Comprehensive Coastal Community Resilience Study",
            "project_abstract": long_abstract[:4000],  # Ensure within limit
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify the abstract is included (elements use namespace prefix)
        assert "ProjectAbstract>" in xml_data
        assert "</Project_AbstractSummary_2_0:ProjectAbstract>" in xml_data


@pytest.mark.xml_validation
class TestProjectAbstractSummaryXSDValidation:
    """XSD validation tests for Project Abstract Summary form XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        # Check if Project Abstract Summary XSD exists
        xsd_path = xsd_cache_dir / "Project_AbstractSummary_2_0-V2.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "Project_AbstractSummary_2_0-V2.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def project_abstract_summary_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with Project Abstract Summary form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-PAS-001",
            opportunity_title="Project Abstract Summary Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-PAS-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create Project Abstract Summary form with XML transform config
        pas_form = FormFactory.create(
            form_name="Project Abstract Summary",
            short_form_name="Project_AbstractSummary_2_0",
            form_version="2.0",
            json_to_xml_schema=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Project Abstract Summary Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=pas_form)

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "funding_opportunity_number": "TEST-PAS-001",
                "assistance_listing_number": "93.001",
                "applicant_name": "National Health Research Institute",
                "project_title": "Community Health Improvement Initiative",
                "project_abstract": (
                    "This project aims to improve health outcomes in underserved communities "
                    "through targeted interventions, community engagement, and data-driven "
                    "approaches to healthcare delivery. Our comprehensive strategy includes "
                    "mobile health clinics, telehealth services, and community health worker "
                    "training programs."
                ),
            },
        )

        return application

    def test_project_abstract_summary_submission_xml_validates_against_xsd(
        self, project_abstract_summary_application, xsd_validator, db_session
    ):
        """Test that complete Project Abstract Summary submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=project_abstract_summary_application,
            legacy_tracking_number=77777777,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(
            project_abstract_summary_application, application_submission
        )
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract Project Abstract Summary form element
        pas_ns = "{http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        pas_elements = forms_element.findall(f".//{pas_ns}Project_AbstractSummary_2_0")
        assert len(pas_elements) == 1, "Expected exactly one Project_AbstractSummary_2_0 element"

        # Validate Project Abstract Summary form against XSD
        pas_element = pas_elements[0]
        pas_xml = lxml_etree.tostring(pas_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(pas_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"Project Abstract Summary XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{pas_xml[:2000]}"
        )

    def test_project_abstract_summary_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that Project Abstract Summary with minimal required data validates against XSD."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-PAS-MIN-001",
            opportunity_title="Project Abstract Summary Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-PAS-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        pas_form = FormFactory.create(
            form_name="Project Abstract Summary",
            short_form_name="Project_AbstractSummary_2_0",
            form_version="2.0",
            json_to_xml_schema=PROJECT_ABSTRACT_SUMMARY_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition,
            application_name="Project Abstract Summary Minimal Test Application",
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=pas_form)

        # Minimal required data per XSD (no CFDA/assistance listing number)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "funding_opportunity_number": "TEST-PAS-MIN-001",
                "applicant_name": "Minimal Test Organization",
                "project_title": "Minimal Test Project",
                "project_abstract": "This is a minimal project abstract for testing purposes.",
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

        pas_ns = "{http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0}"
        forms_element = root.find(".//Forms")
        pas_elements = forms_element.findall(f".//{pas_ns}Project_AbstractSummary_2_0")
        assert len(pas_elements) == 1

        pas_xml = lxml_etree.tostring(pas_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(pas_xml, xsd_path)

        assert validation_result["valid"], (
            f"Project Abstract Summary minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{pas_xml}"
        )
