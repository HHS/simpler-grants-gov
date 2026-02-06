"""Tests for SF-424B form XML generation.

This module tests the XML generation for the SF-424B (Assurances for Non-Construction Programs) form,
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sf424b import FORM_XML_TRANSFORM_RULES as SF424B_TRANSFORM_RULES
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
class TestSF424BXMLGeneration:
    """Test cases for SF-424B XML generation service."""

    def test_generate_sf424b_xml_basic_success(self):
        """Test basic SF-424B XML generation with all fields."""
        # SF-424B data matching the XSD requirements
        application_data = {
            "signature": "John Smith",
            "title": "Executive Director",
            "applicant_organization": "Test Research Organization",
            "date_signed": "2025-01-15",
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify XML contains expected elements
        xml_data = response.xml_data
        assert "<SF424B:Assurances" in xml_data
        assert (
            "<SF424B:ApplicantOrganizationName>Test Research Organization</SF424B:ApplicantOrganizationName>"
            in xml_data
        )
        assert "<SF424B:SubmittedDate>2025-01-15</SF424B:SubmittedDate>" in xml_data

    def test_generate_sf424b_xml_with_authorized_representative(self):
        """Test SF-424B XML generation with authorized representative nested element."""
        application_data = {
            "signature": "Jane Doe",
            "title": "Research Director",
            "applicant_organization": "University of Testing",
            "date_signed": "2025-02-20",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify AuthorizedRepresentative structure
        assert "<SF424B:AuthorizedRepresentative>" in xml_data
        assert "<SF424B:RepresentativeName>Jane Doe</SF424B:RepresentativeName>" in xml_data
        assert (
            "<SF424B:RepresentativeTitle>Research Director</SF424B:RepresentativeTitle>" in xml_data
        )
        assert "</SF424B:AuthorizedRepresentative>" in xml_data

    def test_generate_sf424b_xml_minimal_data(self):
        """Test SF-424B XML generation with minimal data (organization only)."""
        # Only applicant organization - other fields optional
        application_data = {
            "applicant_organization": "Minimal Test Organization",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify organization name is included
        assert (
            "<SF424B:ApplicantOrganizationName>Minimal Test Organization</SF424B:ApplicantOrganizationName>"
            in xml_data
        )
        # AuthorizedRepresentative should not be present when no signature/title
        # (depends on conditional transform behavior)

    def test_generate_sf424b_xml_namespace_and_attributes(self):
        """Test that SF-424B XML includes proper namespace and required attributes."""
        application_data = {
            "signature": "Test User",
            "title": "Director",
            "applicant_organization": "Test Organization",
            "date_signed": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace
        assert 'xmlns:SF424B="http://apply.grants.gov/forms/SF424B-V1.1"' in xml_data
        # Verify programType attribute (Non-Construction for SF-424B)
        assert 'programType="Non-Construction"' in xml_data
        # Verify coreSchemaVersion attribute
        assert 'coreSchemaVersion="1.1"' in xml_data

    def test_generate_sf424b_xml_element_order_matches_xsd(self):
        """Test that XML elements are in the correct order per XSD sequence."""
        application_data = {
            "signature": "Test User",
            "title": "Director",
            "applicant_organization": "Test Organization",
            "date_signed": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify elements appear in XSD order:
        # 1. FormVersionIdentifier (handled by framework)
        # 2. AuthorizedRepresentative (optional)
        # 3. ApplicantOrganizationName (optional)
        # 4. SubmittedDate (optional)
        auth_rep_pos = xml_data.find("AuthorizedRepresentative")
        org_pos = xml_data.find("ApplicantOrganizationName")
        date_pos = xml_data.find("SubmittedDate")

        # All elements should exist and be in order
        assert auth_rep_pos < org_pos < date_pos

    def test_generate_sf424b_xml_matches_legacy_format(self):
        """Test that generated XML matches legacy Grants.gov XML format exactly."""
        
        # Input data matching the legacy XML sample
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-06",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Parse the generated XML
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        # Define namespaces for XPath queries
        namespaces = {
            "SF424B": "http://apply.grants.gov/forms/SF424B-V1.1",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        # Verify root element and attributes
        assert root.tag == "{http://apply.grants.gov/forms/SF424B-V1.1}Assurances"
        assert (
            root.get("{http://apply.grants.gov/forms/SF424B-V1.1}programType") == "Non-Construction"
        )
        assert root.get("{http://apply.grants.gov/system/Global-V1.0}coreSchemaVersion") == "1.1"

        # Verify FormVersionIdentifier is present and is the first child element
        form_version = root.find("glob:FormVersionIdentifier", namespaces)
        assert form_version is not None, "FormVersionIdentifier element is missing"
        assert form_version.text == "1.1", "FormVersionIdentifier should be '1.1'"

        # Verify FormVersionIdentifier is the FIRST child element
        first_child = next(iter(root))
        assert (
            first_child.tag == "{http://apply.grants.gov/system/Global-V1.0}FormVersionIdentifier"
        ), "FormVersionIdentifier must be the first child element per XSD"

        # Verify AuthorizedRepresentative structure
        auth_rep = root.find("SF424B:AuthorizedRepresentative", namespaces)
        assert auth_rep is not None, "AuthorizedRepresentative element should exist"

        rep_name = auth_rep.find("SF424B:RepresentativeName", namespaces)
        assert rep_name is not None, "RepresentativeName should exist"
        assert rep_name.text == "MH", "RepresentativeName should match input exactly"

        rep_title = auth_rep.find("SF424B:RepresentativeTitle", namespaces)
        assert rep_title is not None, "RepresentativeTitle should exist"
        assert rep_title.text == "M", "RepresentativeTitle should match input"

        # Verify ApplicantOrganizationName
        org_name = root.find("SF424B:ApplicantOrganizationName", namespaces)
        assert org_name is not None, "ApplicantOrganizationName should exist"
        assert org_name.text == "Org", "ApplicantOrganizationName should match input"

        # Verify SubmittedDate
        submitted_date = root.find("SF424B:SubmittedDate", namespaces)
        assert submitted_date is not None, "SubmittedDate should exist"
        assert submitted_date.text == "2026-02-06", "SubmittedDate should match input"

        # Verify element order (critical for XSD compliance)
        children = list(root)
        child_tags = [child.tag for child in children]

        # Expected order per XSD schema
        expected_order = [
            "{http://apply.grants.gov/system/Global-V1.0}FormVersionIdentifier",
            "{http://apply.grants.gov/forms/SF424B-V1.1}AuthorizedRepresentative",
            "{http://apply.grants.gov/forms/SF424B-V1.1}ApplicantOrganizationName",
            "{http://apply.grants.gov/forms/SF424B-V1.1}SubmittedDate",
        ]

        assert child_tags == expected_order, (
            f"Element order should match XSD schema. "
            f"Expected: {expected_order}, Got: {child_tags}"
        )

        # Verify the generated XML contains the expected structure (string comparison)
        assert "<glob:FormVersionIdentifier>1.1</glob:FormVersionIdentifier>" in xml_data
        assert "<SF424B:AuthorizedRepresentative>" in xml_data
        assert "<SF424B:RepresentativeName>MH</SF424B:RepresentativeName>" in xml_data
        assert "<SF424B:RepresentativeTitle>M</SF424B:RepresentativeTitle>" in xml_data
        assert "</SF424B:AuthorizedRepresentative>" in xml_data
        assert (
            "<SF424B:ApplicantOrganizationName>Org</SF424B:ApplicantOrganizationName>" in xml_data
        )
        assert "<SF424B:SubmittedDate>2026-02-06</SF424B:SubmittedDate>" in xml_data

    def test_generate_sf424b_xml_namespaces_match_legacy(self):
        """Test that generated XML includes all namespace declarations matching legacy format.

        Legacy Grants.gov XML includes specific namespace declarations that must be present
        for proper XSD validation and submission compatibility.
        """
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-06",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify all required namespace declarations are present
        required_namespaces = {
            'xmlns:SF424B="http://apply.grants.gov/forms/SF424B-V1.1"',
            'xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"',
            'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"',
            'xmlns:glob="http://apply.grants.gov/system/Global-V1.0"',
        }

        for namespace_decl in required_namespaces:
            assert namespace_decl in xml_data, (
                f"Missing namespace declaration: {namespace_decl}\n"
                f"Generated XML root element:\n{xml_data[:500]}"
            )

        # Verify namespace prefixes are used correctly in attributes
        assert 'SF424B:programType="Non-Construction"' in xml_data
        assert 'glob:coreSchemaVersion="1.1"' in xml_data

        # Parse XML to verify namespace declarations are valid
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        # Verify namespace map includes all expected namespaces
        nsmap = root.nsmap
        assert nsmap.get("SF424B") == "http://apply.grants.gov/forms/SF424B-V1.1"
        assert nsmap.get("att") == "http://apply.grants.gov/system/Attachments-V1.0"
        assert nsmap.get("globLib") == "http://apply.grants.gov/system/GlobalLibrary-V2.0"
        assert nsmap.get("glob") == "http://apply.grants.gov/system/Global-V1.0"

    def test_generate_sf424b_xml_with_only_title(self):
        """Test SF-424B XML generation with only title field (no signature)."""
        application_data = {
            "title": "Program Manager",
            "applicant_organization": "Test Foundation",
            "date_signed": "2025-03-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Organization and date should be present
        assert (
            "<SF424B:ApplicantOrganizationName>Test Foundation</SF424B:ApplicantOrganizationName>"
            in xml_data
        )
        assert "<SF424B:SubmittedDate>2025-03-01</SF424B:SubmittedDate>" in xml_data

    def test_generate_sf424b_xml_with_only_signature(self):
        """Test SF-424B XML generation with only signature field (no title)."""
        application_data = {
            "signature": "Alice Johnson",
            "applicant_organization": "Research Institute",
            "date_signed": "2025-04-15",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424B_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Organization and date should be present
        assert (
            "<SF424B:ApplicantOrganizationName>Research Institute</SF424B:ApplicantOrganizationName>"
            in xml_data
        )
        assert "<SF424B:SubmittedDate>2025-04-15</SF424B:SubmittedDate>" in xml_data


@pytest.mark.xml_validation
class TestSF424BXSDValidation:
    """XSD validation tests for SF-424B form XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        # Check if SF424B XSD exists
        sf424b_xsd_path = xsd_cache_dir / "SF424B-V1.1.xsd"
        if not sf424b_xsd_path.exists():
            pytest.skip(
                "SF424B-V1.1.xsd not found in cache. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def sf424b_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with SF-424B form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-SF424B-001",
            opportunity_title="SF-424B Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-SF424B-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create SF-424B form with XML transform config
        sf424b_form = FormFactory.create(
            form_name="SF424B",
            short_form_name="SF424B",
            form_version="1.1",
            json_to_xml_schema=SF424B_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-424B Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424b_form)

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "signature": "Emily R. Chen, PhD",
                "title": "Principal Investigator",
                "applicant_organization": "National Research Foundation",
                "date_signed": "2025-01-15",
            },
        )

        return application

    def test_sf424b_submission_xml_validates_against_xsd(
        self, sf424b_application, xsd_validator, db_session
    ):
        """Test that complete SF-424B submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=sf424b_application,
            legacy_tracking_number=77777777,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(sf424b_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF-424B form element
        sf424b_ns = "{http://apply.grants.gov/forms/SF424B-V1.1}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        sf424b_elements = forms_element.findall(f".//{sf424b_ns}Assurances")
        assert len(sf424b_elements) == 1, "Expected exactly one SF424B Assurances element"

        # Validate SF-424B form against XSD
        sf424b_element = sf424b_elements[0]
        sf424b_xml = lxml_etree.tostring(sf424b_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(sf424b_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"SF-424B XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424b_xml[:2000]}"
        )

    def test_sf424b_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that SF-424B with minimal required data validates against XSD."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-SF424B-MIN-001",
            opportunity_title="SF-424B Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-SF424B-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        sf424b_form = FormFactory.create(
            form_name="SF424B",
            short_form_name="SF424B",
            form_version="1.1",
            json_to_xml_schema=SF424B_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-424B Minimal Test Application"
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424b_form)

        # Minimal data - only required fields per XSD (all elements are optional)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "applicant_organization": "Minimal Test Org",
                "title": "Director",  # Required by form JSON schema
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

        sf424b_ns = "{http://apply.grants.gov/forms/SF424B-V1.1}"
        forms_element = root.find(".//Forms")
        sf424b_elements = forms_element.findall(f".//{sf424b_ns}Assurances")
        assert len(sf424b_elements) == 1

        sf424b_xml = lxml_etree.tostring(sf424b_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(sf424b_xml, xsd_path)

        assert validation_result["valid"], (
            f"SF-424B minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424b_xml}"
        )
