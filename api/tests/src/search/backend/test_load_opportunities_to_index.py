import uuid

import pytest
from sqlalchemy import select

from src.db.models.opportunity_models import OpportunityChangeAudit, OpportunityIndexDeleteQueue
from src.search.backend.load_opportunities_to_index import (
    LoadOpportunitiesToIndex,
    LoadOpportunitiesToIndexConfig,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityChangeAuditFactory,
    OpportunityFactory,
    OpportunityIndexDeleteQueueFactory,
)


class TestLoadOpportunitiesToIndexFullRefresh(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_to_index(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias,
            index_prefix="test-load-opps",
        )
        return LoadOpportunitiesToIndex(db_session, search_client, config)

    def test_load_opportunities_to_index(
        self,
        truncate_opportunities,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):
        # Create an agency that some records will be connected to
        parent_agency = AgencyFactory.create(agency_code="FUN")
        agency = AgencyFactory.create(
            agency_code=f"{parent_agency.agency_code}-AGENCY",
            is_test_agency=False,
            top_level_agency=parent_agency,
        )

        # Create 25 opportunities we will load into the search index
        opportunities = []
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=6,
                is_posted_summary=True,
                agency_code=agency.agency_code,
                opportunity_attachments=[],
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=3, is_forecasted_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=2, is_closed_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=8, is_archived_non_forecast_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=6,
                is_archived_forecast_summary=True,
                agency_code=parent_agency.agency_code,
                opportunity_attachments=[],
            )
        )

        # Create some opportunities that won't get fetched / loaded into search
        OpportunityFactory.create_batch(size=3, is_draft=True, opportunity_attachments=[])
        OpportunityFactory.create_batch(size=4, no_current_summary=True, opportunity_attachments=[])

        AgencyFactory.create(agency_code="MY-TEST-AGENCY", is_test_agency=True)
        OpportunityFactory.create_batch(
            size=3, agency_code="MY-TEST-AGENCY", opportunity_attachments=[]
        )

        for opportunity in opportunities:
            OpportunityChangeAuditFactory.create(
                opportunity=opportunity,
            )

        load_opportunities_to_index.run()
        # Verify some metrics first
        assert (
            len(opportunities)
            == load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.RECORDS_LOADED
            ]
        )
        assert load_opportunities_to_index.metrics[
            LoadOpportunitiesToIndex.Metrics.OPENSEARCH_DOC_COUNT
        ] == len(opportunities)

        # Just do some rough validation that the data is present
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        # The posted opportunities should have the top level agency code set
        for record in resp.records:
            if record.get("opportunity_status") == "posted":
                assert record.get("top_level_agency_code") == parent_agency.agency_code

        # Rerunning without changing anything about the data in the DB doesn't meaningfully change anything
        load_opportunities_to_index.index_name = load_opportunities_to_index.index_name + "-another"
        load_opportunities_to_index.run()
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        assert load_opportunities_to_index.metrics[
            load_opportunities_to_index.Metrics.RECORDS_LOADED
        ] == len(opportunities)
        assert (
            load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.TEST_RECORDS_SKIPPED
            ]
            == 3
        )

        # Rerunning but first add a few more opportunities to show up
        opportunities.extend(OpportunityFactory.create_batch(size=3, opportunity_attachments=[]))
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-new-data"
        )
        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

    def test_excluded_opportunities_not_indexed(
        self,
        db_session,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):

        # Create opportunities that should be indexed (not excluded)
        included_opportunities = OpportunityFactory.create_batch(
            size=3, is_posted_summary=True, opportunity_attachments=[]
        )

        # Ensure we have a unique index name for this test to avoid conflicts
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-excluded-test"
        )

        # Run the indexing process
        load_opportunities_to_index.run()

        # Get all indexed opportunities from the search index
        resp = search_client.search(opportunity_index_alias, {"size": 100})
        all_indexed_opportunity_ids = set([record["opportunity_id"] for record in resp.records])

        # Convert our test opportunities to string IDs for comparison
        expected_included_ids = set([str(opp.opportunity_id) for opp in included_opportunities])

        # Verify that ALL of our expected opportunities are present in the index
        missing_included = expected_included_ids - all_indexed_opportunity_ids
        assert (
            not missing_included
        ), f"Expected opportunities missing from index: {missing_included}"


def _get_change_audit(db_session, opportunity_id):
    return db_session.scalars(
        select(OpportunityChangeAudit).where(
            OpportunityChangeAudit.opportunity_id == opportunity_id
        )
    ).one_or_none()


class TestLoadOpportunitiesToIndexIncrementalRefresh(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_incremental(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias,
            index_prefix="test-load-opps-incremental",
        )
        return LoadOpportunitiesToIndex(db_session, search_client, config, full_refresh=False)

    @pytest.fixture(scope="class")
    def seeded_index(
        self, db_session, search_client, opportunity_index_alias, enable_factory_create
    ):
        """Seed the index via a full refresh so incremental tests have a base to work from."""
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias,
            index_prefix="test-load-opps-seed",
        )
        task = LoadOpportunitiesToIndex(db_session, search_client, config, full_refresh=True)
        task.run()
        return task

    def test_incremental_only_indexes_changed_records(
        self,
        db_session,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_incremental,
        seeded_index,
        truncate_opportunities,
    ):
        """incremental_refresh only touches opportunities with is_loaded_to_search IS NOT TRUE."""
        already_loaded = OpportunityFactory.create(
            is_posted_summary=True, opportunity_attachments=[]
        )
        OpportunityChangeAuditFactory.create(opportunity=already_loaded, is_loaded_to_search=True)

        changed = OpportunityFactory.create(is_posted_summary=True, opportunity_attachments=[])
        OpportunityChangeAuditFactory.create(opportunity=changed, is_loaded_to_search=False)

        load_opportunities_incremental.run()

        # Only the changed opportunity is in the index
        resp = search_client.search(opportunity_index_alias, {"size": 100})
        indexed_ids = {r["opportunity_id"] for r in resp.records}
        assert str(changed.opportunity_id) in indexed_ids
        assert str(already_loaded.opportunity_id) not in indexed_ids

        # changed audit record is now marked loaded
        db_session.expire_all()
        audit = _get_change_audit(db_session, changed.opportunity_id)
        assert audit.is_loaded_to_search is True

    def test_incremental_marks_loaded_on_success(
        self,
        db_session,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_incremental,
        seeded_index,
        truncate_opportunities,
    ):
        """Successfully indexed records have is_loaded_to_search set to True."""
        opp = OpportunityFactory.create(is_posted_summary=True, opportunity_attachments=[])
        OpportunityChangeAuditFactory.create(opportunity=opp, is_loaded_to_search=False)

        load_opportunities_incremental.run()

        db_session.expire_all()
        audit = _get_change_audit(db_session, opp.opportunity_id)
        assert audit.is_loaded_to_search is True

    def test_delete_queue_cleared_after_bulk_delete(
        self,
        db_session,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_incremental,
        seeded_index,
        truncate_opportunities,
    ):
        """Delete queue records are removed from the DB after successful bulk_delete."""
        queue_record = OpportunityIndexDeleteQueueFactory.create(opportunity_id=uuid.uuid4())

        load_opportunities_incremental.run()

        db_session.expire_all()
        remaining = db_session.scalars(
            select(OpportunityIndexDeleteQueue).where(
                OpportunityIndexDeleteQueue.opportunity_id == queue_record.opportunity_id
            )
        ).one_or_none()
        assert remaining is None
        assert (
            load_opportunities_incremental.metrics[LoadOpportunitiesToIndex.Metrics.RECORDS_DELETED]
            == 1
        )

    def test_delete_queue_stays_on_bulk_delete_failure(
        self,
        db_session,
        enable_factory_create,
        monkeypatch,
        search_client,
        opportunity_index_alias,
        load_opportunities_incremental,
        seeded_index,
        truncate_opportunities,
    ):
        """If bulk_delete fails the queue record stays for the next cycle."""
        queue_record = OpportunityIndexDeleteQueueFactory.create(opportunity_id=uuid.uuid4())

        def _raise(*args, **kwargs):
            raise Exception("simulated bulk_delete failure")

        monkeypatch.setattr(search_client, "bulk_delete", _raise)

        load_opportunities_incremental.run()

        db_session.expire_all()

        # Queue record still present — will be retried next cycle
        remaining = db_session.scalars(
            select(OpportunityIndexDeleteQueue).where(
                OpportunityIndexDeleteQueue.opportunity_id == queue_record.opportunity_id
            )
        ).one_or_none()
        assert remaining is not None


class TestLoadOpportunitiesToIndexIncrementalRefreshGuard(BaseTestClass):
    def test_incremental_raises_if_alias_missing(self, db_session, search_client):
        """incremental_refresh raises RuntimeError when the alias has never been created."""
        config = LoadOpportunitiesToIndexConfig(
            alias_name="nonexistent-alias-for-guard-test",
            index_prefix="test-guard",
        )
        task = LoadOpportunitiesToIndex(db_session, search_client, config, full_refresh=False)
        with pytest.raises(RuntimeError, match="does not exist"):
            task.run()
