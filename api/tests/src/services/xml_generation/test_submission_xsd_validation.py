"""End-to-end XSD validation tests for complete application submission XML.

These tests create real applications with form data, generate complete submission XML
using SubmissionXMLAssembler, and validate the output against XSD schemas.
"""

from datetime import date

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES as SF424_TRANSFORM_RULES
from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES as SF424A_TRANSFORM_RULES
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
class TestSubmissionXSDValidation:
    """End-to-end XSD validation tests for complete application submissions."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with cache directory."""
        from pathlib import Path

        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip(
                "XSD cache directory not found. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to cached file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_cache_dir / xsd_filename

    @pytest.fixture
    def sf424_application(self, enable_factory_create, db_session: db.Session):
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
        )

        # Create SF424 form with XML transform config
        sf424_form = FormFactory.create(
            form_name="Application for Federal Assistance (SF-424)",
            short_form_name="SF424_4_0",
            form_version="4.0",
            json_to_xml_schema=SF424_TRANSFORM_RULES,
        )

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
                "applicant_address": {  # Required per XSD
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_postal_code": "20001",
                    "country": "USA: UNITED STATES",
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
    def sf424a_application(self, enable_factory_create, db_session: db.Session):
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
        )

        # Create SF424A form with XML transform config
        sf424a_form = FormFactory.create(
            form_name="Budget Information - Non-Construction Programs",
            short_form_name="SF424A",
            form_version="1.0",
            json_to_xml_schema=SF424A_TRANSFORM_RULES,
        )

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
                            "total_new_or_revised_amount": "60000.00",
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
                    "total_new_or_revised_amount": "60000.00",
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

    def test_sf424_submission_xml_validates_against_xsd(
        self, sf424_application, xsd_validator, db_session
    ):
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
        forms_element = root.find(".//Forms")
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

    def test_sf424a_submission_xml_validates_against_xsd(
        self, sf424a_application, xsd_validator, db_session
    ):
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
        forms_element = root.find(".//Forms")
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
        self, enable_factory_create, xsd_validator, db_session
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
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="Multi-Form Test Application"
        )

        # Add SF-424 form
        sf424_form = FormFactory.create(
            form_name="Application for Federal Assistance (SF-424)",
            short_form_name="SF424_4_0",
            form_version="4.0",
            json_to_xml_schema=SF424_TRANSFORM_RULES,
        )
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
                "applicant_address": {  # Required per XSD
                    "street1": "456 Oak Ave",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_postal_code": "20002",
                    "country": "USA: UNITED STATES",
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
        sf424a_form = FormFactory.create(
            form_name="Budget Information - Non-Construction Programs",
            short_form_name="SF424A",
            form_version="1.0",
            json_to_xml_schema=SF424A_TRANSFORM_RULES,
        )
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
                            "total_new_or_revised_amount": "50000.00",
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
                "total_budget_summary": {"total_new_or_revised_amount": "50000.00"},
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

        forms_element = root.find(".//Forms")
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

    def test_submission_xml_structure_is_well_formed(self, sf424_application, db_session):
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

        # Verify root element
        assert root.tag == "GrantApplication"

        # Verify required namespaces exist
        assert "http://apply.grants.gov/system/Header-V1.0" in root.nsmap.values()
        assert "http://apply.grants.gov/system/Footer-V1.0" in root.nsmap.values()
        assert "http://apply.grants.gov/system/Global-V1.0" in root.nsmap.values()

        # Verify structure: Header -> Forms -> Footer
        header_ns = "{http://apply.grants.gov/system/Header-V1.0}"
        footer_ns = "{http://apply.grants.gov/system/Footer-V1.0}"

        header = root.find(f".//{header_ns}GrantSubmissionHeader")
        forms = root.find(".//Forms")
        footer = root.find(f".//{footer_ns}GrantSubmissionFooter")

        assert header is not None, "Header not found"
        assert forms is not None, "Forms not found"
        assert footer is not None, "Footer not found"

        # Verify order: Header should come before Forms, Forms before Footer
        children = list(root)
        header_idx = next(i for i, child in enumerate(children) if "Header" in child.tag)
        forms_idx = next(i for i, child in enumerate(children) if child.tag == "Forms")
        footer_idx = next(i for i, child in enumerate(children) if "Footer" in child.tag)

        assert header_idx < forms_idx < footer_idx, "Elements not in correct order"
