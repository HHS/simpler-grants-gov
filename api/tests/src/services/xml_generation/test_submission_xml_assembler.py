"""Tests for submission XML assembler."""

from datetime import date

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.constants import GRANTS_GOV_NAMESPACES
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
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

        # Verify root element (with grant: namespace prefix)
        grant_ns = GRANTS_GOV_NAMESPACES["grant"]
        assert root.tag == f"{{{grant_ns}}}GrantApplication"

        # Verify header element
        header_ns = "{http://apply.grants.gov/system/Header-V1.0}"
        header_elements = root.findall(f".//{header_ns}GrantSubmissionHeader")
        assert len(header_elements) == 1

        # Verify Forms element
        forms_elements = root.findall(".//Forms")
        assert len(forms_elements) == 1

        # Verify SF424 form element inside Forms
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_elements = forms_elements[0].findall(f".//{sf424_ns}SF424_4_0")
        assert len(sf424_elements) == 1

        # Verify footer element
        footer_ns = "{http://apply.grants.gov/system/Footer-V1.0}"
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
        forms_element = root.find(".//Forms")
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

        forms_elements = root.findall(".//Forms")
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
        assert "xmlns:header" in xml_string
        assert "xmlns:footer" in xml_string
        assert "xmlns:glob" in xml_string

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
        assert GRANTS_GOV_NAMESPACES["header"] in root.nsmap.values()
        assert GRANTS_GOV_NAMESPACES["footer"] in root.nsmap.values()
        assert GRANTS_GOV_NAMESPACES["glob"] in root.nsmap.values()

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
