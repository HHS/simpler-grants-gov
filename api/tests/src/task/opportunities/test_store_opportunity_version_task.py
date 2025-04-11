import pytest

from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.db.models.task_models import JobLog
from src.task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    JobLogFactory,
    OpportunityChangeAuditFactory,
    OpportunityVersionFactory,
)


class TestStoreOpportunityVersionTask(BaseTestClass):
    @pytest.fixture
    def store_opportunity_version_task(self, db_session):
        return StoreOpportunityVersionTask(db_session)

    @pytest.fixture(autouse=True)
    def clear_db(self, db_session):
        cascade_delete_from_db_table(db_session, Opportunity)
        cascade_delete_from_db_table(db_session, JobLog)

    def test_with_no_prior_job_log(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        oca = OpportunityChangeAuditFactory.create()
        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()

        # assert a record in the OpportunityVersion is created
        assert len(opp_vers) == 1
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 1
        )
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
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 0
        )

    def test_with_existing_opportunity_no_saved_version(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):

        oca_1 = OpportunityChangeAuditFactory.create()
        oca_2 = OpportunityChangeAuditFactory.create()

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 2
        )
        assert opp_vers[0].opportunity_id == oca_1.opportunity_id
        assert opp_vers[1].opportunity_id == oca_2.opportunity_id

    def test_with_existing_opportunity_saved_version_no_diff(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        oca = OpportunityChangeAuditFactory.create()
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=oca.opportunity)

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 1
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 0
        )
        assert opp_vers[0].opportunity_id == opp_ver_existing.opportunity_id

    def test_with_existing_opportunity_saved_version_with_diff(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        oca = OpportunityChangeAuditFactory.create()
        opp_ver_existing = OpportunityVersionFactory.create(opportunity=oca.opportunity)
        # update existing opportunity
        oca.opportunity.revision_number = 5
        oca.opportunity.opportunity_assistance_listings = []
        db_session.commit()

        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 2
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 1
        )
        assert opp_vers[0].opportunity_id == opp_ver_existing.opportunity_id
        assert opp_vers[1].opportunity_id == opp_ver_existing.opportunity_id
