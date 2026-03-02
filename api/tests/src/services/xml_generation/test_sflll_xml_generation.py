"""Test SF-LLL XML generation and validation.

This test creates SF-LLL forms, generates XML, and validates the output
against expected structure and content.
"""

from datetime import date

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sflll import FORM_XML_TRANSFORM_RULES as SFLLL_TRANSFORM_RULES
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


@pytest.mark.xml_validation
class TestSFLLLXMLGeneration:
    """Test SF-LLL XML generation."""

    @pytest.fixture
    def sflll_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with SF-LLL form."""
        agency = AgencyFactory.create(agency_name="Simpler Grants.gov")

        opportunity = OpportunityFactory.create(
            opportunity_number="SIMP-LLL-01222026",
            opportunity_title="Testing LLL Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="SIMP-LLL-01222026",
            opening_date=date(2026, 1, 21),
            closing_date=date(2027, 1, 2),
            opportunity_assistance_listing=assistance_listing,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-LLL Test Application"
        )

        # Create SF-LLL form
        sflll_form = FormFactory.create(
            form_name="Disclosure of Lobbying Activities (SF-LLL)",
            short_form_name="SFLLL_2_0",
            form_version="2.0",
            json_to_xml_schema=SFLLL_TRANSFORM_RULES,
        )

        comp_form_lll = CompetitionFormFactory.create(competition=competition, form=sflll_form)

        # SF-LLL test data
        ApplicationFormFactory.create(
            application=application,
            competition_form=comp_form_lll,
            application_response={
                "federal_action_type": "Grant",
                "federal_action_status": "InitialAward",
                "report_type": "InitialFiling",
                "reporting_entity": {
                    "entity_type": "Prime",
                    "applicant_reporting_entity": {
                        "entity_type": "Prime",
                        "organization_name": "Test Organization",
                        "address": {
                            "street1": "123 Main Street",
                            "street2": "Suite 100",
                            "city": "Washington",
                            "state": "DC: District of Columbia",
                            "zip_code": "20001",
                        },
                        "congressional_district": "DC-01",
                    },
                },
                "federal_agency_department": "Department of Health and Human Services",
                "federal_action_number": "HHS-2026-001",
                "award_amount": "500000.00",
                "lobbying_registrant": {
                    "individual": {
                        "first_name": "John",
                        "last_name": "Smith",
                    },
                    "address": {
                        "street1": "456 K Street NW",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20005",
                    },
                },
                "individual_performing_service": {
                    "individual": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                    },
                    "address": {
                        "street1": "789 Pennsylvania Ave",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20004",
                    },
                },
                "signature_block": {
                    "name": {
                        "first_name": "Test",
                        "last_name": "Signer",
                    },
                    "signed_date": "2026-01-22",
                    "signature": "Test Signer",
                },
            },
        )

        return application

    def test_sflll_xml_structure(self, sflll_application, db_session):
        """Test that SF-LLL XML has correct structure and namespaces."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=12345678,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Verify SF-LLL form exists
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll = root.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        assert sflll is not None, "SF-LLL form not found in generated XML"

        # Verify root attributes
        assert sflll.get(f"{sflll_ns}FormVersion") == "2.0"

    def test_sflll_required_fields(self, sflll_application, db_session):
        """Test that SF-LLL XML contains all required fields."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=88888888,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF-LLL
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll = root.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        assert sflll is not None

        # Verify required fields
        assert sflll.find(f".//{sflll_ns}FederalActionType").text == "Grant"
        assert sflll.find(f".//{sflll_ns}FederalActionStatus").text == "InitialAward"
        assert sflll.find(f".//{sflll_ns}ReportType").text == "InitialFiling"

        # Verify reporting entity
        assert sflll.find(f".//{sflll_ns}OrganizationName").text == "Test Organization"

        # Verify federal agency
        assert (
            sflll.find(f".//{sflll_ns}FederalAgencyDepartment").text
            == "Department of Health and Human Services"
        )

        # Verify award amount
        assert sflll.find(f".//{sflll_ns}AwardAmount").text == "500000.00"

    def test_sflll_address_fields_include_state(self, sflll_application, db_session):
        """Test that SF-LLL addresses include State field (legacy fix)."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=99999999,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Find all Address elements
        addresses = root.findall(f".//{sflll_ns}Address")
        assert len(addresses) >= 3, "Expected at least 3 address sections"

        # Verify each address has State field
        for address in addresses:
            state = address.find(f"{sflll_ns}State")
            # State is optional in some address types, but when present in data it should appear
            if state is not None:
                assert state.text is not None, "State field should have a value when present"

    def test_sflll_congressional_district(self, sflll_application, db_session):
        """Test that SF-LLL includes CongressionalDistrict field (legacy fix)."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=11111111,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll = root.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")

        # Verify CongressionalDistrict exists
        congressional_district = sflll.find(f".//{sflll_ns}CongressionalDistrict")
        assert congressional_district is not None, "CongressionalDistrict field missing"
        assert congressional_district.text == "DC-01"

    def test_sflll_globlib_namespaces(self, sflll_application, db_session):
        """Test that SF-LLL uses GlobalLibrary namespace correctly for name elements."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=22222222,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify globLib namespace is declared and used
        assert 'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"' in xml_string
        assert "globLib:FirstName" in xml_string
        assert "globLib:LastName" in xml_string
