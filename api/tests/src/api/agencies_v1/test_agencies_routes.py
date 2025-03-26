import pytest

from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory


class TestAgenciesRoutes(BaseTestClass):
    @pytest.fixture(autouse=True)
    def cleanup_agencies(self, db_session):
        yield
        cascade_delete_from_db_table(db_session, Agency)
        cascade_delete_from_db_table(db_session, Opportunity)

    def test_agencies_get_default_dates(
        self, client, api_auth_token, enable_factory_create, db_session
    ):

        # These should return in the default date range
        AgencyFactory.create_batch(4)

        # These should be excluded
        AgencyFactory.create_batch(3, is_test_agency=True)

        payload = {
            "filters": {},
            "pagination": {
                "page_size": 10,
                "page_offset": 1,
                "sort_order": [
                    {"order_by": "created_at", "sort_direction": "descending"},
                ],
            },
        }
        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]
        assert len(data) == 4

    def test_agencies_get_with_sub_agencies(
        self,
        client,
        api_auth_token,
        enable_factory_create,
        db_session,
    ):
        # Create top-level agencies
        hhs = AgencyFactory.create(agency_name="HHS")
        dod = AgencyFactory.create(agency_name="DOD")

        # Create sub-agencies
        AgencyFactory.create(agency_name="HHS-AOA", top_level_agency=hhs)
        AgencyFactory.create(agency_name="HHS-CDC", top_level_agency=hhs)
        AgencyFactory.create(agency_name="DOD-ARMY", top_level_agency=dod)
        AgencyFactory.create(agency_name="DOD-NAVY", top_level_agency=dod)

        payload = {
            "filters": {},
            "pagination": {
                "page_size": 10,
                "page_offset": 1,
                "sort_order": [
                    {"order_by": "created_at", "sort_direction": "descending"},
                ],
            },
        }

        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]

        # Verify the relationships
        for agency in data:
            if "-" in agency["agency_name"]:
                top_level_name = agency["agency_name"].split("-")[0]
                assert agency["top_level_agency"]["agency_name"] == top_level_name

    def test_agencies_sorting(self, client, api_auth_token, enable_factory_create, db_session):
        # Create agencies
        AgencyFactory.create(agency_name="HHS", agency_code="DOI")
        AgencyFactory.create(agency_name="DOD", agency_code="HHS-ACL")

        # Test default sort order
        payload = {
            "filters": {},
            "pagination": {
                "page_size": 10,
                "page_offset": 1,
            },
        }

        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]

        # assert defaults to sorting by agency_code asc
        assert len(data) == 2
        assert data[0]["agency_code"] < data[1]["agency_code"]

        # Test multi-sort
        AgencyFactory.create(agency_name="DOD", agency_code="HHS-ACF")

        payload["pagination"]["sort_order"] = [
            {"order_by": "agency_name", "sort_direction": "descending"},
            {"order_by": "agency_code", "sort_direction": "descending"},
        ]

        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]

        # assert order by agency_name desc then agency_code desc
        assert data[0]["agency_name"] > data[1]["agency_name"]
        assert data[1]["agency_code"] > data[2]["agency_code"]

    def test_agencies_active(self, client, api_auth_token, enable_factory_create, db_session):
        # Create top-level agencies
        hhs = AgencyFactory.create(agency_name="HHS")
        usda = AgencyFactory.create(agency_name="USDA")
        darpa = AgencyFactory.create(agency_name="DARPA")

        doi_hhs = AgencyFactory.create(
            agency_name="HHS", agency_code="DOI-HHS", top_level_agency=hhs
        )
        usda_crees = AgencyFactory.create(
            agency_name="USDA-CSREE", agency_code="USDA-CSREE-FDO", top_level_agency=usda
        )
        dod_darpa = AgencyFactory.create(
            agency_name="DARPA-CHS", agency_code="DOD-DARPA-MTO", top_level_agency=darpa
        )

        # HHS
        OpportunityFactory.create(agency_code=doi_hhs.agency_code)  # POSTED
        OpportunityFactory.create(agency_code=doi_hhs.agency_code)  # POSTED

        # CREES
        OpportunityFactory.create(agency_code=usda_crees.agency_code, is_closed_summary=True)
        OpportunityFactory.create(agency_code=usda_crees.agency_code, is_forecasted_summary=True)

        # DARPA
        OpportunityFactory.create(
            agency_code=dod_darpa.agency_code, is_archived_non_forecast_summary=True  # archived
        )

        # Make request
        payload = {
            "filters": {"active": "True"},
            "pagination": {
                "page_size": 10,
                "page_offset": 1,
            },
        }

        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]

        # only agency associated with opportunity of posted/forecast status is returned and the respective top_level_agencies
        assert len(data) == 4

        assert set([agency["agency_code"] for agency in data]) == set(
            [opp.agency_code for opp in [doi_hhs, usda_crees, hhs, usda]]
        )
