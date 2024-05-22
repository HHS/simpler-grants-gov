import pytest

from src.search.backend.load_opportunities_to_index import (
    LoadOpportunitiesToIndex,
    LoadOpportunitiesToIndexConfig,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory


class TestLoadOpportunitiesToIndex(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_to_index(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias, index_prefix="test-load-opps"
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

        total_records = resp["hits"]["total"]["value"]
        assert total_records == len(opportunities)

        records = [record["_source"] for record in resp["hits"]["hits"]]
        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in records]
        )

        # Rerunning without changing anything about the data in the DB doesn't meaningfully change anything
        load_opportunities_to_index.index_name = load_opportunities_to_index.index_name + "-another"
        load_opportunities_to_index.run()
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        total_records = resp["hits"]["total"]["value"]
        assert total_records == len(opportunities)

        records = [record["_source"] for record in resp["hits"]["hits"]]
        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in records]
        )

        # Rerunning but first add a few more opportunities to show up
        opportunities.extend(OpportunityFactory.create_batch(size=3))
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-new-data"
        )
        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})

        total_records = resp["hits"]["total"]["value"]
        assert total_records == len(opportunities)

        records = [record["_source"] for record in resp["hits"]["hits"]]
        assert set([opp.opportunity_id for opp in opportunities]) == set(
            [record["opportunity_id"] for record in records]
        )
