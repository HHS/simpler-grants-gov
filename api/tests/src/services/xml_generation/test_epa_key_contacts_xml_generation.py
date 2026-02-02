"""Tests for EPA Key Contacts form XML generation.

This module tests the XML generation for the EPA Key Contacts form,
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.epa_key_contacts import (
    FORM_XML_TRANSFORM_RULES as EPA_KEY_CONTACTS_TRANSFORM_RULES,
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


def _create_sample_contact_person(prefix="Dr.", first_name="John", last_name="Smith"):
    """Create a sample contact person data structure."""
    return {
        "name": {
            "prefix": prefix,
            "first_name": first_name,
            "middle_name": "A",
            "last_name": last_name,
            "suffix": "Jr.",
        },
        "title": "Director",
        "address": {
            "street1": "123 Main Street",
            "street2": "Suite 100",
            "city": "Washington",
            "state": "DC",
            "zip_code": "20001",
            "country": "USA",
        },
        "phone": "202-555-1234",
        "fax": "202-555-5678",
        "email": "john.smith@example.org",
    }


@pytest.mark.xml_validation
class TestEPAKeyContactsXMLGeneration:
    """Test cases for EPA Key Contacts XML generation service."""

    def test_generate_epa_key_contacts_xml_basic_success(self):
        """Test basic EPA Key Contacts XML generation with one contact."""
        application_data = {
            "authorized_representative": _create_sample_contact_person(
                prefix="Ms.", first_name="Jane", last_name="Doe"
            ),
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data
        # Root element
        assert "KeyContactPersons_2_0" in xml_data
        # AuthorizedRepresentative section
        assert "AuthorizedRepresentative" in xml_data
        # Name fields with globLib namespace
        assert "FirstName>Jane<" in xml_data
        assert "LastName>Doe<" in xml_data

    def test_generate_epa_key_contacts_xml_all_contacts(self):
        """Test EPA Key Contacts XML generation with all four contact types."""
        application_data = {
            "authorized_representative": _create_sample_contact_person(
                prefix="Mr.", first_name="John", last_name="Smith"
            ),
            "payee": _create_sample_contact_person(
                prefix="Ms.", first_name="Jane", last_name="Doe"
            ),
            "administrative_contact": _create_sample_contact_person(
                prefix="Dr.", first_name="Robert", last_name="Johnson"
            ),
            "project_manager": _create_sample_contact_person(
                prefix="Prof.", first_name="Emily", last_name="Williams"
            ),
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # All four contact sections should be present
        assert "AuthorizedRepresentative>" in xml_data
        assert "Payee>" in xml_data
        # Note: XSD has typo "AdminstrativeContact" not "AdministrativeContact"
        assert "AdminstrativeContact>" in xml_data
        assert "ProjectManager>" in xml_data

        # Verify each contact's name
        assert "FirstName>John<" in xml_data
        assert "FirstName>Jane<" in xml_data
        assert "FirstName>Robert<" in xml_data
        assert "FirstName>Emily<" in xml_data

    def test_generate_epa_key_contacts_xml_contact_person_structure(self):
        """Test that ContactPersonDataTypeV3 structure is correctly generated."""
        application_data = {
            "authorized_representative": {
                "name": {
                    "prefix": "Dr.",
                    "first_name": "Alice",
                    "middle_name": "B",
                    "last_name": "Chen",
                    "suffix": "PhD",
                },
                "title": "Principal Investigator",
                "address": {
                    "street1": "456 Science Drive",
                    "street2": "Building 5",
                    "city": "Boston",
                    "state": "MA",
                    "zip_code": "02101",
                    "country": "USA",
                },
                "phone": "617-555-1234",
                "fax": "617-555-5678",
                "email": "alice.chen@university.edu",
            },
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify ContactName structure
        assert "ContactName>" in xml_data
        assert "PrefixName>Dr.<" in xml_data
        assert "FirstName>Alice<" in xml_data
        assert "MiddleName>B<" in xml_data
        assert "LastName>Chen<" in xml_data
        assert "SuffixName>PhD<" in xml_data

        # Verify Title
        assert "Title>Principal Investigator<" in xml_data

        # Verify Address structure
        assert "Address>" in xml_data
        assert "Street1>456 Science Drive<" in xml_data
        assert "Street2>Building 5<" in xml_data
        assert "City>Boston<" in xml_data
        assert "State>MA<" in xml_data
        assert "ZipPostalCode>02101<" in xml_data
        assert "Country>USA<" in xml_data

        # Verify contact info
        assert "Phone>617-555-1234<" in xml_data
        assert "Fax>617-555-5678<" in xml_data
        assert "Email>alice.chen@university.edu<" in xml_data

    def test_generate_epa_key_contacts_xml_namespace_and_version(self):
        """Test that EPA Key Contacts XML includes proper namespace and version attribute."""
        application_data = {
            "authorized_representative": _create_sample_contact_person(),
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify namespace
        assert (
            'xmlns:EPA_KeyContacts_2_0="http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0"'
            in xml_data
        )
        # Verify FormVersion attribute
        assert 'FormVersion="2.0"' in xml_data

    def test_generate_epa_key_contacts_xml_minimal_contact(self):
        """Test EPA Key Contacts XML with minimal required contact fields."""
        # Minimal contact with just required fields
        application_data = {
            "payee": {
                "name": {
                    "first_name": "Simple",
                    "last_name": "Person",
                },
                "address": {
                    "street1": "789 Simple St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip_code": "90210",
                },
                "phone": "555-123-4567",
            },
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify payee section
        assert "Payee>" in xml_data
        assert "FirstName>Simple<" in xml_data
        assert "LastName>Person<" in xml_data
        assert "Phone>555-123-4567<" in xml_data

    def test_generate_epa_key_contacts_xml_empty_form(self):
        """Test EPA Key Contacts XML generation with no contacts (empty form).

        Note: The XML service returns an error for empty data, which is expected behavior.
        In practice, empty forms would be handled at the submission assembly level.
        """
        application_data = {}

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        # Empty data returns an error from the service
        assert response.success is False
        assert response.error_message == "No application data provided"


@pytest.mark.xml_validation
class TestEPAKeyContactsXSDValidation:
    """XSD validation tests for EPA Key Contacts form XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        xsd_path = xsd_cache_dir / "EPA_KeyContacts_2_0-V2.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "EPA_KeyContacts_2_0-V2.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def epa_key_contacts_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with EPA Key Contacts form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-EPA-KC-001",
            opportunity_title="EPA Key Contacts Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="66.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-EPA-KC-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create EPA Key Contacts form with XML transform config
        epa_kc_form = FormFactory.create(
            form_name="EPA KEY CONTACTS FORM",
            short_form_name="EPA_KeyContacts",
            form_version="2.0",
            json_to_xml_schema=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="EPA Key Contacts Test Application"
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=epa_kc_form)

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "authorized_representative": {
                    "name": {
                        "prefix": "Dr.",
                        "first_name": "John",
                        "middle_name": "A",
                        "last_name": "Smith",
                        "suffix": "Jr.",
                    },
                    "title": "Executive Director",
                    "address": {
                        "street1": "123 Main Street",
                        "street2": "Suite 100",
                        "city": "Washington",
                        "state": "DC",
                        "zip_code": "20001",
                        "country": "USA",
                    },
                    "phone": "202-555-1234",
                    "fax": "202-555-5678",
                    "email": "john.smith@example.org",
                },
                "payee": {
                    "name": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                    },
                    "title": "Financial Officer",
                    "address": {
                        "street1": "456 Finance Drive",
                        "city": "Boston",
                        "state": "MA",
                        "zip_code": "02101",
                        "country": "USA",
                    },
                    "phone": "617-555-9999",
                    "email": "jane.doe@example.org",
                },
            },
        )

        return application

    def test_epa_key_contacts_submission_xml_validates_against_xsd(
        self, epa_key_contacts_application, xsd_validator, db_session
    ):
        """Test that complete EPA Key Contacts submission XML validates against XSD schema."""
        application_submission = ApplicationSubmissionFactory.create(
            application=epa_key_contacts_application,
            legacy_tracking_number=77777777,
        )

        assembler = SubmissionXMLAssembler(epa_key_contacts_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None
        assert len(xml_string) > 0

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        epa_ns = "{http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        epa_elements = forms_element.findall(f".//{epa_ns}KeyContactPersons_2_0")
        assert len(epa_elements) == 1, "Expected exactly one KeyContactPersons_2_0 element"

        epa_element = epa_elements[0]
        epa_xml = lxml_etree.tostring(epa_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(epa_xml, xsd_path)

        assert validation_result["valid"], (
            f"EPA Key Contacts XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{epa_xml[:2000]}"
        )

    def test_epa_key_contacts_empty_form_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session
    ):
        """Test that EPA Key Contacts with no contacts validates against XSD (all elements are optional)."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-EPA-KC-EMPTY-001",
            opportunity_title="EPA Key Contacts Empty Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="66.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-EPA-KC-EMPTY-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        epa_kc_form = FormFactory.create(
            form_name="EPA KEY CONTACTS FORM",
            short_form_name="EPA_KeyContacts",
            form_version="2.0",
            json_to_xml_schema=EPA_KEY_CONTACTS_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition,
            application_name="EPA Key Contacts Empty Test Application",
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=epa_kc_form)

        # Empty form - no contacts
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={},
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

        epa_ns = "{http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0}"
        forms_element = root.find(".//Forms")
        epa_elements = forms_element.findall(f".//{epa_ns}KeyContactPersons_2_0")
        assert len(epa_elements) == 1

        epa_xml = lxml_etree.tostring(epa_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(epa_xml, xsd_path)

        assert validation_result["valid"], (
            f"EPA Key Contacts empty validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{epa_xml}"
        )
