import pytest

from src.db.models.opportunity_models import OpportunityVersion, OpportunitySummary, Opportunity
from src.task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from src.util import datetime_util
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory, OpportunityChangeAuditFactory, OpportunitySummaryFactory, \
    OpportunityAssistanceListingFactory


class TestStoreOpportunityVersionTask(BaseTestClass):
    @pytest.fixture
    def store_opportunity_version_task(self, db_session):
        return StoreOpportunityVersionTask(db_session)

    def test_store_opportunity_version_task(self, db_session, enable_factory_create, store_opportunity_version_task):
        db_session.query(OpportunityVersion).delete()
        db_session.query(Opportunity).delete()
        db_session.query(Opportunity).delete()
        db_session.commit()

        # create opportunities
        opportunities = OpportunityFactory.create_batch(5)

        OpportunityChangeAuditFactory.create(
            opportunity=opportunities[0]
        )

        store_opportunity_version_task.run()

        # Verify only updated opportunity (new) entered into OpportunityVersion table
        saved_opp_version = db_session.query(OpportunityVersion).all()

        assert len(saved_opp_version) == 1
        assert saved_opp_version[0].opportunity_id == opportunities[0].opportunity_id

        # Verify only opportunities updated after latest job were entered into OpportunityVersion table
        OpportunityAssistanceListingFactory.create(
            opportunity=opportunities[1],

        )

        OpportunityChangeAuditFactory.create(
            opportunity=opportunities[1]
        )
        store_opportunity_version_task.run()

        saved_opp_version = db_session.query(OpportunityVersion).all()
        assert len(saved_opp_version) == 2
        assert saved_opp_version[1].opportunity_id == opportunities[1].opportunity_id










