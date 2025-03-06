from datetime import timedelta, datetime

import freezegun

from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema

import pytest
from sqlalchemy import update, delete

from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import Opportunity, OpportunityChangeAudit, OpportunityVersion, \
    OpportunityAssistanceListing
from src.task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from src.util.datetime_util import get_now_us_eastern_datetime
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    OpportunityAssistanceListingFactory,
    OpportunityChangeAuditFactory,
    OpportunityFactory, JobLogFactory, OpportunityVersionFactory,
)

def validate_opportunity_version(db_session, expected_opportunity):
    db_session.commit()
    db_session.flush()

    SCHEMA = OpportunityV1Schema()
    opportunity = SCHEMA.dump(expected_opportunity)

    saved_opp_version = db_session.query(OpportunityVersion).filter(OpportunityVersion.opportunity_id == expected_opportunity.opportunity_id).all()

    assert len(saved_opp_version) == 1
    # assert saved_opp_version[0].opportunity_id == expected_opportunity.opportunity_id


# @freezegun.freeze_time(CURRENT_TIME_STR)
class TestStoreOpportunityVersionTask(BaseTestClass):
    @pytest.fixture
    def store_opportunity_version_task(self, db_session):
        return StoreOpportunityVersionTask(db_session)


    def test_with_no_prior_job_log(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        oca = OpportunityChangeAuditFactory.create()
        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()

        # assert a record in the OpportunityVersion is created
        assert len(opp_vers) == 1
        assert opp_vers[0].opportunity_id == oca.opportunity_id


    def test_with_prior_job_log_no_prior_opportunity(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):

        # create a prior job log
        JobLogFactory.create(
            job_type="StoreOpportunityVersionTask",
            job_status=JobStatus.COMPLETED,
            created_at=CURRENT_TIME
        )

        # SCENARIO 1: with no prior opportunity
        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 0

    def test_with_existing_opportunity_no_saved_version(self, db_session, enable_factory_create, store_opportunity_version_task):

        oca_1 = OpportunityChangeAuditFactory.create()
        oca_2 = OpportunityChangeAuditFactory.create()

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2

    def test_with_saved_version(self, db_session, enable_factory_create,store_opportunity_version_task):

        opp = OpportunityFactory.create()
        oca = OpportunityChangeAuditFactory.create(opportunity=opp)
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=opp)

        store_opportunity_version_task.run()
        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2

    def test_with_saved_version_with_diff(self, db_session, enable_factory_create,store_opportunity_version_task):

        opp = OpportunityFactory.create()
        oca = OpportunityChangeAuditFactory.create(opportunity=opp)
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=opp)

        opp.o_current_summary=True
        opp.opportunity_assistance_listings=[]
        db_session.commit()

        store_opportunity_version_task.run()
        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2













