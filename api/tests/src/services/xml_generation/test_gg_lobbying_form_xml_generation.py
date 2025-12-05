"""Tests for GG_LobbyingForm XML generation.

This module tests the XML generation for the Grants.gov Lobbying Form (GG_LobbyingForm),
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd
"""

from datetime import date

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.gg_lobbying_form import (
    FORM_XML_TRANSFORM_RULES as GG_LOBBYING_FORM_TRANSFORM_RULES,
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
class TestGGLobbyingFormXMLGeneration:
    """Test cases for GG_LobbyingForm XML generation service."""

    def test_generate_gg_lobbying_form_xml_basic_success(self):
        """Test basic GG_LobbyingForm XML generation with minimal required data."""
        # Minimal GG_LobbyingForm data matching the XSD requirements
        application_data = {
            "organization_name": "Test Research Organization",
            "authorized_representative_name": {
                "first_name": "John",
                "last_name": "Smith",
            },
            "authorized_representative_title": "Principal Investigator",
            "authorized_representative_signature": "John Smith",
            "submitted_date": "2025-01-15",
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements
        xml_data = response.xml_data
        assert "<GG_LobbyingForm:LobbyingForm" in xml_data
        assert (
            "<GG_LobbyingForm:ApplicantName>Test Research Organization</GG_LobbyingForm:ApplicantName>"
            in xml_data
        )
        assert "<GG_LobbyingForm:AuthorizedRepresentativeName>" in xml_data
        assert (
            "<GG_LobbyingForm:AuthorizedRepresentativeTitle>Principal Investigator</GG_LobbyingForm:AuthorizedRepresentativeTitle>"
            in xml_data
        )
        assert (
            "<GG_LobbyingForm:AuthorizedRepresentativeSignature>John Smith</GG_LobbyingForm:AuthorizedRepresentativeSignature>"
            in xml_data
        )
        assert (
            "<GG_LobbyingForm:SubmittedDate>2025-01-15</GG_LobbyingForm:SubmittedDate>" in xml_data
        )

    def test_generate_gg_lobbying_form_xml_with_full_name(self):
        """Test GG_LobbyingForm XML generation with full name including prefix/suffix."""
        application_data = {
            "organization_name": "National Institute of Science",
            "authorized_representative_name": {
                "prefix": "Dr.",
                "first_name": "Robert",
                "middle_name": "James",
                "last_name": "Williams",
                "suffix": "Jr.",
            },
            "authorized_representative_title": "Senior Scientist",
            "authorized_representative_signature": "Robert J. Williams Jr.",
            "submitted_date": "2025-03-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify nested name structure with GlobalLibrary namespace
        assert "<GG_LobbyingForm:AuthorizedRepresentativeName>" in xml_data
        assert "<globLib:PrefixName>Dr.</globLib:PrefixName>" in xml_data
        assert "<globLib:FirstName>Robert</globLib:FirstName>" in xml_data
        assert "<globLib:MiddleName>James</globLib:MiddleName>" in xml_data
        assert "<globLib:LastName>Williams</globLib:LastName>" in xml_data
        assert "<globLib:SuffixName>Jr.</globLib:SuffixName>" in xml_data
        assert "</GG_LobbyingForm:AuthorizedRepresentativeName>" in xml_data

    def test_generate_gg_lobbying_form_xml_namespace_and_version(self):
        """Test that GG_LobbyingForm XML includes proper namespace and version attribute."""
        application_data = {
            "organization_name": "Test Organization",
            "authorized_representative_name": {
                "first_name": "Test",
                "last_name": "User",
            },
            "authorized_representative_title": "Director",
            "authorized_representative_signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace
        assert (
            'xmlns:GG_LobbyingForm="http://apply.grants.gov/forms/GG_LobbyingForm-V1.1"' in xml_data
        )
        # Verify FormVersion attribute
        assert 'FormVersion="1.1"' in xml_data

    def test_generate_gg_lobbying_form_xml_element_order_matches_xsd(self):
        """Test that XML elements are in the correct order per XSD sequence."""
        application_data = {
            "organization_name": "Test Organization",
            "authorized_representative_name": {
                "prefix": "Dr.",
                "first_name": "Test",
                "middle_name": "M",
                "last_name": "User",
                "suffix": "PhD",
            },
            "authorized_representative_title": "Director",
            "authorized_representative_signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify elements appear in XSD order
        # Order per XSD: ApplicantName, AuthorizedRepresentativeName, AuthorizedRepresentativeTitle,
        #                AuthorizedRepresentativeSignature, SubmittedDate
        applicant_pos = xml_data.find("ApplicantName")
        rep_name_pos = xml_data.find("AuthorizedRepresentativeName")
        rep_title_pos = xml_data.find("AuthorizedRepresentativeTitle")
        rep_sig_pos = xml_data.find("AuthorizedRepresentativeSignature")
        date_pos = xml_data.find("SubmittedDate")

        # All elements should exist and be in order
        assert (
            applicant_pos < rep_name_pos < rep_title_pos < rep_sig_pos < date_pos
        ), "Elements not in XSD sequence order"


@pytest.mark.xml_validation
class TestGGLobbyingFormXSDValidation:
    """XSD validation tests for GG_LobbyingForm XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        from pathlib import Path

        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        # Check if GG_LobbyingForm XSD exists
        gg_lobbying_form_xsd_path = xsd_cache_dir / "GG_LobbyingForm-V1.1.xsd"
        if not gg_lobbying_form_xsd_path.exists():
            pytest.skip(
                "GG_LobbyingForm-V1.1.xsd not found in cache. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def gg_lobbying_form_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with GG_LobbyingForm form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-GG-LOBBYING-001",
            opportunity_title="GG_LobbyingForm Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-GG-LOBBYING-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create GG_LobbyingForm form with XML transform config
        gg_lobbying_form = FormFactory.create(
            form_name="Grants.gov Lobbying Form",
            short_form_name="GG_LobbyingForm",
            form_version="1.1",
            json_to_xml_schema=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="GG_LobbyingForm Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(
            competition=competition, form=gg_lobbying_form
        )

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "organization_name": "National Research Foundation",
                "authorized_representative_name": {
                    "prefix": "Dr.",
                    "first_name": "Emily",
                    "middle_name": "Rose",
                    "last_name": "Chen",
                    "suffix": "PhD",
                },
                "authorized_representative_title": "Principal Investigator",
                "authorized_representative_signature": "Emily R. Chen, PhD",
                "submitted_date": "2025-01-15",
            },
        )

        return application

    def test_gg_lobbying_form_submission_xml_validates_against_xsd(
        self, gg_lobbying_form_application, xsd_validator, db_session
    ):
        """Test that complete GG_LobbyingForm submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=gg_lobbying_form_application,
            legacy_tracking_number=99999999,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(gg_lobbying_form_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract GG_LobbyingForm form element
        gg_lobbying_ns = "{http://apply.grants.gov/forms/GG_LobbyingForm-V1.1}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        gg_lobbying_elements = forms_element.findall(f".//{gg_lobbying_ns}LobbyingForm")
        assert len(gg_lobbying_elements) == 1, "Expected exactly one LobbyingForm element"

        # Validate GG_LobbyingForm form against XSD
        gg_lobbying_element = gg_lobbying_elements[0]
        gg_lobbying_xml = lxml_etree.tostring(gg_lobbying_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(gg_lobbying_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"GG_LobbyingForm XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{gg_lobbying_xml[:2000]}"
        )

    def test_gg_lobbying_form_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that GG_LobbyingForm with minimal required data validates against XSD."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-GG-LOBBYING-MIN-001",
            opportunity_title="GG_LobbyingForm Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-GG-LOBBYING-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        gg_lobbying_form = FormFactory.create(
            form_name="Grants.gov Lobbying Form",
            short_form_name="GG_LobbyingForm",
            form_version="1.1",
            json_to_xml_schema=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="GG_LobbyingForm Minimal Test Application"
        )

        competition_form = CompetitionFormFactory.create(
            competition=competition, form=gg_lobbying_form
        )

        # Minimal required data per XSD
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "organization_name": "Minimal Test Org",
                "authorized_representative_name": {
                    "first_name": "John",
                    "last_name": "Doe",
                },
                "authorized_representative_title": "Director",
                "authorized_representative_signature": "John Doe",
                "submitted_date": "2025-01-01",
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

        gg_lobbying_ns = "{http://apply.grants.gov/forms/GG_LobbyingForm-V1.1}"
        forms_element = root.find(".//Forms")
        gg_lobbying_elements = forms_element.findall(f".//{gg_lobbying_ns}LobbyingForm")
        assert len(gg_lobbying_elements) == 1

        gg_lobbying_xml = lxml_etree.tostring(gg_lobbying_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(gg_lobbying_xml, xsd_path)

        assert validation_result["valid"], (
            f"GG_LobbyingForm minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{gg_lobbying_xml}"
        )

