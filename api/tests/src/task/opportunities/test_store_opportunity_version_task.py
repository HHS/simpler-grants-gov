import pytest
from grants_shared.util import datetime_util

from src.constants.lookup_constants import OpportunityVersionChangeType
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.task.opportunities.store_opportunity_version_task import (
    StoreOpportunityVersionConfig,
    StoreOpportunityVersionTask,
)
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import OpportunityChangeAuditFactory, OpportunityVersionFactory


class TestStoreOpportunityVersionTask(BaseTestClass):
    @pytest.fixture
    def store_opportunity_version_task(self, db_session):
        return StoreOpportunityVersionTask(db_session)

    @pytest.fixture(autouse=True)
    def clear_db(self, db_session):
        cascade_delete_from_db_table(db_session, Opportunity)

    def test_with_prior_job_log_no_updated_opportunity(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        OpportunityChangeAuditFactory.create(is_loaded_to_version_table=True)
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
        assert {opp_vers[0].opportunity_id, opp_vers[1].opportunity_id} == {
            oca_1.opportunity_id,
            oca_2.opportunity_id,
        }

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
        assert [opp_vers[0].opportunity_id, opp_vers[1].opportunity_id] == [
            opp_ver_existing.opportunity_id,
            opp_ver_existing.opportunity_id,
        ]

        # run with a second update
        oca.opportunity.current_opportunity_summary = None
        oca.updated_at = datetime_util.utcnow()
        oca.is_loaded_to_version_table = False
        db_session.commit()

        store_opportunity_version_task.has_unprocessed_records = True
        store_opportunity_version_task.run()

        opp_vers = db_session.query(OpportunityVersion).all()
        assert len(opp_vers) == 3
        assert (
            store_opportunity_version_task.metrics[
                store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED
            ]
            == 1
        )
        assert set([o.opportunity_id for o in opp_vers]) == {opp_ver_existing.opportunity_id}

    def test_batch_size(self, db_session, enable_factory_create, store_opportunity_version_task):
        config = StoreOpportunityVersionConfig(store_opportunity_version_batch_size=2)
        store_opportunity_version_task.config = config

        # Create several change audit records that will be picked up and processed 2 at a time
        OpportunityChangeAuditFactory.create_batch(size=5)

        store_opportunity_version_task.run()
        # Verifying the batches split the data up properly
        # and nothing got reprocessed
        metrics = store_opportunity_version_task.metrics
        assert metrics[store_opportunity_version_task.Metrics.OPPORTUNITIES_VERSIONED] == 5
        assert metrics[store_opportunity_version_task.Metrics.BATCHES_PROCESSED] == 3

    def test_first_version_is_create_type(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        """Test that first version after publish is CREATE type"""
        # Create opportunity change audit with no existing versions
        oca = OpportunityChangeAuditFactory.create()

        store_opportunity_version_task.run()

        opp_vers = (
            db_session.query(OpportunityVersion)
            .where(OpportunityVersion.opportunity_id == oca.opportunity_id)
            .all()
        )
        assert len(opp_vers) == 1
        assert opp_vers[0].change_type == OpportunityVersionChangeType.CREATE

    def test_subsequent_versions_are_update_type(
        self, db_session, enable_factory_create, store_opportunity_version_task
    ):
        """Test that subsequent versions after first are UPDATE type"""
        # Create opportunity with existing version (CREATE)
        oca = OpportunityChangeAuditFactory.create()
        OpportunityVersionFactory.create(
            opportunity=oca.opportunity, change_type=OpportunityVersionChangeType.CREATE
        )

        # Update the opportunity to trigger new version
        oca.opportunity.opportunity_title = "Updated Title"
        oca.is_loaded_to_version_table = False
        db_session.commit()

        store_opportunity_version_task.run()

        opp_vers = (
            db_session.query(OpportunityVersion)
            .where(OpportunityVersion.opportunity_id == oca.opportunity_id)
            .order_by(OpportunityVersion.created_at)
            .all()
        )
        assert len(opp_vers) == 2
        assert opp_vers[0].change_type == OpportunityVersionChangeType.CREATE
        assert opp_vers[1].change_type == OpportunityVersionChangeType.UPDATE
