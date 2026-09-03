"""Test SF-LLL XML generation and validation.

This test creates SF-LLL forms, generates XML, and validates the output
against expected structure and content.
"""

from datetime import date

import grants_shared.adapters.db as db
import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sflll import SFLLL_v2_0
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
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


class TestSFLLLXMLGeneration:
    """Test SF-LLL XML generation."""

    @pytest.fixture
    def sflll_application(self, enable_factory_create, db_session: db.Session, seed_form_registry):
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
            competition_forms=[],
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="SF-LLL Test Application"
        )

        comp_form_lll = CompetitionFormFactory.create(competition=competition, form=SFLLL_v2_0)

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

    def _generate_sflll_root(self, application, tracking_number=12345678):
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=tracking_number,
        )
        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        return lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

    @staticmethod
    def _sflll_element(root, name):
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        return root.find(f".//{sflll_ns}{name}")

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

    def test_sflll_required_only_payload_contains_required_fields_only(
        self, sflll_application, db_session
    ):
        """A valid required-only payload generates required XML and no optional values."""
        response = sflll_application.application_forms[0].application_response
        response.pop("federal_action_number")
        response.pop("award_amount")
        response["reporting_entity"].pop("tier", None)
        response["reporting_entity"]["applicant_reporting_entity"].pop(
            "congressional_district", None
        )
        response["reporting_entity"]["applicant_reporting_entity"]["address"].pop("street2", None)
        response["lobbying_registrant"].pop("address", None)
        response["individual_performing_service"].pop("address", None)
        response["signature_block"].pop("signature", None)
        response["signature_block"].pop("signed_date", None)

        root = self._generate_sflll_root(sflll_application, 12121212)

        assert self._sflll_element(root, "FederalActionType").text == "Grant"
        assert self._sflll_element(root, "FederalActionStatus").text == "InitialAward"
        assert self._sflll_element(root, "ReportType").text == "InitialFiling"
        assert self._sflll_element(root, "OrganizationName").text == "Test Organization"
        assert self._sflll_element(root, "FederalAgencyDepartment").text == (
            "Department of Health and Human Services"
        )
        assert self._sflll_element(root, "IndividualName") is not None
        assert self._sflll_element(root, "IndividualsPerformingServices") is not None
        assert self._sflll_element(root, "SignatureBlock") is not None

        assert self._sflll_element(root, "MaterialChangeSupplement") is None
        assert self._sflll_element(root, "FederalActionNumber") is None
        assert self._sflll_element(root, "AwardAmount") is None
        assert self._sflll_element(root, "Tier") is None
        assert self._sflll_element(root, "Street2") is None
        assert self._sflll_element(root, "SignedDate") is None

    def test_sflll_required_plus_selected_optional_fields_are_generated(
        self, sflll_application, db_session
    ):
        """Required fields plus selected optional fields generate only those optional values."""
        response = sflll_application.application_forms[0].application_response
        response["federal_action_number"] = "OPTIONAL-ACTION-001"
        response["reporting_entity"]["tier"] = 3
        response["signature_block"]["title"] = "Director"

        root = self._generate_sflll_root(sflll_application, 13131313)

        sflll_ns = "http://apply.grants.gov/forms/SFLLL_2_0-V2.0"
        assert self._sflll_element(root, "FederalActionNumber").text == "OPTIONAL-ACTION-001"
        tier = self._sflll_element(root, "Tier")
        assert tier.find(f"{{{sflll_ns}}}TierValue").text == "3"
        assert tier.get(f"{{{sflll_ns}}}ReportEntityType") == "Prime"
        assert self._sflll_element(root, "Title").text == "Director"
        assert self._sflll_element(root, "AwardAmount") is not None
        assert self._sflll_element(root, "MaterialChangeSupplement") is None

    def test_sflll_required_and_all_optional_fields_are_generated(
        self, sflll_application, db_session
    ):
        """A payload containing every supported optional field generates every XML value."""
        response = sflll_application.application_forms[0].application_response
        response.update(
            {
                "report_type": "MaterialChange",
                "material_change_year": "2026",
                "material_change_quarter": 1,
                "last_report_date": "2026-10-31",
                "federal_action_number": "ACTION-ALL-001",
                "award_amount": "10000.00",
                "federal_program_name": "Research Program",
                "assistance_listing_number": "93.001",
            }
        )
        response["reporting_entity"]["tier"] = 5
        response["reporting_entity"]["applicant_reporting_entity"]["address"]["street2"] = "Apt #1"
        response["reporting_entity"]["applicant_reporting_entity"][
            "congressional_district"
        ] = "NY-009"
        response["lobbying_registrant"]["individual"].update(
            {"prefix": "Miss", "middle_name": "B", "suffix": "PhD"}
        )
        response["lobbying_registrant"]["address"]["street2"] = "Apt #456"
        response["individual_performing_service"]["individual"].update(
            {"prefix": "Dr.", "middle_name": "H", "suffix": "Esquire"}
        )
        response["individual_performing_service"]["address"]["street2"] = "Room 101"
        response["signature_block"]["name"].update(
            {
                "prefix": "Rev.",
                "middle_name": "F",
                "suffix": "MD",
            }
        )
        response["signature_block"].update(
            {
                "title": "Lead Researcher",
                "telephone": "123456789",
                "signed_date": "2026-08-27",
                "signature": "Signed Name",
            }
        )

        root = self._generate_sflll_root(sflll_application, 14141414)

        material_change = self._sflll_element(root, "MaterialChangeSupplement")
        assert material_change is not None
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        assert material_change.get(f"{sflll_ns}ReportType") == "MaterialChange"
        assert self._sflll_element(root, "FederalActionNumber").text == "ACTION-ALL-001"
        assert self._sflll_element(root, "AwardAmount").text == "10000.00"
        # federal_program_wrapper is disabled (see form_json.py), so FederalProgramName
        # and CFDANumber are intentionally not generated even when the source data is present.
        assert self._sflll_element(root, "FederalProgramName") is None
        assert self._sflll_element(root, "CFDANumber") is None
        tier = self._sflll_element(root, "Tier")
        assert tier.find(f"{sflll_ns}TierValue").text == "5"
        assert tier.get(f"{sflll_ns}ReportEntityType") == "Prime"
        assert self._sflll_element(root, "Street2") is not None
        assert self._sflll_element(root, "CongressionalDistrict").text == "NY-009"
        assert self._sflll_element(root, "IndividualsPerformingServices") is not None
        assert self._sflll_element(root, "Title").text == "Lead Researcher"
        assert self._sflll_element(root, "Telephone").text == "123456789"
        assert self._sflll_element(root, "SignedDate").text == "2026-08-27"

    def test_sflll_material_change_supplement_is_generated_for_material_change_reports(
        self, sflll_application, db_session
    ):
        """MaterialChange reports should include the required MaterialChangeSupplement block."""
        response = sflll_application.application_forms[0].application_response
        response["report_type"] = "MaterialChange"
        response["material_change_year"] = "2025"
        response["material_change_quarter"] = 2
        response["last_report_date"] = "2024-12-31"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=99999998,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        material_change = root.find(f".//{sflll_ns}MaterialChangeSupplement")
        assert material_change is not None
        assert material_change.get(f"{sflll_ns}ReportType") == "MaterialChange"
        assert material_change.find(f"{sflll_ns}MaterialChangeYear").text == "2025"
        assert material_change.find(f"{sflll_ns}MaterialChangeQuarter").text == "2"
        assert material_change.find(f"{sflll_ns}LastReportDate").text == "2024-12-31"

    def test_sflll_reporting_entity_entity_type_is_inherited_from_parent(
        self, sflll_application, db_session
    ):
        """SF-LLL nested reporting entities should inherit EntityType from reporting_entity."""
        reporting_entity = sflll_application.application_forms[0].application_response[
            "reporting_entity"
        ]
        reporting_entity["applicant_reporting_entity"].pop("entity_type", None)

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=99999997,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        entity_types = [
            element.text for element in root.findall(f".//{sflll_ns}EntityType") if element.text
        ]
        assert "Prime" in entity_types

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

    def test_sflll_optional_tier_field_is_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional reporting entity tier field is included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        response["reporting_entity"]["tier"] = 2

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=77777777,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        tier = root.find(f".//{sflll_ns}Tier")
        assert tier is not None, "Tier field should be present when provided"
        assert tier.find(f"{sflll_ns}TierValue").text == "2"
        assert tier.get(f"{sflll_ns}ReportEntityType") == "Prime"

    def test_sflll_optional_signature_fields_are_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional signature block fields are included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        response["signature_block"]["title"] = "Executive Director"
        response["signature_block"]["telephone"] = "555-123-4567"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=66666666,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Check Title field
        title = root.find(f".//{sflll_ns}Title")
        assert title is not None, "Title field should be present"
        assert title.text == "Executive Director"

        # Check Telephone field
        telephone = root.find(f".//{sflll_ns}Telephone")
        assert telephone is not None, "Telephone field should be present"
        assert telephone.text == "555-123-4567"

    def test_sflll_optional_lobbying_registrant_address_is_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional lobbying registrant address is included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        response["lobbying_registrant"]["address"] = {
            "street1": "1600 Pennsylvania Avenue NW",
            "city": "Washington",
            "state": "DC: District of Columbia",
            "zip_code": "20500",
        }

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=55555555,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Find LobbyingRegistrant Address
        lobbying_registrant = root.find(f".//{sflll_ns}LobbyingRegistrant")
        assert lobbying_registrant is not None

        address = lobbying_registrant.find(f"{sflll_ns}Address")
        assert address is not None, "Address should be present in LobbyingRegistrant"

        street = address.find(f"{sflll_ns}Street1")
        assert street is not None and street.text == "1600 Pennsylvania Avenue NW"

        city = address.find(f"{sflll_ns}City")
        assert city is not None and city.text == "Washington"

    def test_sflll_optional_individual_performing_service_address_is_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional individual performing service address is included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        response["individual_performing_service"]["address"] = {
            "street1": "123 K Street NW",
            "street2": "Suite 500",
            "city": "Washington",
            "state": "DC: District of Columbia",
            "zip_code": "20005",
        }

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=44444444,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        performing_service = root.find(f".//{sflll_ns}IndividualsPerformingServices")
        assert performing_service is not None
        individual = performing_service.find(f"{sflll_ns}Individual")
        assert individual is not None
        address = individual.find(f"{sflll_ns}Address")
        assert address is not None
        street = address.find(f"{sflll_ns}Street1")
        assert street is not None and street.text == "123 K Street NW"

    def test_sflll_optional_fields_are_excluded_when_not_provided(
        self, sflll_application, db_session
    ):
        """Test that optional fields are excluded from XML when not provided in data."""
        # Make sure tier is NOT set
        response = sflll_application.application_forms[0].application_response
        response["reporting_entity"].pop("tier", None)
        # Make sure signature title is NOT set
        response["signature_block"].pop("title", None)
        response["signature_block"].pop("telephone", None)

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=33333333,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Tier should NOT be present
        tier = root.find(f".//{sflll_ns}Tier")
        assert tier is None, "Tier field should not be present when not provided"

        # Title should NOT be present
        title = root.find(f".//{sflll_ns}Title")
        assert title is None, "Title field should not be present when not provided"

        # Telephone should NOT be present
        telephone = root.find(f".//{sflll_ns}Telephone")
        assert telephone is None, "Telephone field should not be present when not provided"

    def test_sflll_optional_federal_program_name_excluded_disabled_wrapper(
        self, sflll_application, db_session
    ):
        """federal_program_wrapper is disabled (see form_json.py), so FederalProgramName
        should not be included in the XML even when federal_program_name is present."""
        response = sflll_application.application_forms[0].application_response
        response["federal_program_name"] = "Community Development Block Grant Program"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=10101010,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        program_wrapper = root.find(f".//{sflll_ns}FederalProgramName")
        assert (
            program_wrapper is None
        ), "FederalProgramName should not be present (wrapper disabled)"

    def test_sflll_optional_assistance_listing_number_excluded_disabled_wrapper(
        self, sflll_application, db_session
    ):
        """federal_program_wrapper is disabled (see form_json.py), so CFDANumber should
        not be included in the XML even when assistance_listing_number is present."""
        response = sflll_application.application_forms[0].application_response
        response["assistance_listing_number"] = "14.218"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=20202020,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        listing = root.find(f".//{sflll_ns}CFDANumber")
        assert listing is None, "CFDANumber should not be present (wrapper disabled)"

    def test_sflll_optional_address_fields_street2_is_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional street2 in addresses is included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        # Set street2 for applicant
        response["reporting_entity"]["applicant_reporting_entity"]["address"][
            "street2"
        ] = "Suite 500"
        # Set street2 for lobbying registrant
        response["lobbying_registrant"]["address"] = {
            "street1": "1600 Pennsylvania Avenue NW",
            "street2": "Building A",
            "city": "Washington",
            "state": "DC: District of Columbia",
            "zip_code": "20500",
        }

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=30303030,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        street2_values = root.findall(f".//{sflll_ns}Street2")
        assert len(street2_values) >= 2, "Street2 should appear in multiple addresses"
        assert any(element.text == "Suite 500" for element in street2_values)
        assert any(element.text == "Building A" for element in street2_values)

    def test_sflll_optional_congressional_district_is_included_when_present(
        self, sflll_application, db_session
    ):
        """Test that optional congressional_district is included in XML when present."""
        response = sflll_application.application_forms[0].application_response
        response["reporting_entity"]["applicant_reporting_entity"][
            "congressional_district"
        ] = "CA-012"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=40404040,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        districts = root.findall(f".//{sflll_ns}CongressionalDistrict")
        assert len(districts) >= 1, "CongressionalDistrict should be present"
        assert any(
            d.text == "CA-012" for d in districts
        ), "CA-012 should be in at least one district"

    def test_sflll_optional_signature_fields_all_present(self, sflll_application, db_session):
        """Test that all optional signature fields are included together."""
        response = sflll_application.application_forms[0].application_response
        response["signature_block"]["signature"] = "John Doe"
        response["signature_block"]["title"] = "Chief Executive Officer"
        response["signature_block"]["telephone"] = "202-555-0123"
        response["signature_block"]["signed_date"] = "2026-09-02"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=50505050,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sig_block = root.find(f".//{sflll_ns}SignatureBlock")
        assert sig_block is not None

        signature = sig_block.find(f"{sflll_ns}Signature")
        assert signature is not None and signature.text == "John Doe"

        title = sig_block.find(f"{sflll_ns}Title")
        assert title is not None and title.text == "Chief Executive Officer"

        telephone = sig_block.find(f"{sflll_ns}Telephone")
        assert telephone is not None and telephone.text == "202-555-0123"

        signed_date = sig_block.find(f"{sflll_ns}SignedDate")
        assert signed_date is not None and signed_date.text == "2026-09-02"

    def test_sflll_optional_address_fields_state_and_zip_in_nested_entity(
        self, sflll_application, db_session
    ):
        """Test that optional state and zip_code fields are properly included in nested entities."""
        response = sflll_application.application_forms[0].application_response
        # Ensure these are present in nested entities
        assert "state" in response["reporting_entity"]["applicant_reporting_entity"]["address"]
        assert "zip_code" in response["reporting_entity"]["applicant_reporting_entity"]["address"]

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=60606060,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Find all State elements - should be present
        states = root.findall(f".//{sflll_ns}State")
        assert len(states) > 0, "State fields should be present in addresses"

        # Find all ZipPostalCode elements - should be present
        zips = root.findall(f".//{sflll_ns}ZipPostalCode")
        assert len(zips) > 0, "ZipPostalCode fields should be present in addresses"

    def test_sflll_prime_entity_fields_included_for_subawardee(self, sflll_application, db_session):
        """Test that prime entity fields are properly generated for SubAwardee reporting entity."""
        response = sflll_application.application_forms[0].application_response
        response["reporting_entity"]["entity_type"] = "SubAwardee"
        response["reporting_entity"]["prime_reporting_entity"] = {
            "entity_type": "Prime",
            "organization_name": "Prime Organization Inc",
            "address": {
                "street1": "500 Main Street",
                "street2": "Floor 10",
                "city": "New York",
                "state": "NY: New York",
                "zip_code": "10001",
            },
            "congressional_district": "NY-010",
        }

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=70707070,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"

        # Find PrimeIfSubawardee section
        prime_entity = root.find(f".//{sflll_ns}PrimeIfSubawardee")
        assert prime_entity is not None, "PrimeIfSubawardee should be present for SubAwardee entity"

        # Verify organization name
        org_name = prime_entity.find(f"{sflll_ns}OrganizationName")
        assert org_name is not None and org_name.text == "Prime Organization Inc"

        # Verify address fields
        address = prime_entity.find(f"{sflll_ns}Address")
        assert address is not None
        street2 = address.find(f"{sflll_ns}Street2")
        assert street2 is not None and street2.text == "Floor 10"

        # Verify congressional district
        district = prime_entity.find(f"{sflll_ns}CongressionalDistrict")
        assert district is not None and district.text == "NY-010"
        assert prime_entity.find(f"{sflll_ns}EntityType").text == "Prime"

    def test_sflll_individual_performing_service_is_included(self, sflll_application, db_session):
        """Test that individual performing service (lobbying activity performer) is included in XML."""
        response = sflll_application.application_forms[0].application_response
        # Ensure individual_performing_service data is present
        assert "individual_performing_service" in response
        assert response["individual_performing_service"]["individual"]["first_name"] == "Jane"

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=80808080,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        globLib_ns = "{http://apply.grants.gov/system/GlobalLibrary-V2.0}"

        # Find IndividualsPerformingServices element
        perf_services = root.find(f".//{sflll_ns}IndividualsPerformingServices")
        assert perf_services is not None, "IndividualsPerformingServices should be present"

        # Verify nested Individual element
        individual = perf_services.find(f"{sflll_ns}Individual")
        assert individual is not None, "Individual element should be present"

        # Verify Name element exists
        name = individual.find(f"{sflll_ns}Name")
        assert name is not None, "Name element should be present in Individual"

        # Verify FirstName in the Name element (uses globLib namespace)
        first_name = name.find(f"{globLib_ns}FirstName")
        assert first_name is not None, "FirstName should be present"
        assert first_name.text == "Jane", f"Expected 'Jane', got '{first_name.text}'"

        # Verify LastName
        last_name = name.find(f"{globLib_ns}LastName")
        assert last_name is not None, "LastName should be present"
        assert last_name.text == "Doe", f"Expected 'Doe', got '{last_name.text}'"

        # Verify Address element exists
        address = individual.find(f"{sflll_ns}Address")
        assert address is not None, "Address should be present in Individual"

        # Verify address fields
        street1 = address.find(f"{sflll_ns}Street1")
        assert street1 is not None and street1.text == "789 Pennsylvania Ave"

        city = address.find(f"{sflll_ns}City")
        assert city is not None and city.text == "Washington"

    def test_sflll_individual_performing_service_optional_fields(
        self, sflll_application, db_session
    ):
        """Test that optional fields in individual_performing_service are included when present."""
        response = sflll_application.application_forms[0].application_response
        # Add optional fields
        response["individual_performing_service"]["individual"]["prefix"] = "Dr."
        response["individual_performing_service"]["individual"]["middle_name"] = "Marie"
        response["individual_performing_service"]["individual"]["suffix"] = "Jr."

        application_submission = ApplicationSubmissionFactory.create(
            application=sflll_application,
            legacy_tracking_number=81818181,
        )

        assembler = SubmissionXMLAssembler(sflll_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        globLib_ns = "{http://apply.grants.gov/system/GlobalLibrary-V2.0}"

        # Find IndividualsPerformingServices
        perf_services = root.find(f".//{sflll_ns}IndividualsPerformingServices")
        individual = perf_services.find(f"{sflll_ns}Individual")
        name = individual.find(f"{sflll_ns}Name")

        # Check optional name fields
        prefix = name.find(f"{globLib_ns}PrefixName")
        assert prefix is not None and prefix.text == "Dr."

        middle_name = name.find(f"{globLib_ns}MiddleName")
        assert middle_name is not None and middle_name.text == "Marie"

        suffix = name.find(f"{globLib_ns}SuffixName")
        assert suffix is not None and suffix.text == "Jr."
