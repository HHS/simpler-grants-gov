import pytest

from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.pagination.pagination_models import SortDirection
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import AgencyFactory

# parent agencies
HHS = AgencyFactory.build(agency_code="HHS")
DOD = AgencyFactory.build(agency_code="DOD")
DOA = AgencyFactory.build(agency_code="DOA")
DHA = AgencyFactory.build(agency_code="DHA", is_test_agency=True)

# sub-agencies
HHS_NIH = AgencyFactory.build(agency_code="HHS-NIH", top_level_agency=HHS)
HHS_DOC = AgencyFactory.build(agency_code="HHS-DOC", top_level_agency=HHS)
DOD_MCO = AgencyFactory.build(agency_code="DOD-MCO", top_level_agency=DOD)
DOD_HRE = AgencyFactory.build(agency_code="DOD-HRE", top_level_agency=DOD)

AGENCIES = [DOA, DOD, DOD_HRE, DOD_MCO, HHS, HHS_DOC, HHS_NIH, DHA]


class TestAgencyRoutesSearch(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(self, agency_index, agency_index_alias, search_client):
        # load agencies into search index
        schema = AgencyV1Schema()
        json_records = [schema.dump(agency) for agency in AGENCIES]
        json_records[0]["has_active_opportunity"] = True  # DOA

        search_client.bulk_upsert(
            agency_index,
            json_records,
            "agency_id",
            refresh=True,
        )

        # Swap the search index alias
        search_client.swap_alias_index(agency_index, agency_index_alias)

    @pytest.mark.parametrize(
        "search_request,expected_result",
        [
            (
                # Get all agencies
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                },
                AGENCIES,
            ),
            (
                # Query
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "query": "dod",
                },
                [DOD, DOD_HRE, DOD_MCO],
            ),
            # Filter
            (
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "has_active_opportunity": {"one_of": [True]},
                    },
                },
                [DOA],
            ),
            (
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "has_active_opportunity": {"one_of": [0]},
                    },
                },
                [DOD, DOD_HRE, DOD_MCO, HHS, HHS_DOC, HHS_NIH],
            ),
            (
                    {
                        "pagination": {
                            "page_offset": 1,
                            "page_size": 25,
                            "sort_order": [
                                {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                            ],
                        },
                        "filters": {
                            "is_test_agency": {"one_of": [0]},
                        },
                    },
                    [DHA],
            ),
        ],
    )
    def test_search_agencies(self, client, api_auth_token, search_request, expected_result):
        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-Auth": api_auth_token}
        )
        data = resp.json["data"]

        assert resp.status_code == 200
        assert len(data) == len(expected_result)
        assert [d["agency_id"] for d in data] == [str(exp.agency_id) for exp in expected_result]
