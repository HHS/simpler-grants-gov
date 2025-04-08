import pytest

from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.search.backend.load_agencies_to_index import LoadAgenciesToIndex, LoadAgenciesToIndexConfig
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory


class TestLoadAgenciesToIndex(BaseTestClass):
    @pytest.fixture(autouse=True)
    def cleanup_agencies(self, db_session):
        cascade_delete_from_db_table(db_session, Agency)
        cascade_delete_from_db_table(db_session, Opportunity)

    @pytest.fixture(scope="class")
    def load_agencies_to_index(self, db_session, search_client, agency_index_alias):
        config = LoadAgenciesToIndexConfig(
            alias_name=agency_index_alias,
            index_prefix="test-load-agencies",
        )

        return LoadAgenciesToIndex(db_session, search_client, config)

    def test_load_agencies_to_index(
        self,
        db_session,
        search_client,
        load_agencies_to_index,
        agency_index_alias,
        enable_factory_create,
    ):
        import pdb

        pdb.set_trace()
        # resp = search_client.search(agency_index_alias, {"size": 50})
        agencies = db_session.query(Agency).all()
        # Create Agencies to load into the search index
        agencies = [AgencyFactory.create(agency_code="DOD")]
        agencies.extend(AgencyFactory.create_batch(size=5, top_level_agency=agencies[0]))

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == len(agencies)
        assert load_agencies_to_index.metrics[load_agencies_to_index.Metrics.RECORDS_LOADED] == len(
            agencies
        )

        # Add more agencies to load and rerun
        agencies.extend(AgencyFactory.create_batch(size=5))

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-new-sub-agency-data"
        )

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == len(agencies)
        assert load_agencies_to_index.metrics[load_agencies_to_index.Metrics.RECORDS_LOADED] == len(
            agencies
        )

    def test_load_agencies_is_active(
        self,
        db_session,
        search_client,
        load_agencies_to_index,
        agency_index_alias,
        enable_factory_create,
    ):
        # Setup data
        hhs = AgencyFactory.create(agency_name="HHS")
        usda = AgencyFactory.create(agency_name="USDA")

        OpportunityFactory.create(agency_code=hhs.agency_code)  # POSTED
        OpportunityFactory.create(agency_code=usda.agency_code, is_closed_summary=True)  # CLOSED

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-active-status-data"
        )

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == 2

        hhs_agency = next(agency for agency in resp.records if agency["agency_name"] == "HHS")
        usda_agency = next(agency for agency in resp.records if agency["agency_name"] == "USDA")

        assert hhs_agency["is_active_agency"]
        assert not usda_agency["is_active_agency"]
