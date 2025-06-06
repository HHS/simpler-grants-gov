import pytest

from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.constants.lookup_constants import OpportunityStatus
from src.pagination.pagination_models import SortDirection
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import AgencyFactory

# parent agencies
HHS = AgencyFactory.build(agency_code="HHS")
DOD = AgencyFactory.build(agency_code="DOD")
DOA = AgencyFactory.build(agency_code="DOA")

# sub-agencies
HHS_NIH = AgencyFactory.build(agency_code="HHS-NIH", top_level_agency=HHS)
HHS_DOC = AgencyFactory.build(agency_code="HHS-DOC", top_level_agency=HHS)
HHS_OMHA = AgencyFactory.build(agency_code="HHS-OMHA", top_level_agency=HHS, is_test_agency=True)
DOD_MCO = AgencyFactory.build(agency_code="DOD-MCO", top_level_agency=DOD)
DOD_HRE = AgencyFactory.build(agency_code="DOD-HRE", top_level_agency=DOD)

AGENCIES = [DOA, DOD, DOD_HRE, DOD_MCO, HHS, HHS_DOC, HHS_NIH, HHS_OMHA]


class TestAgencyRoutesSearch(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(self, agency_index, agency_index_alias, search_client):
        # load agencies into search index
        schema = AgencyV1Schema()
        json_records = [schema.dump(agency) for agency in AGENCIES]

        statuses = [
            OpportunityStatus.POSTED.value,
            OpportunityStatus.FORECASTED.value,
            OpportunityStatus.CLOSED.value,
            OpportunityStatus.ARCHIVED.value,
        ]
        # Assign a status flag
        for i, record in enumerate(json_records):
            status_index = (i // 2) % len(statuses)
            record["opportunity_statuses"] = [statuses[status_index]]

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
                # Get all agencies using all status filter
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "opportunity_statuses": {
                            "one_of": [
                                OpportunityStatus.POSTED,
                                OpportunityStatus.FORECASTED,
                                OpportunityStatus.ARCHIVED,
                                OpportunityStatus.CLOSED,
                            ]
                        },
                    },
                },
                AGENCIES,
            ),
            (
                # Get agencies  with open/forecasted opportunity status filter
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "opportunity_statuses": {
                            "one_of": [OpportunityStatus.POSTED, OpportunityStatus.FORECASTED]
                        },
                    },
                },
                [DOA, DOD, DOD_HRE, DOD_MCO],
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
                        "opportunity_statuses": {
                            "one_of": [
                                OpportunityStatus.POSTED,
                                OpportunityStatus.CLOSED,
                                OpportunityStatus.FORECASTED,
                            ]
                        },
                    },
                },
                [DOA, DOD, DOD_HRE, DOD_MCO, HHS, HHS_DOC],
            ),
            (
                # Multi filter
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "is_test_agency": {"one_of": [False]},
                        "opportunity_statuses": {"one_of": [OpportunityStatus.ARCHIVED]},
                    },
                },
                [HHS_NIH],
            ),
            (
                # Multi filter
                {
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 25,
                        "sort_order": [
                            {"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}
                        ],
                    },
                    "filters": {
                        "is_test_agency": {"one_of": [True]},
                        "opportunity_statuses": {"one_of": [OpportunityStatus.POSTED]},
                    },
                },
                [],
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
