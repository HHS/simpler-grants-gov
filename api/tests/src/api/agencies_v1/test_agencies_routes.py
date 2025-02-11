import pytest

from src.db.models.agency_models import Agency
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import AgencyFactory


class TestAgenciesRoutes(BaseTestClass):
    @pytest.fixture(autouse=True)
    def cleanup_agencies(self, db_session):
        yield

        # Use no_autoflush to prevent premature flushes
        with db_session.no_autoflush:
            # Fetch all agencies
            agencies = db_session.query(Agency).all()
            # Delete each agency
            for agency in agencies:
                db_session.delete(agency)

        db_session.commit()

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
        AgencyFactory.create(agency_name="HHS")
        AgencyFactory.create(agency_name="DOD")

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
        payload["pagination"]["sort_order"] = [
            {"order_by": "agency_name", "sort_direction": "descending"},
            {"order_by": "agency_code", "sort_direction": "descending"},
        ]

        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]

        # assert order by agency_name asc
        assert data[0]["agency_name"] > data[1]["agency_name"]
