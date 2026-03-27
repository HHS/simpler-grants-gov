import pytest

from src.constants.lookup_constants import OpportunityCategory
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityAssistanceListingFactory,
    OpportunityAttachmentFactory,
    OpportunityFactory,
)


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, Agency)
    cascade_delete_from_db_table(db_session, Opportunity)


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

    opp_al = OpportunityAssistanceListingFactory.create(opportunity=opp)

    expected = {
        "agency": agency.agency_code,
        "summary": None,
        "category": OpportunityCategory.MANDATORY,
        "created_at": opp.created_at.isoformat(),
        "updated_at": opp.updated_at.isoformat(),
        "agency_code": opp.agency_code,
        "agency_name": agency.agency_name,
        "opportunity_id": str(opp.opportunity_id),
        "legacy_opportunity_id": opp.legacy_opportunity_id,
        "opportunity_title": opp.opportunity_title,
        "opportunity_number": opp.opportunity_number,
        "opportunity_status": None,
        "category_explanation": opp.category_explanation,
        "top_level_agency_name": agency_top.agency_name,
        "opportunity_assistance_listings": [
            {
                "program_title": opp_al.program_title,
                "assistance_listing_number": opp_al.assistance_listing_number,
            }
        ],
        "opportunity_attachments": [],
        "top_level_agency_code": agency_top.agency_code,
    }

    # Save opportunity into opportunity_version table
    save_opportunity_version(db_session, opp)

    # Verify Record created
    saved_opp_version = db_session.query(OpportunityVersion).all()

    assert len(saved_opp_version) == 1
    assert saved_opp_version[0].opportunity_id == opp.opportunity_id
    assert saved_opp_version[0].opportunity_data == expected


def test_save_opportunity_version_with_attachments(db_session, enable_factory_create):
    # Setup Opportunity
    attachment_1 = OpportunityAttachmentFactory.create()
    opp = attachment_1.opportunity
    attachment_2 = OpportunityAttachmentFactory.create(opportunity=opp)

    expected = [
        {"attachment_id": str(attachment_1.attachment_id)},
        {"attachment_id": str(attachment_2.attachment_id)},
    ]

    # Save opportunity into opportunity_version table
    save_opportunity_version(db_session, opp)

    # Verify Record created
    saved_opp_version = db_session.query(OpportunityVersion).all()

    assert len(saved_opp_version) == 1
    assert saved_opp_version[0].opportunity_id == opp.opportunity_id
    assert saved_opp_version[0].opportunity_data["opportunity_attachments"] == expected


def test_save_opportunity_version_draft(db_session, enable_factory_create):
    opp = OpportunityFactory.create(is_draft=True)
    save_opportunity_version(db_session, opp)

    # Verify record is not created
    saved_opp_version = db_session.query(OpportunityVersion).all()
    assert len(saved_opp_version) == 0


def test_save_opportunity_version_with_prior_versions(db_session, enable_factory_create):
    opp = OpportunityFactory.create()
    save_opportunity_version(db_session, opp)
    db_session.refresh(opp)
    assert len(opp.versions) == 1

    opp.opportunity_title = "A new opportunity title"
    save_opportunity_version(db_session, opp)
    db_session.refresh(opp)
    assert len(opp.versions) == 2

    opp.opportunity_title = "Yet another title"
    save_opportunity_version(db_session, opp)
    db_session.refresh(opp)
    assert len(opp.versions) == 3

    # Not changing anything won't add a new version
    opp.opportunity_title = "Yet another title"
    save_opportunity_version(db_session, opp)
    db_session.refresh(opp)
    assert len(opp.versions) == 3
