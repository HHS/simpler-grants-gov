from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.pagination.pagination_models import SortDirection
from tests.conftest import BaseTestClass

import pytest

from tests.src.db.models.factories import AgencyFactory

# parent agencies
HHS = AgencyFactory.build(agency_code="HHS")
DOD = AgencyFactory.build(agency_code="DOD")
DOA = AgencyFactory.build(agency_code="DOA")

# sub-agencies
HHS_NIH = AgencyFactory.build(agency_code="HHS-NIH", top_level_agency=HHS.top_level_agency)
HHS_DOC = AgencyFactory.build(agency_code="HHS-DOC", top_level_agency=HHS.top_level_agency)
DOD_MRN = AgencyFactory.build(agency_code="DOD-MRN", top_level_agency=DOD.top_level_agency)
DOD_HRE = AgencyFactory.build(agency_code="DOD-HRE", top_level_agency=DOD.top_level_agency)

AGENCIES = [HHS,DOD, DOA, HHS_NIH,HHS_DOC,DOD,DOD_HRE]

class TestAgencyRoutesSearch(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(self, agency_index, agency_index_alias, search_client):
        # load agencies into search index
        schema = AgencyV1Schema()
        json_records = [schema.dump(agency) for agency in AGENCIES]
        print("==============",len(json_records))
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
                # Return ALL with "" query string
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [{"order_by": "agency_name", "sort_direction": SortDirection.ASCENDING}],
                    },
                    "query": ""
                },
                AGENCIES
            ),
            (
                # filter by status
                    {
                        "pagination": {
                            "page_offset": 1,
                            "page_size": 25,
                            "sort_order": [{"order_by": "agency_name", "sort_direction": SortDirection.ASCENDING}],
                        },
                        "query": "dod"
                    },
                []

            )
        ]
    )
    def test_search_agencies(self, client,  api_auth_token, search_request, expected_result):
        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-Auth": api_auth_token}
        )
        data =resp.json["data"]

        import pdb; pdb.set_trace()
        assert resp.status_code == 200
        assert len(data) == len(expected_result)
        assert resp.json["data"] == expected_result
