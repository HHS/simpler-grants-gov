import pytest
from sqlalchemy import update

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import AgencyUser, LegacyCertificate
from src.search.backend.load_agencies_to_index import LoadAgenciesToIndex, LoadAgenciesToIndexConfig
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    AgencyFactory,
    ExcludedOpportunityReviewFactory,
    OpportunityFactory,
)


class TestLoadAgenciesToIndex(BaseTestClass):
    @pytest.fixture(autouse=True)
    def cleanup_agencies(self, db_session):
        db_session.execute(update(LegacyCertificate).values(agency_id=None))
        cascade_delete_from_db_table(db_session, AgencyUser)
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
        # Create Agencies to load into the search index
        agencies = [AgencyFactory.create(agency_code="LOADAGENCY1")]
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

    def test_load_agencies_with_status(
        self,
        db_session,
        search_client,
        load_agencies_to_index,
        agency_index_alias,
        enable_factory_create,
    ):
        # Setup data
        posted_agency = AgencyFactory.create(agency_name="POSTED_AGENCY")
        closed_agency = AgencyFactory.create(agency_name="CLOSED_AGENCY")
        forecasted_agency = AgencyFactory.create(agency_name="FORECASTED_AGENCY")
        archived_agency = AgencyFactory.create(agency_name="ARCHIVED_AGENCY")

        OpportunityFactory.create(agency_code=posted_agency.agency_code)  # POSTED
        OpportunityFactory.create(
            agency_code=closed_agency.agency_code, is_closed_summary=True
        )  # CLOSED
        OpportunityFactory.create(
            agency_code=forecasted_agency.agency_code, is_forecasted_summary=True
        )  # FORECASTED
        OpportunityFactory.create(
            agency_code=archived_agency.agency_code, is_archived_non_forecast_summary=True
        )  # ARCHIVED

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-active-status-data"
        )

        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == 4

        posted_agency_resp = next(
            agency for agency in resp.records if agency["agency_name"] == "POSTED_AGENCY"
        )
        closed_agency_resp = next(
            agency for agency in resp.records if agency["agency_name"] == "CLOSED_AGENCY"
        )
        forecasted_agency_resp = next(
            agency for agency in resp.records if agency["agency_name"] == "FORECASTED_AGENCY"
        )
        archived_agency_resp = next(
            agency for agency in resp.records if agency["agency_name"] == "ARCHIVED_AGENCY"
        )

        assert posted_agency_resp["opportunity_statuses"] == [OpportunityStatus.POSTED.value]
        assert closed_agency_resp["opportunity_statuses"] == [OpportunityStatus.CLOSED.value]
        assert forecasted_agency_resp["opportunity_statuses"] == [
            OpportunityStatus.FORECASTED.value
        ]
        assert archived_agency_resp["opportunity_statuses"] == [OpportunityStatus.ARCHIVED.value]

    def test_load_agencies_to_index_review_status(
        self,
        db_session,
        search_client,
        load_agencies_to_index,
        agency_index_alias,
        enable_factory_create,
    ):

        # Setup data
        posted_agency = AgencyFactory.create(agency_name="ABC")
        opp = OpportunityFactory.create(agency_code=posted_agency.agency_code)  # POSTED
        ExcludedOpportunityReviewFactory.create(legacy_opportunity_id=opp.legacy_opportunity_id)

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-review-status-data"
        )
        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == 1
        assert not resp.records[0]["opportunity_statuses"]

    def test_load_agencies_to_index_review_status_multi(
        self,
        db_session,
        search_client,
        load_agencies_to_index,
        agency_index_alias,
        enable_factory_create,
    ):
        # Setup data
        agency = AgencyFactory.create(agency_name="NIH")
        opp_posted = OpportunityFactory.create(agency_code=agency.agency_code)  # POSTED
        OpportunityFactory.create(agency_code=agency.agency_code, is_closed_summary=True)  # CLOSED

        ExcludedOpportunityReviewFactory.create(
            legacy_opportunity_id=opp_posted.legacy_opportunity_id
        )

        load_agencies_to_index.index_name = (
            load_agencies_to_index.index_name + "-review-status-multi-data"
        )
        load_agencies_to_index.run()

        resp = search_client.search(agency_index_alias, {"size": 50})

        assert resp.total_records == 1
        assert resp.records[0]["opportunity_statuses"] == [OpportunityStatus.CLOSED.value]
