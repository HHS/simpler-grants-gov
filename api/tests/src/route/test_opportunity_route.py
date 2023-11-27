import dataclasses

import pytest

from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from tests.src.db.models.factories import OpportunityFactory


@dataclasses.dataclass
class SearchExpectedValues:
    total_pages: int
    total_records: int

    response_record_count: int


def get_search_request(
    page_offset: int = 1,
    page_size: int = 5,
    order_by: str = "opportunity_id",
    sort_direction: str = "descending",
    opportunity_title: str | None = None,
    category: str | None = None,
):
    req = {
        "paging": {"page_offset": page_offset, "page_size": page_size},
        "sorting": {"order_by": order_by, "sort_direction": sort_direction},
    }

    if opportunity_title is not None:
        req["opportunity_title"] = opportunity_title

    if category is not None:
        req["category"] = category

    return req


def validate_search_response(
    search_response: dict, search_request: dict, expected_values: SearchExpectedValues
):
    pagination_info = search_response["pagination_info"]
    assert pagination_info["page_offset"] == search_request["paging"]["page_offset"]
    assert pagination_info["page_size"] == search_request["paging"]["page_size"]
    assert pagination_info["order_by"] == search_request["sorting"]["order_by"]
    assert pagination_info["sort_direction"] == search_request["sorting"]["sort_direction"]

    assert pagination_info["total_pages"] == expected_values.total_pages
    assert pagination_info["total_records"] == expected_values.total_records

    searched_opportunities = search_response["data"]
    assert len(searched_opportunities) == expected_values.response_record_count

    # Verify data is sorted as expected
    reverse = pagination_info["sort_direction"] == "descending"
    resorted_opportunities = sorted(
        searched_opportunities, key=lambda u: u[pagination_info["order_by"]], reverse=reverse
    )
    assert resorted_opportunities == searched_opportunities


@pytest.fixture
def truncate_opportunities(db_session):
    db_session.query(Opportunity).delete()


@pytest.fixture
def setup_opportunities(enable_factory_create, truncate_opportunities):
    # Create a handful of opportunities for testing
    # Once we've built out the endpoint more, we'll probably want to make this more robust.

    OpportunityFactory.create(opportunity_title="Find me abc", category=OpportunityCategory.EARMARK)
    OpportunityFactory.create(
        opportunity_title="Find me xyz", category=OpportunityCategory.CONTINUATION
    )

    OpportunityFactory.create(category=OpportunityCategory.DISCRETIONARY)
    OpportunityFactory.create(category=OpportunityCategory.DISCRETIONARY)

    OpportunityFactory.create(category=OpportunityCategory.MANDATORY)

    # Add a few opportunities with is_draft=True which should never be found
    OpportunityFactory.create_batch(size=10, is_draft=True)


#####################################
# POST /opportunities/search
#####################################


@pytest.mark.parametrize(
    "search_request,expected_values",
    [
        # No params gets all 5 records
        (
            get_search_request(),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=5),
        ),
        # opportunity title uses an ilike filter (case-insensitive contains)
        (
            get_search_request(opportunity_title="find me"),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(opportunity_title="find me abc"),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(opportunity_title="find me xyz"),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(opportunity_title="FiNd Me"),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(opportunity_title="not going to find"),
            SearchExpectedValues(total_pages=0, total_records=0, response_record_count=0),
        ),
        # category filter
        (
            get_search_request(category=OpportunityCategory.DISCRETIONARY),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(category=OpportunityCategory.EARMARK),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(category=OpportunityCategory.CONTINUATION),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(category=OpportunityCategory.OTHER),
            SearchExpectedValues(total_pages=0, total_records=0, response_record_count=0),
        ),
        # A mix of filters
        (
            get_search_request(opportunity_title="find me", category=OpportunityCategory.EARMARK),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(category=OpportunityCategory.DISCRETIONARY),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(
                opportunity_title="find me",
                category=OpportunityCategory.CONTINUATION,
            ),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(
                opportunity_title="something else",
                category=OpportunityCategory.OTHER,
            ),
            SearchExpectedValues(total_pages=0, total_records=0, response_record_count=0),
        ),
    ],
)
def test_opportunity_search_200(
    client,
    api_auth_token,
    enable_factory_create,
    setup_opportunities,
    search_request,
    expected_values,
):
    resp = client.post(
        "/v1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )

    search_response = resp.get_json()
    assert resp.status_code == 200

    validate_search_response(search_response, search_request, expected_values)


@pytest.mark.parametrize(
    "search_request,expected_values",
    [
        # Verifying page offset and size work properly
        (
            get_search_request(page_offset=1, page_size=5),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
        (
            get_search_request(page_offset=2, page_size=10),
            SearchExpectedValues(total_pages=3, total_records=25, response_record_count=10),
        ),
        (
            get_search_request(page_offset=5, page_size=6),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=1),
        ),
        (
            get_search_request(page_offset=15, page_size=1),
            SearchExpectedValues(total_pages=25, total_records=25, response_record_count=1),
        ),
        (
            get_search_request(page_offset=100, page_size=5),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=0),
        ),
        # Sorting
        (
            get_search_request(order_by="opportunity_id", sort_direction="ascending"),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
        (
            get_search_request(order_by="agency", sort_direction="descending"),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
        (
            get_search_request(order_by="opportunity_number", sort_direction="ascending"),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
        (
            get_search_request(order_by="created_at", sort_direction="descending"),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
        (
            get_search_request(order_by="updated_at", sort_direction="ascending"),
            SearchExpectedValues(total_pages=5, total_records=25, response_record_count=5),
        ),
    ],
)
def test_opportunity_search_paging_and_sorting_200(
    client,
    api_auth_token,
    enable_factory_create,
    search_request,
    expected_values,
    truncate_opportunities,
):
    # This test is just focused on testing the sorting and pagination
    OpportunityFactory.create_batch(size=25)

    resp = client.post(
        "/v1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )

    search_response = resp.get_json()
    assert resp.status_code == 200

    validate_search_response(search_response, search_request, expected_values)


@pytest.mark.parametrize(
    "search_request,expected_response_data",
    [
        (
            {},
            [
                {
                    "field": "sorting",
                    "message": "Missing data for required field.",
                    "type": "required",
                },
                {
                    "field": "paging",
                    "message": "Missing data for required field.",
                    "type": "required",
                },
            ],
        ),
        (
            get_search_request(page_offset=-1, page_size=-1),
            [
                {
                    "field": "paging.page_size",
                    "message": "Must be greater than or equal to 1.",
                    "type": "min_or_max_value",
                },
                {
                    "field": "paging.page_offset",
                    "message": "Must be greater than or equal to 1.",
                    "type": "min_or_max_value",
                },
            ],
        ),
        (
            get_search_request(order_by="fake_field", sort_direction="up"),
            [
                {
                    "field": "sorting.order_by",
                    "message": "Value must be one of: opportunity_id, agency, opportunity_number, created_at, updated_at",
                    "type": "invalid_choice",
                },
                {
                    "field": "sorting.sort_direction",
                    "message": "Must be one of: ascending, descending.",
                    "type": "invalid_choice",
                },
            ],
        ),
        (
            get_search_request(opportunity_title={}),
            [
                {
                    "field": "opportunity_title",
                    "message": "Not a valid string.",
                    "type": "invalid",
                }
            ],
        ),
        (
            get_search_request(category="X"),
            [
                {
                    "field": "category",
                    "message": "Must be one of: D, M, C, E, O.",
                    "type": "invalid_choice",
                }
            ],
        ),
    ],
)
def test_opportunity_search_invalid_request_422(
    client, api_auth_token, search_request, expected_response_data
):
    resp = client.post(
        "/v1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 422

    print(resp.get_json())
    response_data = resp.get_json()["errors"]
    assert response_data == expected_response_data


@pytest.mark.parametrize("enable_opportunity_log_msg", [True, False, None])
def test_opportunity_search_feature_flag_200(
    client, api_auth_token, enable_opportunity_log_msg, caplog
):
    headers = {"X-Auth": api_auth_token}

    if enable_opportunity_log_msg is not None:
        headers["FF-Enable-Opportunity-Log-Msg"] = enable_opportunity_log_msg

    client.post("/v1/opportunities/search", json=get_search_request(), headers=headers)

    # Verify the header override works, and if not set the default of False is used
    if enable_opportunity_log_msg is True:
        assert "Feature flag enabled" in caplog.messages
    else:
        assert "Feature flag enabled" not in caplog.messages


@pytest.mark.parametrize("enable_opportunity_log_msg", ["hello", 5, {}])
def test_opportunity_search_feature_flag_invalid_value_422(
    client, api_auth_token, enable_opportunity_log_msg
):
    headers = {
        "X-Auth": api_auth_token,
        "FF-Enable-Opportunity-Log-Msg": enable_opportunity_log_msg,
    }

    resp = client.post("/v1/opportunities/search", json=get_search_request(), headers=headers)
    assert resp.status_code == 422

    response_data = resp.get_json()["errors"]
    assert response_data == [
        {
            "field": "FF-Enable-Opportunity-Log-Msg",
            "message": "Not a valid boolean.",
            "type": "invalid",
        }
    ]


#####################################
# GET /opportunities/<opportunity_id>
#####################################


def test_get_opportunity_200(client, api_auth_token, enable_factory_create):
    opportunity = OpportunityFactory.create()

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 200

    response_data = resp.get_json()["data"]

    assert response_data["opportunity_id"] == opportunity.opportunity_id
    assert response_data["opportunity_title"] == opportunity.opportunity_title
    assert response_data["agency"] == opportunity.agency
    assert response_data["category"] == opportunity.category


def test_get_opportunity_not_found_404(client, api_auth_token, truncate_opportunities):
    resp = client.get("/v1/opportunities/1", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Could not find Opportunity with ID 1"


def test_get_opportunity_not_found_is_draft_404(client, api_auth_token, enable_factory_create):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with ID {opportunity.opportunity_id}"
    )


def test_get_opportunity_invalid_id_404(client, api_auth_token):
    # with how the route naming resolves, this won't be an invalid request, but instead a 404
    resp = client.get("/v1/opportunities/text", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Not Found"


#####################################
# Auth tests
#####################################
@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/opportunities/search", get_search_request()),
        ("GET", "/v1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401(client, api_auth_token, method, url, body):
    # open is just the generic method that post/get/etc. call under the hood
    response = client.open(url, method=method, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
