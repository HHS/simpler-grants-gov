"""Tests for CD511 form XML generation.

This module tests the XML generation for the CD511 (Certification Regarding Lobbying) form,
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.cd511 import FORM_XML_TRANSFORM_RULES as CD511_TRANSFORM_RULES
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
class TestCD511XMLGeneration:
    """Test cases for CD511 XML generation service."""

    def test_generate_cd511_xml_basic_success(self):
        """Test basic CD511 XML generation with minimal required data."""
        # Minimal CD511 data matching the XSD requirements
        application_data = {
            "applicant_name": "Test Research Organization",
            "project_name": "Research Study on Climate Change",
            "contact_person": {
                "first_name": "John",
                "last_name": "Smith",
            },
            "contact_person_title": "Principal Investigator",
            "signature": "John Smith",
            "submitted_date": "2025-01-15",
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements
        xml_data = response.xml_data
        assert "<CD511" in xml_data
        assert (
            "<CD511:OrganizationName>Test Research Organization</CD511:OrganizationName>"
            in xml_data
        )
        assert "<CD511:ProjectName>Research Study on Climate Change</CD511:ProjectName>" in xml_data
        assert "<CD511:Title>Principal Investigator</CD511:Title>" in xml_data
        assert "<CD511:Signature>John Smith</CD511:Signature>" in xml_data
        assert "<CD511:SubmittedDate>2025-01-15</CD511:SubmittedDate>" in xml_data

    def test_generate_cd511_xml_with_award_number(self):
        """Test CD511 XML generation with award number instead of project name."""
        application_data = {
            "applicant_name": "University of Testing",
            "award_number": "1R01GM123456-01",
            "contact_person": {
                "first_name": "Jane",
                "last_name": "Doe",
            },
            "contact_person_title": "Research Director",
            "signature": "Jane Doe",
            "submitted_date": "2025-02-20",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify award number is included
        assert "<CD511:AwardNumber>1R01GM123456-01</CD511:AwardNumber>" in xml_data
        # Project name should not be present
        assert "ProjectName" not in xml_data

    def test_generate_cd511_xml_with_full_contact_name(self):
        """Test CD511 XML generation with full contact person name including prefix/suffix."""
        application_data = {
            "applicant_name": "National Institute of Science",
            "project_name": "Advanced Research Project",
            "contact_person": {
                "prefix": "Dr.",
                "first_name": "Robert",
                "middle_name": "James",
                "last_name": "Williams",
                "suffix": "Jr.",
            },
            "contact_person_title": "Senior Scientist",
            "signature": "Robert J. Williams Jr.",
            "submitted_date": "2025-03-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify nested name structure with GlobalLibrary namespace
        assert "<CD511:ContactName>" in xml_data
        assert "<globLib:PrefixName>Dr.</globLib:PrefixName>" in xml_data
        assert "<globLib:FirstName>Robert</globLib:FirstName>" in xml_data
        assert "<globLib:MiddleName>James</globLib:MiddleName>" in xml_data
        assert "<globLib:LastName>Williams</globLib:LastName>" in xml_data
        assert "<globLib:SuffixName>Jr.</globLib:SuffixName>" in xml_data
        assert "</CD511:ContactName>" in xml_data

    def test_generate_cd511_xml_with_both_award_and_project(self):
        """Test CD511 XML generation with both award number and project name."""
        application_data = {
            "applicant_name": "Research Foundation",
            "award_number": "AWD-2025-001",
            "project_name": "Continuation Study",
            "contact_person": {
                "first_name": "Alice",
                "last_name": "Johnson",
            },
            "contact_person_title": "Program Manager",
            "signature": "Alice Johnson",
            "submitted_date": "2025-04-15",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Both should be present
        assert "<CD511:AwardNumber>AWD-2025-001</CD511:AwardNumber>" in xml_data
        assert "<CD511:ProjectName>Continuation Study</CD511:ProjectName>" in xml_data

    def test_generate_cd511_xml_namespace_and_version(self):
        """Test that CD511 XML includes proper namespace and version attribute."""
        application_data = {
            "applicant_name": "Test Organization",
            "project_name": "Test Project",
            "contact_person": {
                "first_name": "Test",
                "last_name": "User",
            },
            "contact_person_title": "Tester",
            "signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace
        assert 'xmlns:CD511="http://apply.grants.gov/forms/CD511-V1.1"' in xml_data
        # Verify FormVersion attribute
        assert 'FormVersion="1.1"' in xml_data

    def test_generate_cd511_xml_element_order_matches_xsd(self):
        """Test that XML elements are in the correct order per XSD sequence."""
        application_data = {
            "applicant_name": "Test Organization",
            "award_number": "AWD-001",
            "project_name": "Test Project",
            "contact_person": {
                "prefix": "Dr.",
                "first_name": "Test",
                "middle_name": "M",
                "last_name": "User",
                "suffix": "PhD",
            },
            "contact_person_title": "Director",
            "signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=CD511_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify elements appear in XSD order
        # Order per XSD: OrganizationName, AwardNumber, ProjectName, ContactName, Title, Signature, SubmittedDate
        org_pos = xml_data.find("OrganizationName")
        award_pos = xml_data.find("AwardNumber")
        project_pos = xml_data.find("ProjectName")
        contact_pos = xml_data.find("ContactName")
        title_pos = xml_data.find("<CD511:Title>")  # Specific to avoid ContactName/Title confusion
        sig_pos = xml_data.find("Signature")
        date_pos = xml_data.find("SubmittedDate")

        # All elements should exist and be in order
        assert org_pos < award_pos < project_pos < contact_pos < title_pos < sig_pos < date_pos


@pytest.mark.xml_validation
class TestCD511XSDValidation:
    """XSD validation tests for CD511 form XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        # Check if CD511 XSD exists
        cd511_xsd_path = xsd_cache_dir / "CD511-V1.1.xsd"
        if not cd511_xsd_path.exists():
            pytest.skip(
                "CD511-V1.1.xsd not found in cache. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def cd511_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with CD511 form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-CD511-001",
            opportunity_title="CD511 Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-CD511-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create CD511 form with XML transform config
        cd511_form = FormFactory.create(
            form_name="CD511",
            short_form_name="CD511",
            form_version="1.1",
            json_to_xml_schema=CD511_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="CD511 Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=cd511_form)

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "applicant_name": "National Research Foundation",
                "award_number": "NRF-2025-12345",
                "project_name": "Advanced Science Research Initiative",
                "contact_person": {
                    "prefix": "Dr.",
                    "first_name": "Emily",
                    "middle_name": "Rose",
                    "last_name": "Chen",
                    "suffix": "PhD",
                },
                "contact_person_title": "Principal Investigator",
                "signature": "Emily R. Chen, PhD",
                "submitted_date": "2025-01-15",
            },
        )

        return application

    def test_cd511_submission_xml_validates_against_xsd(
        self, cd511_application, xsd_validator, db_session
    ):
        """Test that complete CD511 submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=cd511_application,
            legacy_tracking_number=77777777,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(cd511_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract CD511 form element
        cd511_ns = "{http://apply.grants.gov/forms/CD511-V1.1}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        cd511_elements = forms_element.findall(f".//{cd511_ns}CD511")
        assert len(cd511_elements) == 1, "Expected exactly one CD511 element"

        # Validate CD511 form against XSD
        cd511_element = cd511_elements[0]
        cd511_xml = lxml_etree.tostring(cd511_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(cd511_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"CD511 XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{cd511_xml[:2000]}"
        )

    def test_cd511_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that CD511 with minimal required data validates against XSD."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-CD511-MIN-001",
            opportunity_title="CD511 Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-CD511-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        cd511_form = FormFactory.create(
            form_name="CD511",
            short_form_name="CD511",
            form_version="1.1",
            json_to_xml_schema=CD511_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="CD511 Minimal Test Application"
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=cd511_form)

        # Minimal required data per XSD
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "applicant_name": "Minimal Test Org",  # Required
                "project_name": "Test Project",  # One of award_number or project_name required
                "contact_person": {  # Optional per XSD, but we include it
                    "first_name": "John",
                    "last_name": "Doe",
                },
                "contact_person_title": "Director",  # Required
                "signature": "John Doe",  # Required
                "submitted_date": "2025-01-01",  # Required
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

        cd511_ns = "{http://apply.grants.gov/forms/CD511-V1.1}"
        forms_element = root.find(".//Forms")
        cd511_elements = forms_element.findall(f".//{cd511_ns}CD511")
        assert len(cd511_elements) == 1

        cd511_xml = lxml_etree.tostring(cd511_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(cd511_xml, xsd_path)

        assert validation_result["valid"], (
            f"CD511 minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{cd511_xml}"
        )
