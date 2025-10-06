"""Tests for header XML generation."""

from datetime import date

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.header_generator import (
    HEADER_NAMESPACES,
    SubmissionXMLGenerator,
    generate_application_header_xml,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


@pytest.fixture
def application(enable_factory_create, db_session):
    """Create an application with all fields populated for testing."""
    # Check if the agency already exists, create if not
    from src.db.models.agency_models import Agency

    agency = db_session.query(Agency).filter(Agency.agency_code == "TST").one_or_none()
    if not agency:
        agency = AgencyFactory.create(
            agency_code="TST",
            agency_name="Test Agency",
        )

    opportunity = OpportunityFactory.create(
        opportunity_number="TEST-OPP-12345",
        opportunity_title="Test Opportunity Title",
        agency_code=agency.agency_code,
    )

    opportunity_assistance_listing = OpportunityAssistanceListingFactory.create(
        opportunity=opportunity,
        assistance_listing_number="12.345",
    )

    competition = CompetitionFactory.create(
        opportunity=opportunity,
        public_competition_id="TEST-COMP-2025-001",
        opening_date=date(2025, 9, 2),
        closing_date=date(2025, 9, 30),
        opportunity_assistance_listing=opportunity_assistance_listing,
    )

    application = ApplicationFactory.create(
        competition=competition,
        application_name="Test Application",
    )

    return application


class TestSubmissionXMLGenerator:
    """Test cases for SubmissionXMLGenerator."""

    def test_generate_header_with_all_fields(self, application):
        """Test header generation with all fields populated."""
        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        # Parse the XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))

        # Verify root element and namespaces
        assert root.tag == f"{{{HEADER_NAMESPACES['header']}}}GrantSubmissionHeader"
        assert root.get(f"{{{HEADER_NAMESPACES['glob']}}}schemaVersion") == "1.0"

        # Verify HashValue element
        hash_value_elem = root.find(f"{{{HEADER_NAMESPACES['glob']}}}HashValue")
        assert hash_value_elem is not None
        assert hash_value_elem.get(f"{{{HEADER_NAMESPACES['glob']}}}hashAlgorithm") == "SHA-1"
        assert hash_value_elem.text is not None
        assert len(hash_value_elem.text) > 0

        # Verify header fields
        agency_name_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}AgencyName")
        assert agency_name_elem is not None
        assert agency_name_elem.text == "Test Agency"

        opp_id_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpportunityID")
        assert opp_id_elem is not None
        assert opp_id_elem.text == "TEST-OPP-12345"

        opp_title_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpportunityTitle")
        assert opp_title_elem is not None
        assert opp_title_elem.text == "Test Opportunity Title"

        comp_id_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}CompetitionID")
        assert comp_id_elem is not None
        assert comp_id_elem.text == "TEST-COMP-2025-001"

        opening_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpeningDate")
        assert opening_date_elem is not None
        assert opening_date_elem.text == "2025-09-02"

        closing_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}ClosingDate")
        assert closing_date_elem is not None
        assert closing_date_elem.text == "2025-09-30"

        submission_title_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}SubmissionTitle")
        assert submission_title_elem is not None
        assert submission_title_elem.text == "Test Application"

        cfda_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}CFDANumber")
        assert cfda_elem is not None
        assert cfda_elem.text == "12.345"

    def test_generate_header_without_agency_name_uses_code(self, enable_factory_create):
        """Test that agency code is used when agency name is None."""
        # When there's no Agency record, agency_name will be None, so agency_code is used
        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-OPP-12345",
            opportunity_title="Test Opportunity Title",
            agency_code="XYZ",  # Use a different code that won't have an Agency record
        )
        competition = CompetitionFactory.create(opportunity=opportunity)
        application = ApplicationFactory.create(competition=competition)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        agency_name_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}AgencyName")
        assert agency_name_elem is not None
        assert agency_name_elem.text == "XYZ"

    def test_generate_header_excludes_null_fields(self, enable_factory_create):
        """Test that null fields are excluded from the XML."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=None,
            opening_date=None,
            closing_date=None,
            opportunity_assistance_listing=None,
        )
        application = ApplicationFactory.create(
            competition=competition,
            application_name=None,
        )

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))

        # These should still be present
        opp_id_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpportunityID")
        assert opp_id_elem is not None

        opp_title_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpportunityTitle")
        assert opp_title_elem is not None

        # These should be excluded
        submission_title_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}SubmissionTitle")
        assert submission_title_elem is None

        comp_id_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}CompetitionID")
        assert comp_id_elem is None

        opening_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpeningDate")
        assert opening_date_elem is None

        closing_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}ClosingDate")
        assert closing_date_elem is None

        cfda_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}CFDANumber")
        assert cfda_elem is None

    def test_generate_header_without_assistance_listing(self, enable_factory_create):
        """Test header generation when competition has no assistance listing."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            opportunity_assistance_listing=None,
        )
        application = ApplicationFactory.create(competition=competition)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        cfda_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}CFDANumber")
        assert cfda_elem is None

    def test_generate_header_date_formatting(self, enable_factory_create):
        """Test that dates are formatted correctly in YYYY-MM-DD format."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            opening_date=date(2025, 1, 5),
            closing_date=date(2025, 12, 31),
        )
        application = ApplicationFactory.create(competition=competition)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))

        opening_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}OpeningDate")
        assert opening_date_elem.text == "2025-01-05"

        closing_date_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}ClosingDate")
        assert closing_date_elem.text == "2025-12-31"

    def test_hash_value_is_deterministic(self, application):
        """Test that hash value is deterministic for same input."""
        generator1 = SubmissionXMLGenerator(application)
        xml_string1 = generator1.generate_header_xml()

        generator2 = SubmissionXMLGenerator(application)
        xml_string2 = generator2.generate_header_xml()

        root1 = lxml_etree.fromstring(xml_string1.encode("utf-8"))
        root2 = lxml_etree.fromstring(xml_string2.encode("utf-8"))

        hash1 = root1.find(f"{{{HEADER_NAMESPACES['glob']}}}HashValue").text
        hash2 = root2.find(f"{{{HEADER_NAMESPACES['glob']}}}HashValue").text

        assert hash1 == hash2

    def test_hash_value_changes_with_different_application(self, enable_factory_create):
        """Test that hash value changes for different applications."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(opportunity=opportunity)

        application1 = ApplicationFactory.create(
            competition=competition,
            application_name="First Application",
        )
        generator1 = SubmissionXMLGenerator(application1)
        xml_string1 = generator1.generate_header_xml()

        # Create a different application with different name
        application2 = ApplicationFactory.create(
            competition=competition,
            application_name="Different Application",
        )
        generator2 = SubmissionXMLGenerator(application2)
        xml_string2 = generator2.generate_header_xml()

        root1 = lxml_etree.fromstring(xml_string1.encode("utf-8"))
        root2 = lxml_etree.fromstring(xml_string2.encode("utf-8"))

        hash1 = root1.find(f"{{{HEADER_NAMESPACES['glob']}}}HashValue").text
        hash2 = root2.find(f"{{{HEADER_NAMESPACES['glob']}}}HashValue").text

        assert hash1 != hash2

    def test_generate_header_not_pretty_print(self, application):
        """Test header generation without pretty printing."""
        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml(pretty_print=False)

        # Should still be valid XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        assert root is not None

        # Should not contain multiple spaces or newlines (except in declaration)
        lines = xml_string.split("\n")
        assert len(lines) <= 2  # Only XML declaration and content line

    def test_convenience_function(self, application):
        """Test the convenience function generate_application_header_xml."""
        xml_string = generate_application_header_xml(application)

        # Should produce valid XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        assert root.tag == f"{{{HEADER_NAMESPACES['header']}}}GrantSubmissionHeader"

    def test_xml_has_declaration(self, application):
        """Test that generated XML includes XML declaration."""
        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        assert xml_string.startswith("<?xml version=")
        # Accept either single or double quotes in encoding declaration
        first_line = xml_string.split("\n")[0]
        assert "encoding='utf-8'" in first_line or 'encoding="utf-8"' in first_line

    def test_namespace_prefixes_in_output(self, application):
        """Test that namespace prefixes are correctly used in XML output."""
        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        # Check that namespace declarations are present
        assert 'xmlns:header="http://apply.grants.gov/system/Header-V1.0"' in xml_string
        assert 'xmlns:glob="http://apply.grants.gov/system/Global-V1.0"' in xml_string

        # Check that header elements use the header: prefix
        assert "<header:AgencyName>" in xml_string
        assert "<header:OpportunityID>" in xml_string

        # Check that glob elements use the glob: prefix
        assert "<glob:HashValue" in xml_string
        assert 'glob:hashAlgorithm="SHA-1"' in xml_string

    def test_both_agency_name_and_code_null(self, enable_factory_create):
        """Test when both agency name and code are None."""
        opportunity = OpportunityFactory.create(
            agency_code=None,
        )
        competition = CompetitionFactory.create(opportunity=opportunity)
        application = ApplicationFactory.create(competition=competition)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_header_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        agency_name_elem = root.find(f"{{{HEADER_NAMESPACES['header']}}}AgencyName")
        assert agency_name_elem is None
