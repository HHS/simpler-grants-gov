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
    is_draft: bool | None = None,
):
    req = {
        "paging": {"page_offset": page_offset, "page_size": page_size},
        "sorting": {"order_by": order_by, "sort_direction": sort_direction},
    }

    if opportunity_title is not None:
        req["opportunity_title"] = opportunity_title

    if category is not None:
        req["category"] = category

    if is_draft is not None:
        req["is_draft"] = is_draft

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

    OpportunityFactory.create(
        opportunity_title="Find me abc", category=OpportunityCategory.EARMARK, is_draft=True
    )
    OpportunityFactory.create(
        opportunity_title="Find me xyz", category=OpportunityCategory.CONTINUATION, is_draft=False
    )

    OpportunityFactory.create(category=OpportunityCategory.DISCRETIONARY, is_draft=True)
    OpportunityFactory.create(category=OpportunityCategory.DISCRETIONARY, is_draft=False)

    OpportunityFactory.create(category=OpportunityCategory.MANDATORY, is_draft=False)


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
        # is_draft filter
        (
            get_search_request(is_draft=True),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(is_draft=False),
            SearchExpectedValues(total_pages=1, total_records=3, response_record_count=3),
        ),
        # A mix of filters
        (
            get_search_request(opportunity_title="find me", category=OpportunityCategory.EARMARK),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(category=OpportunityCategory.DISCRETIONARY, is_draft=True),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(
                opportunity_title="find me",
                category=OpportunityCategory.CONTINUATION,
                is_draft=False,
            ),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(
                opportunity_title="something else",
                category=OpportunityCategory.OTHER,
                is_draft=True,
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
            {
                "paging": ["Missing data for required field."],
                "sorting": ["Missing data for required field."],
            },
        ),
        (
            get_search_request(page_offset=-1, page_size=-1),
            {
                "paging": {
                    "page_offset": ["Must be greater than or equal to 1."],
                    "page_size": ["Must be greater than or equal to 1."],
                }
            },
        ),
        (
            get_search_request(order_by="fake_field", sort_direction="up"),
            {
                "sorting": {
                    "order_by": [
                        "Must be one of: opportunity_id, agency, opportunity_number, created_at, updated_at."
                    ],
                    "sort_direction": ["Must be one of: ascending, descending."],
                }
            },
        ),
        (get_search_request(opportunity_title={}), {"opportunity_title": ["Not a valid string."]}),
        (get_search_request(category="X"), {"category": ["Must be one of: D, M, C, E, O."]}),
        (get_search_request(is_draft="hello"), {"is_draft": ["Not a valid boolean."]}),
    ],
)
def test_opportunity_search_invalid_request_422(
    client, api_auth_token, search_request, expected_response_data
):
    resp = client.post(
        "/v1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 422

    response_data = resp.get_json()["detail"]["json"]
    assert response_data == expected_response_data


def test_opportunity_search_unauthorized_401(client, api_auth_token):
    response = client.post(
        "/v1/opportunities/search", json=get_search_request(), headers={"X-Auth": "incorrect token"}
    )

    print(response.get_json())
    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
