"""Tests for submission XML assembler."""

from datetime import date

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.constants import Namespace
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


class TestSubmissionXMLAssembler:
    """Test cases for SubmissionXMLAssembler."""

    @pytest.fixture
    def sample_application(self, enable_factory_create, db_session: db.Session):
        """Create a sample application with SF424 form for testing."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-001",
            opportunity_title="Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="12.345"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create SF424 form with XML transform config
        sf424_form = FormFactory.create(
            form_name="Application for Federal Assistance (SF-424)",
            short_form_name="SF424_4_0",
            form_version="4.0",
            json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Test Application"
        )

        # Create competition form linking to SF424
        from tests.src.db.models.factories import CompetitionFormFactory

        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424_form)

        # Create application form with sample data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": "Application",
                "organization_name": "Test Organization",
                "applicant": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {
                    "first_name": "John",
                    "last_name": "Doe",
                },
                "phone_number": "555-123-4567",
                "email": "test@example.org",
                "project_title": "Test Project",
                "federal_estimated_funding": "50000.00",
                "certification_agree": True,
            },
        )

        return application

    @pytest.fixture
    def sample_application_submission(self, sample_application, db_session: db.Session):
        """Create a sample application submission."""
        return ApplicationSubmissionFactory.create(
            application=sample_application,
            legacy_tracking_number=12345678,
        )

    def test_get_supported_forms_single_supported(
        self, sample_application, sample_application_submission
    ):
        """Test getting supported forms when all forms are supported."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        supported_forms = assembler.get_supported_forms()

        assert len(supported_forms) == 1
        app_form = supported_forms[0]
        assert app_form.form.short_form_name == "SF424_4_0"

    def test_get_supported_forms_mixed_support(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test getting supported forms when some forms are unsupported."""
        # Add an unsupported form to the application
        unsupported_form = FormFactory.create(
            form_name="SF-424A Budget Information",
            short_form_name="SF424A_1_0",
            form_version="1.0",
        )

        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition, form=unsupported_form
        )
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        # Should only return SF424_4_0, not SF424A_1_0
        assert len(supported_forms) == 1
        app_form = supported_forms[0]
        assert app_form.form.short_form_name == "SF424_4_0"

    def test_get_supported_forms_none_supported(
        self, sample_application, sample_application_submission, enable_factory_create, db_session
    ):
        """Test getting supported forms when no forms are supported."""
        # Remove the SF424 form and add only unsupported forms
        sample_application.application_forms = []
        db_session.flush()

        unsupported_form = FormFactory.create(
            form_name="SF-424A Budget Information",
            short_form_name="SF424A_1_0",
            form_version="1.0",
        )

        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition, form=unsupported_form
        )
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        assert len(supported_forms) == 0

    def test_generate_complete_submission_xml_success(
        self, sample_application, sample_application_submission
    ):
        """Test successful generation of complete submission XML."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML is not empty
        assert xml_string
        assert len(xml_string) > 0

        # Parse XML to verify structure
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Verify root element
        grant_ns = f"{{{Namespace.GRANT}}}"
        assert root.tag == f"{grant_ns}GrantApplication"

        # Verify header element
        header_ns = f"{{{Namespace.HEADER}}}"
        header_elements = root.findall(f".//{header_ns}GrantSubmissionHeader")
        assert len(header_elements) == 1

        # Verify Forms element with grant namespace
        grant_forms_tag = f"{grant_ns}Forms"
        forms_elements = root.findall(f".//{grant_forms_tag}")
        assert len(forms_elements) == 1

        # Verify SF424 form element inside Forms
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_elements = forms_elements[0].findall(f".//{sf424_ns}SF424_4_0")
        assert len(sf424_elements) == 1

        # Verify schemaLocation is set correctly
        xsi_ns = "{http://www.w3.org/2001/XMLSchema-instance}"
        schema_location = root.get(f"{xsi_ns}schemaLocation")
        assert schema_location is not None
        assert "oppTEST-OPP-001.xsd" in schema_location
        assert "None.xsd" not in schema_location

        # Verify footer element
        footer_ns = f"{{{Namespace.FOOTER}}}"
        footer_elements = root.findall(f".//{footer_ns}GrantSubmissionFooter")
        assert len(footer_elements) == 1

    def test_generate_complete_submission_xml_contains_header_data(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML contains expected header data."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify header contains expected data
        assert "TEST-OPP-001" in xml_string  # OpportunityID
        assert "Test Opportunity" in xml_string  # OpportunityTitle
        assert "TEST-COMP-001" in xml_string  # CompetitionID
        assert "Test Application" in xml_string  # SubmissionTitle
        assert "12.345" in xml_string  # CFDANumber

    def test_generate_complete_submission_xml_contains_form_data(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML contains expected form data."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify form contains expected data
        assert "Test Organization" in xml_string
        assert "Test Project" in xml_string
        assert "50000.00" in xml_string

    def test_generate_complete_submission_xml_contains_contact_person(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML contains ContactPerson element with correct structure."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify ContactPerson element exists
        assert "<SF424_4_0:ContactPerson>" in xml_string, "ContactPerson element not found in XML"
        assert "</SF424_4_0:ContactPerson>" in xml_string, "ContactPerson closing tag not found"

        # Verify ContactPerson contains FirstName and LastName with globLib namespace
        assert "globLib:FirstName" in xml_string, "globLib:FirstName not found in ContactPerson"
        assert "globLib:LastName" in xml_string, "globLib:LastName not found in ContactPerson"
        assert "John" in xml_string, "ContactPerson FirstName 'John' not found"
        assert "Doe" in xml_string, "ContactPerson LastName 'Doe' not found"

        # Verify ContactPerson comes after Applicant
        applicant_pos = xml_string.find("<SF424_4_0:Applicant>")
        contact_person_pos = xml_string.find("<SF424_4_0:ContactPerson>")
        assert applicant_pos != -1, "Applicant element not found"
        assert contact_person_pos != -1, "ContactPerson element not found"
        assert (
            applicant_pos < contact_person_pos
        ), "ContactPerson should come after Applicant in XML"

    def test_generate_complete_submission_xml_contains_applicant_and_contact_person(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML contains both Applicant and ContactPerson elements."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Parse XML to verify structure
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Find SF424 form element
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        grant_ns_prefix = f"{{{Namespace.GRANT}}}"
        forms_element = root.find(f".//{grant_ns_prefix}Forms")
        sf424_element = forms_element.find(f".//{sf424_ns}SF424_4_0")
        assert sf424_element is not None, "SF424_4_0 element not found"

        # Verify Applicant element exists
        applicant_elements = sf424_element.findall(f".//{sf424_ns}Applicant")
        assert len(applicant_elements) == 1, "Expected exactly one Applicant element"
        applicant = applicant_elements[0]

        # Verify Applicant has child elements with globLib namespace
        glob_lib_ns = "{http://apply.grants.gov/system/GlobalLibrary-V2.0}"
        assert (
            applicant.find(f".//{glob_lib_ns}Street1") is not None
        ), "Street1 not found in Applicant"
        assert applicant.find(f".//{glob_lib_ns}City") is not None, "City not found in Applicant"
        assert applicant.find(f".//{glob_lib_ns}State") is not None, "State not found in Applicant"

        # Verify ContactPerson element exists
        contact_person_elements = sf424_element.findall(f".//{sf424_ns}ContactPerson")
        assert len(contact_person_elements) == 1, "Expected exactly one ContactPerson element"
        contact_person = contact_person_elements[0]

        # Verify ContactPerson has child elements with globLib namespace
        first_name = contact_person.find(f".//{glob_lib_ns}FirstName")
        last_name = contact_person.find(f".//{glob_lib_ns}LastName")
        assert first_name is not None, "FirstName not found in ContactPerson"
        assert last_name is not None, "LastName not found in ContactPerson"
        assert first_name.text == "John", f"Expected FirstName='John', got '{first_name.text}'"
        assert last_name.text == "Doe", f"Expected LastName='Doe', got '{last_name.text}'"

        # Verify element order: Applicant should come before ContactPerson
        sf424_children = list(sf424_element)
        applicant_index = None
        contact_person_index = None
        for i, child in enumerate(sf424_children):
            if child.tag == f"{sf424_ns}Applicant":
                applicant_index = i
            elif child.tag == f"{sf424_ns}ContactPerson":
                contact_person_index = i

        assert applicant_index is not None, "Applicant element not found in SF424 children"
        assert contact_person_index is not None, "ContactPerson element not found in SF424 children"
        assert (
            applicant_index < contact_person_index
        ), f"ContactPerson (index {contact_person_index}) should come after Applicant (index {applicant_index})"

    def test_generate_complete_submission_xml_contains_footer_data(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML contains expected footer data."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify footer contains expected data
        assert "GRANT12345678" in xml_string  # Tracking number

    def test_generate_complete_submission_xml_no_supported_forms(
        self, sample_application, sample_application_submission, enable_factory_create, db_session
    ):
        """Test that XML generation raises error when no supported forms."""
        # Remove the SF424 form and add only unsupported forms
        sample_application.application_forms = []
        db_session.flush()

        unsupported_form = FormFactory.create(
            form_name="SF-424A Budget Information",
            short_form_name="SF424A_1_0",
            form_version="1.0",
        )

        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition, form=unsupported_form
        )
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        # Should return None when no supported forms
        result = assembler.generate_complete_submission_xml()
        assert result is None

    def test_generate_complete_submission_xml_all_forms_fail(
        self, sample_application, sample_application_submission, monkeypatch
    ):
        """Test that XML generation returns None when all forms fail to generate."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        # Mock _generate_form_xml to always raise an exception
        def raise_exception(*args, **kwargs):
            raise Exception("XML generation failed")

        monkeypatch.setattr(assembler, "_generate_form_xml", raise_exception)

        # Should return None when all forms fail to generate
        result = assembler.generate_complete_submission_xml()
        assert result is None

    def test_generate_complete_submission_xml_with_only_unsupported_forms(
        self, enable_factory_create, db_session
    ):
        """Test that XML generation returns None when only unsupported forms are present with XML generation enabled."""
        # Create application infrastructure
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-002",
            opportunity_title="Test Opportunity 2",
            agency_code=agency.agency_code,
        )
        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="12.346"
        )
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-COMP-002",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
        )

        # Create an UNSUPPORTED form (SF-424A doesn't have XML transform config)
        unsupported_form = FormFactory.create(
            form_name="Budget Information - Non-Construction Programs",
            short_form_name="SF424A_1_1",
            form_version="1.1",
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Test Application with Unsupported Form"
        )

        # Create competition form linking to unsupported form
        competition_form = CompetitionFormFactory.create(
            competition=competition, form=unsupported_form
        )

        # Create application form with sample data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "budget_total": "100000.00",
                "federal_funding": "75000.00",
            },
        )

        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=87654321,
        )

        # XML generation is "enabled" (this would be a feature flag in the task)
        # but the form doesn't support XML transformation
        assembler = SubmissionXMLAssembler(application, application_submission)

        # Generate XML - should return None since no forms support XML
        result = assembler.generate_complete_submission_xml()

        # Verify NO XML is generated since the form isn't supported
        assert result is None

    def test_generate_complete_submission_xml_compact_format(
        self, sample_application, sample_application_submission
    ):
        """Test generating XML without pretty printing."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=False)

        # Verify XML is compact (no extra whitespace between elements)
        assert xml_string
        # Compact XML should not have multiple consecutive whitespace chars
        assert "\n  " not in xml_string or xml_string.count("\n  ") < 5

    def test_generate_complete_submission_xml_multiple_forms(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test generating XML with multiple supported forms (if we add more in future)."""
        # For now this just tests with one form, but structure supports multiple
        # When more forms get XML support, this test will validate multiple forms work
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Parse and verify Forms element contains at least one form
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        grant_ns_prefix = f"{{{Namespace.GRANT}}}"
        forms_elements = root.findall(f".//{grant_ns_prefix}Forms")
        assert len(forms_elements) == 1

        # Count child elements in Forms (should have at least 1)
        forms_element = forms_elements[0]
        assert len(forms_element) >= 1

    def test_generate_complete_submission_xml_valid_xml_structure(
        self, sample_application, sample_application_submission
    ):
        """Test that generated XML is valid and well-formed."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Should be able to parse without errors
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Verify XML declaration (accept either single or double quotes)
        assert xml_string.startswith('<?xml version="1.0"') or xml_string.startswith(
            "<?xml version='1.0'"
        )
        assert "encoding" in xml_string[:50]  # Check encoding is in declaration

        # Verify namespaces are properly declared
        assert f'xmlns:header="{Namespace.HEADER}"' in xml_string
        assert f'xmlns:footer="{Namespace.FOOTER}"' in xml_string
        assert f'xmlns:glob="{Namespace.GLOB}"' in xml_string

    def test_parse_xml_string_valid(self, sample_application, sample_application_submission):
        """Test parsing a valid XML string."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        valid_xml = '<?xml version="1.0" encoding="UTF-8"?><root><child>test</child></root>'

        element = assembler._parse_xml_string(valid_xml)

        assert element.tag == "root"
        assert len(element) == 1
        assert element[0].tag == "child"
        assert element[0].text == "test"

    def test_parse_xml_string_invalid(self, sample_application, sample_application_submission):
        """Test parsing an invalid XML string raises error."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        invalid_xml = "<root><child>test</root>"  # Missing closing tag for child

        with pytest.raises(ValueError) as exc_info:
            assembler._parse_xml_string(invalid_xml)

        assert "Invalid XML string" in str(exc_info.value)

    def test_generate_form_xml_with_empty_response(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test generating form XML with empty application response."""
        # Create a form with empty response
        competition_form = sample_application.application_forms[0].competition_form

        empty_form = ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={},  # Empty response
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        # Should raise error because empty data is invalid
        with pytest.raises(Exception) as exc_info:
            assembler._generate_form_xml(empty_form)

        assert "XML generation failed" in str(exc_info.value)

    def test_assembler_uses_application_data(
        self, sample_application, sample_application_submission
    ):
        """Test that assembler properly uses application and submission data."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        assert assembler.application == sample_application
        assert assembler.application_submission == sample_application_submission

    def test_generate_complete_submission_xml_namespace_handling(
        self, sample_application, sample_application_submission
    ):
        """Test that namespaces are properly handled and don't conflict."""
        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)

        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Parse to verify namespaces
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Verify namespace declarations exist
        assert Namespace.HEADER in root.nsmap.values()
        assert Namespace.FOOTER in root.nsmap.values()
        assert Namespace.GLOB in root.nsmap.values()

    def test_get_supported_forms_filters_non_required_not_included(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test that non-required forms with is_included_in_submission=False are filtered out."""
        # Create a non-required form with XML support
        optional_form = FormFactory.create(
            form_name="Optional Form",
            short_form_name="OPTIONAL_1_0",
            form_version="1.0",
            json_to_xml_schema=FORM_XML_TRANSFORM_RULES,  # Has XML support
        )

        # Create competition form marked as NOT required
        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition,
            form=optional_form,
            is_required=False,  # NOT required
        )

        # Create application form with is_included_in_submission=False
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
            is_included_in_submission=False,  # NOT included
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        # Should only return SF424_4_0 (required), not the optional form
        assert len(supported_forms) == 1
        assert supported_forms[0].form.short_form_name == "SF424_4_0"

    def test_get_supported_forms_includes_non_required_when_included(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test that non-required forms with is_included_in_submission=True are included."""
        # Create a non-required form with XML support
        optional_form = FormFactory.create(
            form_name="Optional Form",
            short_form_name="OPTIONAL_1_0",
            form_version="1.0",
            json_to_xml_schema=FORM_XML_TRANSFORM_RULES,  # Has XML support
        )

        # Create competition form marked as NOT required
        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition,
            form=optional_form,
            is_required=False,  # NOT required
        )

        # Create application form with is_included_in_submission=True
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
            is_included_in_submission=True,  # IS included
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        # Should return both SF424_4_0 and the optional form
        assert len(supported_forms) == 2
        form_names = {form.form.short_form_name for form in supported_forms}
        assert "SF424_4_0" in form_names
        assert "OPTIONAL_1_0" in form_names

    def test_get_supported_forms_includes_required_regardless_of_is_included(
        self, sample_application, sample_application_submission, enable_factory_create, db_session
    ):
        """Test that required forms are included regardless of is_included_in_submission value."""
        # Update the existing SF424 form to have is_included_in_submission=False
        # (should still be included because it's required)
        sample_application.application_forms[0].is_included_in_submission = False
        db_session.flush()

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        # Should still return SF424_4_0 because it's required
        assert len(supported_forms) == 1
        assert supported_forms[0].form.short_form_name == "SF424_4_0"

    def test_get_supported_forms_filters_non_required_null_is_included(
        self, sample_application, sample_application_submission, enable_factory_create
    ):
        """Test that non-required forms with is_included_in_submission=None are filtered out."""
        # Create a non-required form with XML support
        optional_form = FormFactory.create(
            form_name="Optional Form",
            short_form_name="OPTIONAL_1_0",
            form_version="1.0",
            json_to_xml_schema=FORM_XML_TRANSFORM_RULES,  # Has XML support
        )

        # Create competition form marked as NOT required
        competition_form = CompetitionFormFactory.create(
            competition=sample_application.competition,
            form=optional_form,
            is_required=False,  # NOT required
        )

        # Create application form with is_included_in_submission=None
        ApplicationFormFactory.create(
            application=sample_application,
            competition_form=competition_form,
            application_response={"some_field": "some_value"},
            is_included_in_submission=None,  # NULL/None
        )

        assembler = SubmissionXMLAssembler(sample_application, sample_application_submission)
        supported_forms = assembler.get_supported_forms()

        # Should only return SF424_4_0 (required), not the optional form
        assert len(supported_forms) == 1
        assert supported_forms[0].form.short_form_name == "SF424_4_0"

    def test_generate_xml_matches_reference_sf424(
        self, enable_factory_create, db_session: db.Session
    ):
        """Test that generated XML matches the reference sf424-full.xml file."""
        # Create application infrastructure matching the reference XML
        agency = AgencyFactory.create(agency_name="Simpler Grants.gov")

        opportunity = OpportunityFactory.create(
            opportunity_number="SIMP-TEST-NEH1",
            opportunity_title="TEST NEH OPPORTUNITY WITH ONE FORM",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="45.024"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="SIMP-TEST-NEH1",
            competition_title="SIMP TEST",
            opening_date=date(2025, 12, 18),
            closing_date=date(2026, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            legacy_package_id="SIMP-TEST-NEH1",
        )

        # Create SF424 form with XML transform config
        sf424_form = FormFactory.create(
            form_name="Application for Federal Assistance (SF-424)",
            short_form_name="SF424_4_0",
            form_version="4.0",
            json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Test for XML 12-22-25"
        )

        # Create competition form linking to SF424
        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424_form)

        # Create application form with complete data matching the reference XML
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": "Application",
                "application_type": "New",
                "date_received": "2025-12-22",
                "organization_name": "Test Org 1",
                "employer_taxpayer_identification_number": "55-5555555",
                "sam_uei": "E9T7F9N2ERR4",
                "applicant": {
                    "street1": "1 Main St",
                    "city": "Austin",
                    "state": "TX: Texas",
                    "zip_code": "78701-0001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {
                    "first_name": "Chris",
                    "last_name": "Kuryak",
                },
                "phone_number": "555-555-5555",
                "email": "chriskuryak@navapbc.com",
                "applicant_type_code": ["B: County Government", "R: Small Business"],
                "agency_name": "Simpler Grants.gov",
                "funding_opportunity_number": "SIMP-TEST-NEH1",
                "funding_opportunity_title": "TEST NEH OPPORTUNITY WITH ONE FORM",
                "competition_identification_number": "SIMP-TEST-NEH1",
                "competition_identification_title": "SIMP TEST",
                "project_title": "Test Title",
                "congressional_district_applicant": "TX-001",
                "congressional_district_program_project": "TX-002",
                "project_start_date": "2026-01-01",
                "project_end_date": "2026-01-31",
                "federal_estimated_funding": "1.00",
                "applicant_estimated_funding": "2.00",
                "state_estimated_funding": "3.00",
                "local_estimated_funding": "4.00",
                "other_estimated_funding": "5.00",
                "program_income_estimated_funding": "6.00",
                "total_estimated_funding": "21.00",
                "state_review": "a. This application was made available to the State under the Executive Order 12372 Process for review on",
                "state_review_available_date": "2025-12-15",
                "delinquent_federal_debt": False,
                "certification_agree": True,
                "authorized_representative": {
                    "first_name": "John",
                    "last_name": "Smith",
                },
                "authorized_representative_title": "Manager",
                "authorized_representative_phone_number": "666-666-6666",
                "authorized_representative_email": "chriskuryak@navapbc.com",
                "aor_signature": "Chris  Kuryak",
                "date_signed": "2025-12-22",
            },
        )

        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=840658,  # Becomes GRANT00840658
        )

        # Create a mock attachment for areas_affected field
        from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo

        mock_attachment = ApplicationAttachmentFactory.create(
            application=application,
            file_name="1234-Test Doc - Chris Kuryak.pdf",
            mime_type="application/pdf",
        )

        # Add areas_affected field with attachment UUID to the application response
        application.application_forms[0].application_response["areas_affected"] = str(
            mock_attachment.application_attachment_id
        )
        db_session.flush()

        # Create attachment mapping for XML generation using AttachmentInfo
        attachment_mapping = {
            str(mock_attachment.application_attachment_id): AttachmentInfo(
                filename="1234-Test Doc - Chris Kuryak.pdf",
                mime_type="application/pdf",
                file_location="344292.SF424_4_0_P2.optionalFile1",
                hash_value="eRogR/6ilLFBfgNyEbzXUNSDPKs=",  # Mock hash value from reference XML
                hash_algorithm="SHA-1",
            )
        }

        # Generate XML
        assembler = SubmissionXMLAssembler(
            application, application_submission, attachment_mapping=attachment_mapping
        )
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Parse generated XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        generated_root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Load reference XML from test directory
        import os

        reference_path = os.path.join(os.path.dirname(__file__), "sf424-full.xml")

        with open(reference_path) as f:
            reference_xml = f.read()
        reference_root = lxml_etree.fromstring(reference_xml.encode("utf-8"), parser=parser)

        # Compare key elements (excluding hash values and timestamps which will differ)
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"

        # Get both SF424 forms
        gen_sf424 = generated_root.find(f".//{sf424_ns}SF424_4_0")
        ref_sf424 = reference_root.find(f".//{sf424_ns}SF424_4_0")

        assert gen_sf424 is not None, "Generated XML missing SF424_4_0 element"
        assert ref_sf424 is not None, "Reference XML missing SF424_4_0 element"

        # Compare key fields
        fields_to_compare = [
            "SubmissionType",
            "ApplicationType",
            "DateReceived",
            "OrganizationName",
            "EmployerTaxpayerIdentificationNumber",
            "SAMUEI",
            "PhoneNumber",
            "Email",
            "ApplicantTypeCode1",
            "ApplicantTypeCode2",
            "AgencyName",
            "FundingOpportunityNumber",
            "FundingOpportunityTitle",
            "CompetitionIdentificationNumber",
            "CompetitionIdentificationTitle",
            "ProjectTitle",
            "CongressionalDistrictApplicant",
            "CongressionalDistrictProgramProject",
            "ProjectStartDate",
            "ProjectEndDate",
            "FederalEstimatedFunding",
            "ApplicantEstimatedFunding",
            "StateEstimatedFunding",
            "LocalEstimatedFunding",
            "OtherEstimatedFunding",
            "ProgramIncomeEstimatedFunding",
            "TotalEstimatedFunding",
            "StateReview",
            "StateReviewAvailableDate",
            "DelinquentFederalDebt",
            "CertificationAgree",
            "AuthorizedRepresentativeTitle",
            "AuthorizedRepresentativePhoneNumber",
            "AuthorizedRepresentativeEmail",
            "AORSignature",
            "DateSigned",
        ]

        differences = []
        for field in fields_to_compare:
            gen_elem = gen_sf424.find(f".//{sf424_ns}{field}")
            ref_elem = ref_sf424.find(f".//{sf424_ns}{field}")

            gen_text = gen_elem.text.strip() if gen_elem is not None and gen_elem.text else None
            ref_text = ref_elem.text.strip() if ref_elem is not None and ref_elem.text else None

            if gen_text != ref_text:
                differences.append(f"{field}: Generated='{gen_text}' vs Reference='{ref_text}'")

        # Report differences if any
        if differences:
            print("\n\nDifferences found:")
            for diff in differences:
                print(f"  - {diff}")

        # Assert no differences (or only expected ones)
        assert len(differences) == 0, f"Found {len(differences)} differences in XML generation"
