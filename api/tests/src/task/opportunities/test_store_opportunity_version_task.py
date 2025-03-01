from datetime import timedelta

import pytest
from sqlalchemy import update

from src.db.models.opportunity_models import OpportunityVersion, OpportunitySummary, Opportunity, OpportunityChangeAudit
from src.task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from src.util import datetime_util
from src.util.datetime_util import get_now_us_eastern_datetime
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
        opportunities = OpportunityFactory.create_batch(3)

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
        OpportunityAssistanceListingFactory.create(
            opportunity=opportunities[2],

        )

        OpportunityChangeAuditFactory.create(
            opportunity=opportunities[1]
        )
        # Updated before the last job run
        OpportunityChangeAuditFactory.create(
            opportunity=opportunities[2],
            updated_at=get_now_us_eastern_datetime() - timedelta(hours=1),
        )

        store_opportunity_version_task.run()

        saved_opp_version = db_session.query(OpportunityVersion).all()
        assert len(saved_opp_version) == 2
        assert saved_opp_version[1].opportunity_id == opportunities[1].opportunity_id


        # Verify previously versioned opportunity that was updated is entered into OpportunityVersion table
        OpportunityAssistanceListingFactory.create(
            opportunity=opportunities[0],

        )
        db_session.execute(
            update(OpportunityChangeAudit)
            .where(OpportunityChangeAudit.opportunity_id == opportunities[0].opportunity_id)
            .values(updated_at=get_now_us_eastern_datetime())
        )

        store_opportunity_version_task.run()
        saved_opp_version = db_session.query(OpportunityVersion).all()

        assert len(saved_opp_version) == 3
        assert len([opp for opp in saved_opp_version if opp.opportunity_id == opportunities[0].opportunity_id] ) == 2 # updated twice
        assert saved_opp_version[2].opportunity_id == opportunities[0].opportunity_id

















