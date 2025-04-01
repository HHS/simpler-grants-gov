import pytest

from src.db.models.agency_models import Agency
from src.search.backend.load_agencies_to_index import LoadAgenciesToIndex, LoadAgenciesToIndexConfig
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import AgencyFactory


class TestLoadAgenciesToIndex(BaseTestClass):
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
        # Delete any agencies in db
        cascade_delete_from_db_table(db_session, Agency)

        # Create Agencies to load into the search index
        agencies = [AgencyFactory.create(agency_code="DOD")]
        agencies.extend(AgencyFactory.create_batch(size=5, top_level_agency=agencies[0]))

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == len(agencies)

        # Add more agencies to load and rerun
        agencies.extend(AgencyFactory.create_batch(size=5))

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-new-sub-agency-data"
        )

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == len(agencies)
