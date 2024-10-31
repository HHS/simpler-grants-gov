from unittest.mock import Mock

import pytest

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySearchIndexQueue,
    OpportunitySummary,
)
from src.search.backend.load_opportunities_to_index import (
    LoadOpportunitiesToIndex,
    LoadOpportunitiesToIndexConfig,
)
from src.util.datetime_util import get_now_us_eastern_datetime
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory, OpportunitySearchIndexQueueFactory


@pytest.fixture
def mock_search_client():
    client = Mock()
    # Mock the alias exists check
    client.alias_exists.return_value = True
    # Mock empty initial index
    client.scroll.return_value = [Mock(records=[])]
    return client


@pytest.fixture
def test_opportunity():
    """Create a test opportunity with required relationships"""
    opportunity = Opportunity(
        opportunity_id=1, opportunity_title="Test Opportunity", is_draft=False
    )

    OpportunitySummary(
        opportunity_summary_id=1,
        opportunity_id=1,
        is_forecast=False,
        summary_description="Test Description",
    )

    CurrentOpportunitySummary(
        opportunity_id=1, opportunity_summary_id=1, opportunity_status=OpportunityStatus.POSTED
    )

    return opportunity


class TestLoadOpportunitiesToIndexFullRefresh(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_to_index(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias, index_prefix="test-load-opps"
        )
        return LoadOpportunitiesToIndex(db_session, search_client, True, config)

    def test_load_opportunities_to_index(
        self,
        truncate_opportunities,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):
        # Create 25 opportunities we will load into the search index
        opportunities = []
        opportunities.extend(OpportunityFactory.create_batch(size=6, is_posted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=3, is_forecasted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=2, is_closed_summary=True))
        opportunities.extend(
            OpportunityFactory.create_batch(size=8, is_archived_non_forecast_summary=True)
        )
        opportunities.extend(
            OpportunityFactory.create_batch(size=6, is_archived_forecast_summary=True)
        )

        # Create some opportunities that won't get fetched / loaded into search
        OpportunityFactory.create_batch(size=3, is_draft=True)
        OpportunityFactory.create_batch(size=4, no_current_summary=True)

        for opportunity in opportunities:
            OpportunitySearchIndexQueueFactory.create(opportunity=opportunity, has_update=True)

        load_opportunities_to_index.run()
        # Verify some metrics first
        assert (
            len(opportunities)
            == load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.RECORDS_LOADED
            ]
        )

        # Just do some rough validation that the data is present
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        # Rerunning without changing anything about the data in the DB doesn't meaningfully change anything
        load_opportunities_to_index.index_name = load_opportunities_to_index.index_name + "-another"
        load_opportunities_to_index.run()
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        # Rerunning but first add a few more opportunities to show up
        opportunities.extend(OpportunityFactory.create_batch(size=3))
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-new-data"
        )
        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )


class TestLoadOpportunitiesToIndexPartialRefresh(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_to_index(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias, index_prefix="test-load-opps"
        )
        return LoadOpportunitiesToIndex(db_session, search_client, False, config)

    def test_load_opportunities_to_index(
        self,
        truncate_opportunities,
        enable_factory_create,
        db_session,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):
        index_name = "partial-refresh-index-" + get_now_us_eastern_datetime().strftime(
            "%Y-%m-%d_%H-%M-%S"
        )
        search_client.create_index(index_name)
        search_client.swap_alias_index(
            index_name, load_opportunities_to_index.config.alias_name, delete_prior_indexes=True
        )

        # Load a bunch of records into the DB
        opportunities = []
        opportunities.extend(OpportunityFactory.create_batch(size=6, is_posted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=3, is_forecasted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=2, is_closed_summary=True))
        opportunities.extend(
            OpportunityFactory.create_batch(size=8, is_archived_non_forecast_summary=True)
        )
        opportunities.extend(
            OpportunityFactory.create_batch(size=6, is_archived_forecast_summary=True)
        )

        for opportunity in opportunities:
            OpportunitySearchIndexQueueFactory.create(opportunity=opportunity, has_update=True)

        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})
        assert resp.total_records == len(opportunities)

        # Add a few more opportunities that will be created
        opportunities.extend(OpportunityFactory.create_batch(size=3, is_posted_summary=True))

        # Delete some opportunities
        opportunities_to_delete = [opportunities.pop(), opportunities.pop(), opportunities.pop()]
        for opportunity in opportunities_to_delete:
            db_session.delete(opportunity)

        for opportunity in opportunities:
            OpportunitySearchIndexQueueFactory.create(opportunity=opportunity, has_update=True)

        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})
        assert resp.total_records == len(opportunities)

    def test_load_opportunities_to_index_index_does_not_exist(self, db_session, search_client):
        config = LoadOpportunitiesToIndexConfig(
            alias_name="fake-index-that-will-not-exist", index_prefix="test-load-opps"
        )
        load_opportunities_to_index = LoadOpportunitiesToIndex(
            db_session, search_client, False, config
        )

        with pytest.raises(RuntimeError, match="please run the full refresh job"):
            load_opportunities_to_index.run()

    def test_new_opportunity_gets_indexed(
        self, db_session, test_opportunity, load_opportunities_to_index
    ):
        """Test that a new opportunity in the queue gets indexed"""
        # Add to queue
        OpportunitySearchIndexQueueFactory.create(opportunity=test_opportunity)

        load_opportunities_to_index.run()

        # Verify queue was cleared
        remaining_queue = db_session.query(OpportunitySearchIndexQueue).all()
        assert len(remaining_queue) == 0

    def test_draft_opportunity_not_indexed(
        self, db_session, load_opportunities_to_index, test_opportunity
    ):
        """Test that draft opportunities are not indexed"""
        # Make opportunity a draft
        test_opportunity.is_draft = True

        db_session.add(test_opportunity)
        db_session.commit()

        # Add to queue
        queue_entry = OpportunitySearchIndexQueue(
            opportunity_id=test_opportunity.opportunity_id, has_update=True
        )
        db_session.add(queue_entry)

        load_opportunities_to_index.run()

        # Verify queue was not cleared
        remaining_queue = db_session.query(OpportunitySearchIndexQueue).all()
        assert len(remaining_queue) == 1
