import uuid

import pytest
from grants_shared.pagination.pagination_models import SortDirection

from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.constants.lookup_constants import OpportunityStatus
from src.search.backend.load_agencies_to_index import AGENCY_INDEX_ANALYSIS, AGENCY_INDEX_MAPPINGS
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
    def test_search_agencies(self, client, user_api_key_id, search_request, expected_result):
        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-API-Key": user_api_key_id}
        )
        data = resp.json["data"]
        assert resp.status_code == 200
        assert len(data) == len(expected_result)
        assert [d["agency_id"] for d in data] == [str(exp.agency_id) for exp in expected_result]


# agencies with real-world names so that we can verify how the query analyzer handles them
DEFENSE = AgencyFactory.build(agency_code="DOD", agency_name="Department of Defense")
DEFENSE_AMC = AgencyFactory.build(
    agency_code="DOD-AMC", agency_name="Army Materiel Command", top_level_agency=DEFENSE
)
ENERGY = AgencyFactory.build(agency_code="DOE", agency_name="Department of Energy")
HEALTH = AgencyFactory.build(
    agency_code="HHS", agency_name="Department of Health and Human Services"
)
HEALTH_NIH = AgencyFactory.build(
    agency_code="HHS-NIH", agency_name="National Institutes of Health", top_level_agency=HEALTH
)
HOUSING = AgencyFactory.build(
    agency_code="HUD", agency_name="Department of Housing and Urban Development"
)
AGRICULTURE = AgencyFactory.build(agency_code="USDA", agency_name="Department of Agriculture")

# ordered by agency code, which is how the tests below request results be sorted
NAMED_AGENCIES = [DEFENSE, DEFENSE_AMC, ENERGY, HEALTH, HEALTH_NIH, HOUSING, AGRICULTURE]


def _query_request(query: str, query_operator: str | None = None) -> dict:
    request = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}],
        },
        "query": query,
    }
    if query_operator:
        request["query_operator"] = query_operator
    return request


class TestAgencySearchQuery(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(self, agency_index_alias, search_client):
        index_name = f"test-agency-index-{uuid.uuid4().int}"
        search_client.create_index(
            index_name, analysis=AGENCY_INDEX_ANALYSIS, mappings=AGENCY_INDEX_MAPPINGS
        )

        schema = AgencyV1Schema()
        json_records = [schema.dump(agency) for agency in NAMED_AGENCIES]
        for record in json_records:
            record["opportunity_statuses"] = [OpportunityStatus.POSTED.value]

        search_client.bulk_upsert(index_name, json_records, "agency_id", refresh=True)
        search_client.swap_alias_index(index_name, agency_index_alias)

        # deliberately not deleted here, so that the alias is never left pointing at a
        # deleted index. The session scoped fixtures clean up test-agency-index-* at the end.
        return index_name

    @pytest.mark.parametrize(
        "search_request,expected_result",
        [
            # full agency names should only match the agency they name
            (_query_request("Department of Energy"), [ENERGY]),
            # a top level agency name also matches its sub-agencies
            (_query_request("Department of Defense"), [DEFENSE, DEFENSE_AMC]),
            # a single word of a name matches, even when stemming applies (energy -> energi)
            (_query_request("Energy"), [ENERGY]),
            (_query_request("Agriculture"), [AGRICULTURE]),
            # every intermediate state of a partially typed word matches
            (_query_request("Energ"), [ENERGY]),
            (_query_request("Hous"), [HOUSING]),
            (_query_request("Housi"), [HOUSING]),
            (_query_request("Housing"), [HOUSING]),
            (_query_request("Nationa"), [HEALTH_NIH]),
            (_query_request("Department of Heal"), [HEALTH, HEALTH_NIH]),
            # stemming still lets a pluralized search match
            (_query_request("Departments of Energy"), [ENERGY]),
            # searching by code still works
            (_query_request("DOE"), [ENERGY]),
            (_query_request("DOD"), [DEFENSE, DEFENSE_AMC]),
            # searches are case insensitive
            (_query_request("department of energy"), [ENERGY]),
            # a word shared by several agencies matches all of them
            (_query_request("Department"), NAMED_AGENCIES),
            # the OR operator can still be requested explicitly
            (_query_request("Department of Defense", query_operator="OR"), NAMED_AGENCIES),
            (_query_request("Department of Education"), []),
            (_query_request("not an agency"), []),
        ],
    )
    def test_search_agencies_by_name(
        self, client, user_api_key_id, search_request, expected_result
    ):
        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-API-Key": user_api_key_id}
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert [d["agency_id"] for d in data] == [str(exp.agency_id) for exp in expected_result]

    def test_search_agencies_sorted_by_name(self, client, user_api_key_id):
        """Agency names are explicitly mapped, so verify sorting on the keyword sub-field."""
        search_request = {
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
                "sort_order": [
                    {"order_by": "agency_name", "sort_direction": SortDirection.ASCENDING}
                ],
            },
        }

        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-API-Key": user_api_key_id}
        )

        assert resp.status_code == 200
        assert [d["agency_name"] for d in resp.json["data"]] == sorted(
            agency.agency_name for agency in NAMED_AGENCIES
        )


class TestAgencySearchQueryBeforeReindex(BaseTestClass):
    """Search against an index built before the unstemmed sub-fields existed.

    Between deploying and the next run of the hourly load-agency-data job, the live index
    has no unstemmed sub-fields. OpenSearch ignores unmapped fields in a multi_match rather
    than erroring, so search keeps working against the stemmed fields alone.
    """

    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(self, agency_index_alias, search_client):
        index_name = f"test-agency-index-{uuid.uuid4().int}"
        # the mapping as it was before the unstemmed sub-fields were added
        search_client.create_index(
            index_name, mappings={"properties": {"opportunity_statuses": {"type": "keyword"}}}
        )

        schema = AgencyV1Schema()
        json_records = [schema.dump(agency) for agency in NAMED_AGENCIES]
        for record in json_records:
            record["opportunity_statuses"] = [OpportunityStatus.POSTED.value]

        search_client.bulk_upsert(index_name, json_records, "agency_id", refresh=True)
        search_client.swap_alias_index(index_name, agency_index_alias)

        return index_name

    @pytest.mark.parametrize(
        "search_request,expected_result",
        [
            (_query_request("Department of Energy"), [ENERGY]),
            (_query_request("Department of Defense"), [DEFENSE, DEFENSE_AMC]),
            (_query_request("Energy"), [ENERGY]),
            (_query_request("DOE"), [ENERGY]),
            (_query_request("Department"), NAMED_AGENCIES),
            (_query_request("not an agency"), []),
            # partially typed words that stemming truncates are the one case the unstemmed
            # sub-fields fix, so these stay unmatched until the index is rebuilt
            (_query_request("Housing"), [HOUSING]),
            (_query_request("Housi"), []),
        ],
    )
    def test_search_agencies_by_name(
        self, client, user_api_key_id, search_request, expected_result
    ):
        resp = client.post(
            "/v1/agencies/search", json=search_request, headers={"X-API-Key": user_api_key_id}
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert [d["agency_id"] for d in data] == [str(exp.agency_id) for exp in expected_result]
