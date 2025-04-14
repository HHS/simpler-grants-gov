import pytest

from src.adapters.search.opensearch_response import SearchResponse
from src.pagination.pagination_models import PaginationInfo, PaginationParams


@pytest.mark.parametrize(
    "total_records, page_size, expected_total_records, expected_total_pages",
    [
        # Scenarios under 10k total records
        (517, 25, 517, 21),
        (5101, 1, 5101, 5101),
        (9999, 1000, 9999, 10),
        # Scenarios over 10k total records
        (13000, 4000, 10000, 3),
        (15000, 1000, 10000, 10),
        (10001, 25, 10000, 400),
        (10001, 1, 10000, 10000),
    ],
)
def test_from_search_response(
    total_records, page_size, expected_total_records, expected_total_pages
):
    pagination_params = PaginationParams(page_offset=1, page_size=page_size)
    search_response = SearchResponse(
        total_records=total_records, records=[], aggregations={}, scroll_id=None
    )

    info = PaginationInfo.from_search_response(pagination_params, search_response)

    assert info.total_records == expected_total_records
    assert info.total_pages == expected_total_pages
