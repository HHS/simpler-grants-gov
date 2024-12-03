import pytest

from src.db.models.agency_models import Agency
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import AgencyFactory


class TestAgenciesRoutes(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def cleanup_agencies(self, db_session):
        yield

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
        AgencyFactory.create_batch(7)

        # These should be excluded
        AgencyFactory.create_batch(3, is_test_agency=True)

        payload = {
            "filters": {},
            "pagination": {
                "page": 1,
                "page_size": 10,
                "page_offset": 1,
                "order_by": "created_at",
                "sort_direction": "descending",
            },
        }
        response = client.post("/v1/agencies", headers={"X-Auth": api_auth_token}, json=payload)
        assert response.status_code == 200
        data = response.json["data"]
        assert len(data) == 7
