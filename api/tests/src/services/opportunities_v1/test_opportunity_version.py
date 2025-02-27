from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import OpportunityVersion
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


def test_save_opportunity_version(db_session, enable_factory_create):
    # Setup Opportunity
    agency_top = AgencyFactory.create()
    agency = AgencyFactory.create(top_level_agency=agency_top)

    opp = OpportunityFactory.create(
        opportunity_assistance_listings=[],
        agency_code=agency.agency_code,
        no_current_summary=True,
        category=OpportunityCategory.MANDATORY,
    )

    opp_ass = OpportunityAssistanceListingFactory.create(opportunity=opp)

    expected = {
        "agency": agency.agency_code,
        "summary": None,
        "category": OpportunityCategory.MANDATORY.lower(),
        "created_at": opp.created_at.isoformat(),
        "updated_at": opp.updated_at.isoformat(),
        "agency_code": opp.agency_code,
        "agency_name": agency.agency_name,
        "opportunity_id": opp.opportunity_id,
        "opportunity_title": opp.opportunity_title,
        "opportunity_number": opp.opportunity_number,
        "opportunity_status": None,
        "category_explanation": opp.category_explanation,
        "top_level_agency_name": agency_top.agency_name,
        "opportunity_assistance_listings": [
            {
                "program_title": opp_ass.program_title,
                "assistance_listing_number": opp_ass.assistance_listing_number,
            }
        ],
    }

    # Save opportunity into opportunity_version table
    save_opportunity_version(db_session, opp)

    # Verify Record created
    saved_opp_version = db_session.query(OpportunityVersion).all()

    assert len(saved_opp_version) == 1
    assert saved_opp_version[0].opportunity_id == opp.opportunity_id
    assert saved_opp_version[0].opportunity_data == expected
