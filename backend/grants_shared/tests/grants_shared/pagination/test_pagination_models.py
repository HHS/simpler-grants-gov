import pytest

from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams


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
    info = PaginationInfo.from_search_response(pagination_params, total_records)

    assert info.total_records == expected_total_records
    assert info.total_pages == expected_total_pages
