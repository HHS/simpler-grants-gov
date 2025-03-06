import pytest
from sqlalchemy import delete

from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import Opportunity, OpportunityChangeAudit, OpportunityVersion
from src.db.models.task_models import JobLog
from src.task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    JobLogFactory,
    OpportunityChangeAuditFactory,
    OpportunityFactory,
    OpportunityVersionFactory,
)


class TestStoreOpportunityVersionTask(BaseTestClass):
    @pytest.fixture
    def store_opportunity_version_task(self, db_session):
        return StoreOpportunityVersionTask(db_session)

    @pytest.fixture(autouse=True)
    def clear_db(self, db_session):
        opportunities = db_session.query(Opportunity).all()
        for opp in opportunities:
            db_session.delete(opp)

        db_session.execute(delete(OpportunityVersion))
        db_session.execute(delete(OpportunityChangeAudit))
        db_session.execute(delete(JobLog))

        db_session.commit()

    def test_with_no_prior_job_log(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        oca = OpportunityChangeAuditFactory.create()
        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()

        # assert a record in the OpportunityVersion is created
        assert len(opp_vers) == 1
        assert opp_vers[0].opportunity_id == oca.opportunity_id

    def test_with_prior_job_log_no_updated_opportunity(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        # create a prior job log
        JobLogFactory.create(
            job_type="StoreOpportunityVersionTask",
            job_status=JobStatus.COMPLETED,
        )

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 0

    def test_with_existing_opportunity_no_saved_version(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):

        oca_1 = OpportunityChangeAuditFactory.create()
        oca_2 = OpportunityChangeAuditFactory.create()

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2
        assert opp_vers[0].opportunity_id == oca_1.opportunity_id
        assert opp_vers[1].opportunity_id == oca_2.opportunity_id

    def test_with_existing_opportunity_saved_version_no_diff(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):

        opp = OpportunityFactory.create()
        OpportunityChangeAuditFactory.create(opportunity=opp)
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=opp)

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 1
        assert opp_vers[0].opportunity_id == opp_ver_existing.opportunity_id

    def test_with_existing_opportunity_saved_version_with_diff(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):

        opp = OpportunityFactory.create()
        OpportunityChangeAuditFactory.create(opportunity=opp)
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=opp)

        # update existing opportunity
        opp.is_draft = True
        opp.opportunity_assistance_listings = []
        db_session.commit()

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2
        assert opp_vers[0].opportunity_id == opp_ver_existing.opportunity_id
        assert opp_vers[1].opportunity_id == opp_ver_existing.opportunity_id
