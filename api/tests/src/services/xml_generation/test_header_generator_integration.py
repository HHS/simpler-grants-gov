"""Integration test for header XML generation with example output."""

from datetime import date

import src.adapters.db as db
from src.services.xml_generation.header_generator import generate_application_header_xml
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


def test_header_generation_example_output(enable_factory_create, db_session: db.Session):
    agency = AgencyFactory.create(agency_name="Simpler Grants.gov", agency_code="SIMP")

    opportunity = OpportunityFactory.create(
        opportunity_number="SIMP-TESTING-092225",
        opportunity_title="Testing Forms",
        agency_code=agency.agency_code,
    )

    assistance_listing = OpportunityAssistanceListingFactory.create(
        opportunity=opportunity, assistance_listing_number="12.345"
    )

    competition = CompetitionFactory.create(
        opportunity=opportunity,
        public_competition_id="SIMP-TESTING-090225-COMPID",
        opening_date=date(2025, 9, 2),
        closing_date=date(2025, 9, 30),
        opportunity_assistance_listing=assistance_listing,
    )

    application = ApplicationFactory.create(competition=competition, application_name="Test App")

    # Generate the header XML
    header_xml = generate_application_header_xml(application)

    # Verify key elements are present
    assert "SIMP-TESTING-092225" in header_xml
    assert "Testing Forms" in header_xml
    assert "Simpler Grants.gov" in header_xml
    assert "SIMP-TESTING-090225-COMPID" in header_xml
    assert "2025-09-02" in header_xml
    assert "2025-09-30" in header_xml
    assert "Test App" in header_xml
    assert "12.345" in header_xml

    # Verify XML structure elements
    assert "GrantSubmissionHeader" in header_xml
    assert 'glob:schemaVersion="1.0"' in header_xml
    assert "glob:HashValue" in header_xml
    assert 'glob:hashAlgorithm="SHA-1"' in header_xml
    assert "header:AgencyName" in header_xml
    assert "header:OpportunityID" in header_xml
    assert "header:OpportunityTitle" in header_xml
    assert "header:CompetitionID" in header_xml
    assert "header:OpeningDate" in header_xml
    assert "header:ClosingDate" in header_xml
    assert "header:SubmissionTitle" in header_xml
    assert "header:CFDANumber" in header_xml
