from src.db.models.opportunity_models import OpportunityVersion
from src.services.opportunities_v1.opportuntity_version import save_opportunity_version
from tests.src.db.models.factories import OpportunityFactory


def test_save_opportunity_version(db_session, enable_factory_create):
    # Create an opportunity
    opportunity = OpportunityFactory.create()

    # Save opportunity into opportunity_version table
    save_opportunity_version(db_session, opportunity)

    # Verify Record created
    saved_opp_version = db_session.query(OpportunityVersion).all()

    assert len(saved_opp_version) == 1
    assert saved_opp_version[0].opportunity_id == opportunity.opportunity_id
    assert saved_opp_version[0].opportunity_data == opportunity.for_json()
