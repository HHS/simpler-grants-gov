"""End-to-end XSD validation tests for complete application submission XML.

These tests create real applications with form data, generate complete submission XML
using SubmissionXMLAssembler, and validate the output against XSD schemas.
"""

from datetime import date

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.forms.sf424_short import SF424Short_v3_0
from src.form_schema.forms.sf424a import SF424a_v1_0
from src.form_schema.forms.sflll import SFLLL_v2_0
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


class TestSubmissionXSDValidation:
    """End-to-end XSD validation tests for complete application submissions."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with directory."""
        from pathlib import Path

        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds' to download schemas.")
        return XSDValidator(xsd_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_dir / xsd_filename

    @pytest.fixture
    def sf424_application(self, enable_factory_create, seed_form_registry):
        """Create an application with SF-424 form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-E2E-001",
            opportunity_title="End-to-End Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-COMP-E2E-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        sf424_form = SF424_v4_0

        application = ApplicationFactory.create(
            competition=competition, application_name="End-to-End Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424_form)

        # Create application form with minimal XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": "Application",
                "application_type": "New",
                "date_received": "2025-01-15",
                "organization_name": "Test Research University",
                "employer_taxpayer_identification_number": "123456789",  # Required per XSD
                "sam_uei": "TEST12345678",  # Required per XSD (exactly 12 chars)
                "applicant": {  # Required per XSD
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {  # Required per XSD
                    "first_name": "John",
                    "last_name": "Doe",
                },
                "phone_number": "555-123-4567",  # Required per XSD
                "email": "test@example.org",  # Required per XSD
                "applicant_type_code": ["C: City or Township Government"],  # Required per XSD
                "agency_name": "Test Agency",  # Required per XSD
                "funding_opportunity_number": "TEST-FON-2025-001",  # Required per XSD
                "funding_opportunity_title": "Test Funding Opportunity",  # Required per XSD
                "project_title": "E2E XML Validation Test",
                "congressional_district_applicant": "DC-00",  # Required per XSD
                "congressional_district_program_project": "DC-00",  # Required per XSD
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "federal_estimated_funding": "100000.00",
                "applicant_estimated_funding": "0.00",  # Required per XSD
                "state_estimated_funding": "0.00",  # Required per XSD
                "local_estimated_funding": "0.00",  # Required per XSD
                "other_estimated_funding": "0.00",  # Required per XSD
                "program_income_estimated_funding": "0.00",  # Required per XSD
                "total_estimated_funding": "100000.00",  # Required per XSD
                "state_review": "c. Program is not covered by E.O. 12372.",
                "delinquent_federal_debt": False,  # Required per XSD
                "certification_agree": True,
                # Authorized Representative - required per XSD
                "authorized_representative": {"first_name": "John", "last_name": "Doe"},
                "authorized_representative_title": "Director",
                "authorized_representative_phone_number": "555-111-2222",
                "authorized_representative_email": "john.doe@test.org",
                "aor_signature": "John Doe Signature",
                "date_signed": "2025-01-15",
            },
        )

        return application

    @pytest.fixture
    def sf424a_application(self, enable_factory_create, seed_form_registry):
        """Create an application with SF-424A form and realistic budget data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-E2E-002",
            opportunity_title="Budget Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-COMP-E2E-002",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        sf424a_form = SF424a_v1_0

        application = ApplicationFactory.create(
            competition=competition, application_name="Budget Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=sf424a_form)

        # Create application form with minimal XSD-compliant budget data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                # Required fields
                "program_type": "Non-Construction",
                "form_version_identifier": "1.0",
                # Minimal activity line items - only required sections
                "activity_line_items": [
                    {
                        "activity_title": "Main Activity",
                        "budget_summary": {
                            "assistance_listing_number": "93.002",
                            # Fields in correct XSD order per BudgetAmountGroup
                            "federal_new_or_revised_amount": "50000.00",
                            "non_federal_new_or_revised_amount": "10000.00",
                            "total_amount": "60000.00",
                        },
                        "budget_categories": {
                            "personnel_amount": "30000.00",
                        },
                        "non_federal_resources": {
                            "applicant_amount": "10000.00",
                            "total_amount": "10000.00",
                        },
                        "federal_fund_estimates": {
                            "first_year_amount": "50000.00",
                        },
                    },
                ],
                # Minimal totals
                "total_budget_summary": {
                    "federal_new_or_revised_amount": "50000.00",
                    "non_federal_new_or_revised_amount": "10000.00",
                    "total_amount": "60000.00",
                },
                "total_budget_categories": {
                    "personnel_amount": "30000.00",
                },
                "total_non_federal_resources": {
                    "applicant_amount": "10000.00",
                    "total_amount": "10000.00",
                },
                "total_federal_fund_estimates": {
                    "first_year_amount": "50000.00",
                },
            },
        )

        return application

    def test_sf424_submission_xml_validates_against_xsd(self, sf424_application, xsd_validator):
        """Test that complete SF-424 submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=sf424_application,
            legacy_tracking_number=11111111,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(sf424_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF424 form element
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        sf424_elements = forms_element.findall(f".//{sf424_ns}SF424_4_0")
        assert len(sf424_elements) == 1, "Expected exactly one SF424_4_0 element"

        # Validate SF424 form against XSD
        sf424_element = sf424_elements[0]
        sf424_xml = lxml_etree.tostring(sf424_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        validation_result = xsd_validator.validate_xml(sf424_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"SF-424 XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424_xml[:1000]}"
        )

    def test_sf424a_submission_xml_validates_against_xsd(self, sf424a_application, xsd_validator):
        """Test that complete SF-424A submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=sf424a_application,
            legacy_tracking_number=22222222,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(sf424a_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF424A form element
        sf424a_ns = "{http://apply.grants.gov/forms/SF424A-V1.0}"

        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        sf424a_elements = forms_element.findall(f".//{sf424a_ns}BudgetInformation")
        assert len(sf424a_elements) == 1, "Expected exactly one BudgetInformation element"

        # Validate SF424A form against XSD
        sf424a_element = sf424a_elements[0]
        sf424a_xml = lxml_etree.tostring(sf424a_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd"
        )
        validation_result = xsd_validator.validate_xml(sf424a_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"SF-424A XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424a_xml[:1000]}"
        )

    def test_multi_form_submission_xml_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        """Test that submission with multiple forms validates all forms against XSD schemas."""
        # Create application with both SF-424 and SF-424A
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-E2E-MULTI",
            opportunity_title="Multi-Form Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.999"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-COMP-E2E-MULTI",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Multi-Form Test Application"
        )

        # Add SF-424 form
        sf424_form = SF424_v4_0
        comp_form_424 = CompetitionFormFactory.create(competition=competition, form=sf424_form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=comp_form_424,
            application_response={
                "submission_type": "Application",
                "application_type": "New",
                "date_received": "2025-01-20",
                "organization_name": "Multi-Form Test Org",
                "employer_taxpayer_identification_number": "987654321",  # Required per XSD
                "sam_uei": "MULTI8765432",  # Required per XSD (exactly 12 chars)
                "applicant": {  # Required per XSD
                    "street1": "456 Oak Ave",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20002",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {  # Required per XSD
                    "first_name": "Jane",
                    "last_name": "Smith",
                },
                "phone_number": "555-987-6543",  # Required per XSD
                "email": "multi@example.org",  # Required per XSD
                "applicant_type_code": ["A: State Government"],  # Required per XSD
                "agency_name": "Test Agency",  # Required per XSD
                "funding_opportunity_number": "TEST-FON-2025-002",  # Required per XSD
                "funding_opportunity_title": "Multi-Form Test Opportunity",  # Required per XSD
                "project_title": "Multi-Form Project",
                "congressional_district_applicant": "DC-00",  # Required per XSD
                "congressional_district_program_project": "DC-00",  # Required per XSD
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "federal_estimated_funding": "50000.00",
                "applicant_estimated_funding": "0.00",  # Required per XSD
                "state_estimated_funding": "0.00",  # Required per XSD
                "local_estimated_funding": "0.00",  # Required per XSD
                "other_estimated_funding": "0.00",  # Required per XSD
                "program_income_estimated_funding": "0.00",  # Required per XSD
                "total_estimated_funding": "50000.00",  # Required per XSD
                "state_review": "c. Program is not covered by E.O. 12372.",
                "delinquent_federal_debt": False,  # Required per XSD
                "certification_agree": True,
                # Authorized Representative - required per XSD
                "authorized_representative": {"first_name": "Jane", "last_name": "Smith"},
                "authorized_representative_title": "President",
                "authorized_representative_phone_number": "555-999-8888",
                "authorized_representative_email": "jane.smith@multi.org",
                "aor_signature": "Jane Smith Signature",
                "date_signed": "2025-01-20",
            },
        )

        # Add SF-424A form
        sf424a_form = SF424a_v1_0
        comp_form_424a = CompetitionFormFactory.create(competition=competition, form=sf424a_form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=comp_form_424a,
            application_response={
                "program_type": "Non-Construction",
                "form_version_identifier": "1.0",
                "activity_line_items": [
                    {
                        "activity_title": "Main Project",
                        "budget_summary": {
                            "assistance_listing_number": "93.999",
                            "total_amount": "50000.00",
                        },
                        "budget_categories": {
                            "personnel_amount": "30000.00",
                            "fringe_benefits_amount": "10000.00",
                            "travel_amount": "5000.00",
                            "equipment_amount": "5000.00",
                        },
                        "non_federal_resources": {
                            "applicant_amount": "5000.00",
                            "total_amount": "5000.00",
                        },
                        "federal_fund_estimates": {
                            "first_year_amount": "50000.00",
                        },
                    },
                ],
                "total_budget_summary": {"total_amount": "50000.00"},
                "total_budget_categories": {
                    "personnel_amount": "30000.00",
                    "fringe_benefits_amount": "10000.00",
                    "travel_amount": "5000.00",
                    "equipment_amount": "5000.00",
                },
                "total_non_federal_resources": {
                    "applicant_amount": "5000.00",
                    "total_amount": "5000.00",
                },
                "total_federal_fund_estimates": {"first_year_amount": "50000.00"},
            },
        )

        # Create submission
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=33333333,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None

        # Validate SF-424
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_elements = forms_element.findall(f".//{sf424_ns}SF424_4_0")
        assert len(sf424_elements) == 1

        sf424_xml = lxml_etree.tostring(sf424_elements[0], encoding="unicode")
        sf424_xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        sf424_validation = xsd_validator.validate_xml(sf424_xml, sf424_xsd_path)
        assert sf424_validation[
            "valid"
        ], f"SF-424 validation failed: {sf424_validation['error_message']}"

        # Validate SF-424A
        sf424a_ns = "{http://apply.grants.gov/forms/SF424A-V1.0}"
        sf424a_elements = forms_element.findall(f".//{sf424a_ns}BudgetInformation")
        assert len(sf424a_elements) == 1

        sf424a_xml = lxml_etree.tostring(sf424a_elements[0], encoding="unicode")
        sf424a_xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd"
        )
        sf424a_validation = xsd_validator.validate_xml(sf424a_xml, sf424a_xsd_path)
        assert sf424a_validation[
            "valid"
        ], f"SF-424A validation failed: {sf424a_validation['error_message']}"

    def test_submission_xml_structure_is_well_formed(self, sf424_application):
        """Test that generated submission XML has proper structure even without XSD validation."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sf424_application,
            legacy_tracking_number=44444444,
        )

        assembler = SubmissionXMLAssembler(sf424_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Parse to verify well-formed XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Verify root element (with grant: namespace prefix)
        grant_ns = "http://apply.grants.gov/system/MetaGrantApplication"
        assert root.tag == f"{{{grant_ns}}}GrantApplication"

        # Verify required namespaces exist
        assert "http://apply.grants.gov/system/Header-V1.0" in root.nsmap.values()
        assert "http://apply.grants.gov/system/Footer-V1.0" in root.nsmap.values()
        assert "http://apply.grants.gov/system/Global-V1.0" in root.nsmap.values()

        # Verify structure: Header -> Forms -> Footer
        header_ns = "{http://apply.grants.gov/system/Header-V1.0}"
        footer_ns = "{http://apply.grants.gov/system/Footer-V1.0}"

        header = root.find(f".//{header_ns}GrantSubmissionHeader")
        ns = {"grant": grant_ns}
        forms = root.find(".//grant:Forms", namespaces=ns)
        footer = root.find(f".//{footer_ns}GrantSubmissionFooter")

        assert header is not None, "Header not found"
        assert forms is not None, "Forms not found"
        assert footer is not None, "Footer not found"

        # Verify order: Header should come before Forms, Forms before Footer
        children = list(root)
        header_idx = next(i for i, child in enumerate(children) if "Header" in child.tag)
        forms_idx = next(
            i for i, child in enumerate(children) if child.tag.split("}")[-1] == "Forms"
        )
        footer_idx = next(i for i, child in enumerate(children) if "Footer" in child.tag)

        assert header_idx < forms_idx < footer_idx, "Elements not in correct order"

    @pytest.fixture
    def sflll_application(self, enable_factory_create, seed_form_registry):
        """Create an application with SF-LLL form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-SFLLL-001",
            opportunity_title="SF-LLL Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.123"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-SFLLL-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        sflll_form = SFLLL_v2_0

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-LLL Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=sflll_form)

        # Create application form with minimal XSD-compliant data for SF-LLL
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "federal_action_type": "Grant",
                "federal_action_status": "InitialAward",
                "report_type": "InitialFiling",
                "reporting_entity": {
                    "entity_type": "Prime",
                    "applicant_reporting_entity": {
                        "entity_type": "Prime",
                        "organization_name": "Test Research Institute",
                        "address": {
                            "street1": "456 Science Drive",
                            "city": "Bethesda",
                            "state": "MD: Maryland",
                            "zip_code": "20814",
                        },
                        "congressional_district": "MD-008",
                    },
                },
                "federal_agency_department": "Department of Health and Human Services",
                "federal_program_name": "Research Grant Program",
                "assistance_listing_number": "93.123",
                "federal_action_number": "5R01GM123456-01",
                "award_amount": "500000.00",
                "lobbying_registrant": {
                    "individual": {
                        "first_name": "John",
                        "last_name": "Smith",
                    },
                    "address": {
                        "street1": "789 K Street NW",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20001",
                    },
                },
                "individual_performing_service": {
                    "individual": {
                        "name": {
                            "first_name": "Jane",
                            "last_name": "Doe",
                        },
                        "address": {
                            "street1": "100 Lobby Lane",
                            "city": "Washington",
                            "state": "DC: District of Columbia",
                            "zip_code": "20002",
                        },
                    },
                },
                "signature_block": {
                    "name": {
                        "first_name": "Alice",
                        "last_name": "Johnson",
                    },
                    "title": "Chief Financial Officer",
                    "telephone": "301-555-1234",
                    "signed_date": "2025-01-15",
                    "signature": "Alice Johnson Signature",
                },
            },
        )

        return application

    def test_sflll_xsd_validation(self, sflll_application, xsd_validator):
        """Test that SF-LLL form XML passes XSD validation."""
        # Create submission
        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=55555555,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None

        # Extract SF-LLL element
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll_elements = forms_element.findall(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        assert len(sflll_elements) == 1, "Expected exactly one SF-LLL element"

        # Validate against XSD
        sflll_xml = lxml_etree.tostring(sflll_elements[0], encoding="unicode")
        sflll_xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd"
        )
        sflll_validation = xsd_validator.validate_xml(sflll_xml, sflll_xsd_path)
        assert sflll_validation[
            "valid"
        ], f"SF-LLL validation failed: {sflll_validation['error_message']}"

    def test_sflll_with_subawardee_xsd_validation(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        """Test that SF-LLL with subawardee data passes XSD validation."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-SFLLL-SUB-001",
            opportunity_title="SF-LLL Subawardee Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="81.086"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-SFLLL-SUB-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        sflll_form = SFLLL_v2_0

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-LLL Subawardee Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(competition=competition, form=sflll_form)

        # Create application form with subawardee data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "federal_action_type": "CoopAgree",
                "federal_action_status": "InitialAward",
                "report_type": "InitialFiling",
                "reporting_entity": {
                    "entity_type": "SubAwardee",
                    "tier": 1,
                    "applicant_reporting_entity": {
                        "entity_type": "SubAwardee",
                        "organization_name": "Small Research Company LLC",
                        "address": {
                            "street1": "123 Innovation Way",
                            "city": "Boston",
                            "state": "MA: Massachusetts",
                            "zip_code": "02101",
                        },
                        "congressional_district": "MA-007",
                    },
                    "prime_reporting_entity": {
                        "entity_type": "Prime",
                        "organization_name": "Major University System",
                        "address": {
                            "street1": "999 Academic Drive",
                            "city": "Cambridge",
                            "state": "MA: Massachusetts",
                            "zip_code": "02138",
                        },
                        "congressional_district": "MA-005",
                    },
                },
                "federal_agency_department": "Department of Energy",
                "federal_program_name": "Clean Energy Innovation Program",
                "assistance_listing_number": "81.086",
                "federal_action_number": "DE-FOA-2025-001",
                "award_amount": "250000.00",
                "lobbying_registrant": {
                    "individual": {
                        "first_name": "Patricia",
                        "last_name": "Martinez",
                    },
                    "address": {
                        "street1": "1500 Pennsylvania Avenue",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20004",
                    },
                },
                "individual_performing_service": {
                    "individual": {
                        "name": {
                            "first_name": "David",
                            "last_name": "Lee",
                        },
                        "address": {
                            "street1": "800 Connecticut Avenue",
                            "city": "Washington",
                            "state": "DC: District of Columbia",
                            "zip_code": "20006",
                        },
                    },
                },
                "signature_block": {
                    "name": {
                        "first_name": "Jennifer",
                        "last_name": "Brown",
                    },
                    "title": "CEO",
                    "telephone": "617-555-4321",
                    "signed_date": "2025-01-20",
                    "signature": "Jennifer Brown Signature",
                },
            },
        )

        # Create submission
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=66666666,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None

        # Extract SF-LLL element
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll_elements = forms_element.findall(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        assert len(sflll_elements) == 1, "Expected exactly one SF-LLL element"

        # Validate against XSD
        sflll_xml = lxml_etree.tostring(sflll_elements[0], encoding="unicode")
        sflll_xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd"
        )
        sflll_validation = xsd_validator.validate_xml(sflll_xml, sflll_xsd_path)
        assert sflll_validation[
            "valid"
        ], f"SF-LLL subawardee validation failed: {sflll_validation['error_message']}"

    @pytest.mark.parametrize(
        "state_review_value,extra_fields,tracking_number",
        [
            # Options a and b use lowercase "state" as stored in the DB (form enum value).
            # The XML transformer normalizes these to capital "State" before writing to XML.
            (
                "a. This application was made available to the state under the Executive Order 12372 Process for review on",
                {"state_review_available_date": "2025-01-10"},
                99999901,
            ),
            (
                "b. Program is subject to E.O. 12372 but has not been selected by the state for review.",
                {},
                99999902,
            ),
            (
                "c. Program is not covered by E.O. 12372.",
                {},
                99999903,
            ),
        ],
        ids=["option_a", "option_b", "option_c"],
    )
    def test_sf424_state_review_all_options_xsd_validation(
        self,
        enable_factory_create,
        xsd_validator,
        seed_form_registry,
        state_review_value,
        extra_fields,
        tracking_number,
    ):
        """Test that all three state_review enum values produce XSD-valid XML.

        Options a and b contain 'State' (capitalized). A casing bug (lowercase 'state')
        in the enum definition would cause XSD validation to fail for those two options
        while option c (which has no 'state') would pass undetected.
        """
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(
            opportunity_number=f"TEST-OPP-SR-{tracking_number}",
            opportunity_title="State Review Coverage Test",
            agency_code=agency.agency_code,
        )
        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=f"TEST-COMP-SR-{tracking_number}",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        competition_form = CompetitionFormFactory.create(competition=competition, form=SF424_v4_0)
        application = ApplicationFactory.create(
            competition=competition, application_name="State Review Coverage Application"
        )
        application_response = {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2025-01-15",
            "organization_name": "Test Research University",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "contact_person": {"first_name": "John", "last_name": "Doe"},
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["C: City or Township Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2025-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "State Review Coverage Test",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2025-01-01",
            "project_end_date": "2025-12-31",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "100000.00",
            "state_review": state_review_value,
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "Director",
            "authorized_representative_phone_number": "555-111-2222",
            "authorized_representative_email": "john.doe@test.org",
            "aor_signature": "John Doe Signature",
            "date_signed": "2025-01-15",
            **extra_fields,
        }
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=application_response,
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=tracking_number,
        )

        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)
        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)

        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_elements = forms_element.findall(f".//{sf424_ns}SF424_4_0")
        assert len(sf424_elements) == 1

        sf424_xml = lxml_etree.tostring(sf424_elements[0], encoding="unicode")
        sf424_xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        result = xsd_validator.validate_xml(sf424_xml, sf424_xsd_path)
        assert result["valid"], (
            f"SF-424 XSD validation failed for state_review={state_review_value!r}:\n"
            f"{result['error_message']}"
        )

    @pytest.mark.parametrize(
        "submission_type,tracking_number",
        [
            ("Application", 99999910),
            ("Preapplication", 99999911),
            ("Changed/Corrected Application", 99999912),
        ],
        ids=["application", "preapplication", "changed_corrected"],
    )
    def test_sf424_submission_type_all_options_xsd_validation(
        self,
        enable_factory_create,
        xsd_validator,
        seed_form_registry,
        submission_type,
        tracking_number,
    ):
        """Test that all three SubmissionType enum values produce XSD-valid XML.

        SubmissionType is a required XSD enum — any value not in the XSD definition
        will fail validation. This test ensures all options remain in sync with the XSD.
        """
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(
            opportunity_number=f"TEST-OPP-ST-{tracking_number}",
            opportunity_title="Submission Type Coverage Test",
            agency_code=agency.agency_code,
        )
        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=f"TEST-COMP-ST-{tracking_number}",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        competition_form = CompetitionFormFactory.create(competition=competition, form=SF424_v4_0)
        application = ApplicationFactory.create(
            competition=competition, application_name="Submission Type Coverage Application"
        )
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": submission_type,
                "application_type": "New",
                "date_received": "2025-01-15",
                "organization_name": "Test Research University",
                "employer_taxpayer_identification_number": "123456789",
                "sam_uei": "TEST12345678",
                "applicant": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {"first_name": "John", "last_name": "Doe"},
                "phone_number": "555-123-4567",
                "email": "test@example.org",
                "applicant_type_code": ["C: City or Township Government"],
                "agency_name": "Test Agency",
                "funding_opportunity_number": "TEST-FON-2025-001",
                "funding_opportunity_title": "Test Funding Opportunity",
                "project_title": "Submission Type Coverage Test",
                "congressional_district_applicant": "DC-00",
                "congressional_district_program_project": "DC-00",
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "federal_estimated_funding": "100000.00",
                "applicant_estimated_funding": "0.00",
                "state_estimated_funding": "0.00",
                "local_estimated_funding": "0.00",
                "other_estimated_funding": "0.00",
                "program_income_estimated_funding": "0.00",
                "total_estimated_funding": "100000.00",
                "state_review": "c. Program is not covered by E.O. 12372.",
                "delinquent_federal_debt": False,
                "certification_agree": True,
                "authorized_representative": {"first_name": "John", "last_name": "Doe"},
                "authorized_representative_title": "Director",
                "authorized_representative_phone_number": "555-111-2222",
                "authorized_representative_email": "john.doe@test.org",
                "aor_signature": "John Doe Signature",
                "date_signed": "2025-01-15",
            },
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=tracking_number
        )
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)
        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_xml = lxml_etree.tostring(
            forms_element.findall(f".//{sf424_ns}SF424_4_0")[0], encoding="unicode"
        )
        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        result = xsd_validator.validate_xml(sf424_xml, xsd_path)
        assert result["valid"], (
            f"SF-424 XSD validation failed for submission_type={submission_type!r}:\n"
            f"{result['error_message']}"
        )

    @pytest.mark.parametrize(
        "application_type,extra_fields,tracking_number",
        [
            ("New", {}, 99999920),
            ("Continuation", {}, 99999921),
            ("Revision", {"revision_type": "A: Increase Award"}, 99999922),
        ],
        ids=["new", "continuation", "revision"],
    )
    def test_sf424_application_type_all_options_xsd_validation(
        self,
        enable_factory_create,
        xsd_validator,
        seed_form_registry,
        application_type,
        extra_fields,
        tracking_number,
    ):
        """Test that all three ApplicationType enum values produce XSD-valid XML.

        ApplicationType is a required XSD enum. Revision additionally exercises the
        optional RevisionType element.
        """
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(
            opportunity_number=f"TEST-OPP-AT-{tracking_number}",
            opportunity_title="Application Type Coverage Test",
            agency_code=agency.agency_code,
        )
        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=f"TEST-COMP-AT-{tracking_number}",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        competition_form = CompetitionFormFactory.create(competition=competition, form=SF424_v4_0)
        application = ApplicationFactory.create(
            competition=competition, application_name="Application Type Coverage Application"
        )
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": "Application",
                "application_type": application_type,
                "date_received": "2025-01-15",
                "organization_name": "Test Research University",
                "employer_taxpayer_identification_number": "123456789",
                "sam_uei": "TEST12345678",
                "applicant": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {"first_name": "John", "last_name": "Doe"},
                "phone_number": "555-123-4567",
                "email": "test@example.org",
                "applicant_type_code": ["C: City or Township Government"],
                "agency_name": "Test Agency",
                "funding_opportunity_number": "TEST-FON-2025-001",
                "funding_opportunity_title": "Test Funding Opportunity",
                "project_title": "Application Type Coverage Test",
                "congressional_district_applicant": "DC-00",
                "congressional_district_program_project": "DC-00",
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "federal_estimated_funding": "100000.00",
                "applicant_estimated_funding": "0.00",
                "state_estimated_funding": "0.00",
                "local_estimated_funding": "0.00",
                "other_estimated_funding": "0.00",
                "program_income_estimated_funding": "0.00",
                "total_estimated_funding": "100000.00",
                "state_review": "c. Program is not covered by E.O. 12372.",
                "delinquent_federal_debt": False,
                "certification_agree": True,
                "authorized_representative": {"first_name": "John", "last_name": "Doe"},
                "authorized_representative_title": "Director",
                "authorized_representative_phone_number": "555-111-2222",
                "authorized_representative_email": "john.doe@test.org",
                "aor_signature": "John Doe Signature",
                "date_signed": "2025-01-15",
                **extra_fields,
            },
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=tracking_number
        )
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)
        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_xml = lxml_etree.tostring(
            forms_element.findall(f".//{sf424_ns}SF424_4_0")[0], encoding="unicode"
        )
        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        result = xsd_validator.validate_xml(sf424_xml, xsd_path)
        assert result["valid"], (
            f"SF-424 XSD validation failed for application_type={application_type!r}:\n"
            f"{result['error_message']}"
        )

    @pytest.mark.parametrize(
        "applicant_type_code,extra_fields,tracking_number",
        [
            # Option H: stored with lowercase "state" in DB (form enum value).
            # The XML transformer normalizes to capital "State" before writing to XML.
            (["H: Public/state Controlled Institution of Higher Education"], {}, 99999930),
            # Option X: requires applicant_type_other_specify
            (["X: Other (specify)"], {"applicant_type_other_specify": "Community org"}, 99999931),
            # Multiple codes (up to 3 allowed by XSD)
            (
                ["A: State Government", "B: County Government", "C: City or Township Government"],
                {},
                99999932,
            ),
        ],
        ids=["option_H_capitalization", "option_X_with_other_specify", "multiple_codes"],
    )
    def test_sf424_applicant_type_code_xsd_validation(
        self,
        enable_factory_create,
        xsd_validator,
        seed_form_registry,
        applicant_type_code,
        extra_fields,
        tracking_number,
    ):
        """Test applicant_type_code values that have known XSD-validation risks.

        Option H previously had a lowercase 'state' (should be 'State') that would
        cause XSD failure for any applicant selecting that type. Option X exercises
        the conditional required field. Multiple codes exercises the multi-value path.
        """
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(
            opportunity_number=f"TEST-OPP-ATC-{tracking_number}",
            opportunity_title="Applicant Type Code Coverage Test",
            agency_code=agency.agency_code,
        )
        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=f"TEST-COMP-ATC-{tracking_number}",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        competition_form = CompetitionFormFactory.create(competition=competition, form=SF424_v4_0)
        application = ApplicationFactory.create(
            competition=competition, application_name="Applicant Type Code Coverage Application"
        )
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "submission_type": "Application",
                "application_type": "New",
                "date_received": "2025-01-15",
                "organization_name": "Test Research University",
                "employer_taxpayer_identification_number": "123456789",
                "sam_uei": "TEST12345678",
                "applicant": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {"first_name": "John", "last_name": "Doe"},
                "phone_number": "555-123-4567",
                "email": "test@example.org",
                "applicant_type_code": applicant_type_code,
                "agency_name": "Test Agency",
                "funding_opportunity_number": "TEST-FON-2025-001",
                "funding_opportunity_title": "Test Funding Opportunity",
                "project_title": "Applicant Type Code Coverage Test",
                "congressional_district_applicant": "DC-00",
                "congressional_district_program_project": "DC-00",
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "federal_estimated_funding": "100000.00",
                "applicant_estimated_funding": "0.00",
                "state_estimated_funding": "0.00",
                "local_estimated_funding": "0.00",
                "other_estimated_funding": "0.00",
                "program_income_estimated_funding": "0.00",
                "total_estimated_funding": "100000.00",
                "state_review": "c. Program is not covered by E.O. 12372.",
                "delinquent_federal_debt": False,
                "certification_agree": True,
                "authorized_representative": {"first_name": "John", "last_name": "Doe"},
                "authorized_representative_title": "Director",
                "authorized_representative_phone_number": "555-111-2222",
                "authorized_representative_email": "john.doe@test.org",
                "aor_signature": "John Doe Signature",
                "date_signed": "2025-01-15",
                **extra_fields,
            },
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=tracking_number
        )
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)
        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424_xml = lxml_etree.tostring(
            forms_element.findall(f".//{sf424_ns}SF424_4_0")[0], encoding="unicode"
        )
        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )
        result = xsd_validator.validate_xml(sf424_xml, xsd_path)
        assert result["valid"], (
            f"SF-424 XSD validation failed for applicant_type_code={applicant_type_code!r}:\n"
            f"{result['error_message']}"
        )

    @pytest.fixture
    def sf424_short_application(self, enable_factory_create, seed_form_registry):
        """Create an application with SF-424 Short form and minimal XSD-compliant data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-SF424S-001",
            opportunity_title="SF-424 Short Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.456"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-SF424S-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-424 Short Test Application"
        )

        competition_form = CompetitionFormFactory.create(
            competition=competition, form=SF424Short_v3_0
        )

        _contact = {
            "name": {"first_name": "Jane", "last_name": "Doe"},
            "title": "Project Director",
            "email": "jane.doe@example.org",
            "phone_number": "555-123-4567",
            "address": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
        }

        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "agency_name": "Department of Research",
                "funding_opportunity_number": "TEST-SF424S-FON-001",
                "funding_opportunity_title": "SF-424 Short Test Opportunity",
                "organization_name": "Test Research University",
                "applicant": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                    "country": "USA: UNITED STATES",
                },
                "applicant_type_code": ["C: City or Township Government"],
                "employer_taxpayer_identification_number": "123456789",
                "sam_uei": "TEST12345678",
                "congressional_district_applicant": "DC-001",
                "project_title": "SF-424 Short XSD Validation Test",
                "project_description": "A test project for XSD validation.",
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-12-31",
                "project_director": _contact,
                "contact_person": _contact,
                "application_certification": True,
                "authorized_representative": {"first_name": "Bob", "last_name": "Smith"},
                "authorized_representative_title": "Director",
                "authorized_representative_email": "bob.smith@example.org",
                "authorized_representative_phone_number": "555-987-6543",
                "date_received": "2025-01-15",
                "aor_signature": "bob.smith@example.org",
                "authorized_representative_date_signed": "2025-01-15",
            },
        )

        return application

    def test_sf424_short_submission_xml_validates_against_xsd(
        self, sf424_short_application, xsd_validator
    ):
        """Test that SF-424 Short submission XML validates against the legacy XSD schema."""
        application_submission = ApplicationSubmissionFactory.create(
            application=sf424_short_application,
            legacy_tracking_number=77777777,
        )

        assembler = SubmissionXMLAssembler(sf424_short_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None
        assert len(xml_string) > 0

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        sf424_short_ns = "{http://apply.grants.gov/forms/SF424_Short_3_0-V3.0}"
        sf424_short_elements = forms_element.findall(f".//{sf424_short_ns}SF424_Short_3_0")
        assert len(sf424_short_elements) == 1, "Expected exactly one SF424_Short_3_0 element"

        sf424_short_xml = lxml_etree.tostring(sf424_short_elements[0], encoding="unicode")
        xsd_path = self._get_xsd_file_path(
            xsd_validator,
            "https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd",
        )
        validation_result = xsd_validator.validate_xml(sf424_short_xml, xsd_path)

        assert validation_result["valid"], (
            f"SF-424 Short XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424_short_xml[:1000]}"
        )
