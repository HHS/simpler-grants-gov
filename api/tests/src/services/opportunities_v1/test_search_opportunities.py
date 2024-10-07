import pytest

from src.api.opportunities_v1.conftest import get_search_request
from src.pagination.pagination_models import SortDirection
from src.services.opportunities_v1.search_opportunities import search_opportunities


@pytest.mark.parmeterize(
    "search_param,expected_results",
    [
        # default scoring rule
        (
            get_search_request(
                page_size=3,
                page_offset=1,
                order_by="agency_code",
                sort_direction=SortDirection.DESCENDING,
                query="",
            ),
            (),
        ),
        # agency scoring rule
        (
            get_search_request(
                page_size=3,
                page_offset=1,
                order_by="agency_code",
                sort_direction=SortDirection.DESCENDING,
                query="",
                experimental={"scoring_rule": "agency"},
            ),
            (),
        ),
        # expanded scoring rule
        (
            get_search_request(
                page_size=3,
                page_offset=1,
                order_by="agency_code",
                sort_direction=SortDirection.DESCENDING,
                query="",
                experimental={"scoring_rule": "expanded"},
            ),
            (),
        ),
    ],
)
def test_search_opportunities(search_client, search_param, expected_results):

    records, aggregations, pagination_info = search_opportunities(search_client, search_param)

    assert records == expected_results[0]
    assert aggregations == expected_results[1]
    assert pagination_info == expected_results[2]