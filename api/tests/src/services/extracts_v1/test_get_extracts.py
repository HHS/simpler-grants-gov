from datetime import date, datetime, timezone

import pytest

from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from src.pagination.pagination_models import PaginationParams, SortDirection, SortOrderParams
from src.search.search_models import DateSearchFilter
from src.services.extracts_v1.get_extracts import ExtractFilters, ExtractListParams, get_extracts
from tests.src.db.models.factories import ExtractMetadataFactory


@pytest.fixture(autouse=True)
def clear_extracts(db_session):
    db_session.query(ExtractMetadata).delete()
    db_session.commit()
    return


def test_get_extracts_no_filters(
    enable_factory_create,
    db_session,
):
    ExtractMetadataFactory.create_batch(3)

    params = ExtractListParams(
        pagination=PaginationParams(
            page_size=10,
            page_offset=1,
            order_by="created_at",
            sort_direction=SortDirection.ASCENDING,
        )
    )

    extracts, pagination_info = get_extracts(db_session, params)
    assert len(extracts) == 3
    assert pagination_info.total_records == 3


def test_get_extracts_with_type_filter(
    enable_factory_create,
    db_session,
):
    ExtractMetadataFactory.create_batch(3, extract_type=ExtractType.OPPORTUNITIES_CSV)
    ExtractMetadataFactory.create_batch(3, extract_type=ExtractType.OPPORTUNITIES_JSON)

    params = ExtractListParams(
        pagination=PaginationParams(
            page_size=10,
            page_offset=1,
            order_by="created_at",
            sort_direction=SortDirection.ASCENDING,
        ),
        filters=ExtractFilters(extract_type="opportunities_json"),
    )

    extracts, _ = get_extracts(db_session, params)
    assert len(extracts) == 3
    assert all(r.extract_type == "opportunities_json" for r in extracts)


def test_get_extracts_with_date_filter(enable_factory_create, db_session):
    ExtractMetadataFactory.create_batch(3, created_at=datetime(2024, 1, 15))
    ExtractMetadataFactory.create_batch(3, created_at=datetime(2024, 1, 25))

    params = ExtractListParams(
        pagination=PaginationParams(
            page_size=10,
            page_offset=1,
            order_by="created_at",
            sort_direction=SortDirection.ASCENDING,
        ),
        filters=ExtractFilters(
            created_at=DateSearchFilter(
                start_date=date(2024, 1, 10),
                end_date=date(2024, 1, 20),
                sort_direction=SortDirection.ASCENDING,
            )
        ),
    )

    extracts, _ = get_extracts(db_session, params)
    assert len(extracts) == 3
    assert extracts[0].created_at == datetime(2024, 1, 15, tzinfo=timezone.utc)


def test_get_extracts_pagination(enable_factory_create, db_session):
    ExtractMetadataFactory.create_batch(3)

    params = ExtractListParams(
        pagination=PaginationParams(
            page_size=2,
            page_offset=1,
            order_by="created_at",
            sort_direction=SortDirection.ASCENDING,
        )
    )

    extracts, pagination_info = get_extracts(db_session, params)
    assert len(extracts) == 2
    assert pagination_info.total_records == 3
    assert pagination_info.total_pages == 2

    # Test second page
    params.pagination.page_offset = 2
    extracts, pagination_info = get_extracts(db_session, params)
    assert len(extracts) == 1


def test_get_extracts_ordering(db_session, enable_factory_create):
    # Create test data with different values for ordering
    extract1 = ExtractMetadataFactory.create(
        extract_type=ExtractType.OPPORTUNITIES_JSON,
        file_name="b_file.json",
        created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )
    extract2 = ExtractMetadataFactory.create(
        extract_type=ExtractType.OPPORTUNITIES_CSV,
        file_name="a_file.csv",
        created_at=datetime(2025, 1, 2, tzinfo=timezone.utc),
    )
    extract3 = ExtractMetadataFactory.create(
        extract_type=ExtractType.OPPORTUNITIES_CSV,
        file_name="c_file.csv",
        created_at=datetime(2025, 1, 3, tzinfo=timezone.utc),
    )

    extracts = [extract1, extract2, extract3]

    # Test ordering by created_at
    params_created_asc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="created_at", sort_direction=SortDirection.ASCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_created_asc, _ = get_extracts(db_session, params_created_asc)
    assert [x.extract_metadata_id for x in results_created_asc] == [
        x.extract_metadata_id for x in sorted(extracts, key=lambda x: x.created_at)
    ]

    params_created_desc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="created_at", sort_direction=SortDirection.DESCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_created_desc, _ = get_extracts(db_session, params_created_desc)
    assert [x.extract_metadata_id for x in results_created_desc] == [
        x.extract_metadata_id for x in sorted(extracts, key=lambda x: x.created_at, reverse=True)
    ]

    # Test ordering by extract_type
    params_type_asc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="extract_type", sort_direction=SortDirection.ASCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_type_asc, _ = get_extracts(db_session, params_type_asc)
    assert results_type_asc[0].extract_type == ExtractType.OPPORTUNITIES_CSV
    assert results_type_asc[-1].extract_type == ExtractType.OPPORTUNITIES_JSON

    params_type_desc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="extract_type", sort_direction=SortDirection.DESCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_type_desc, _ = get_extracts(db_session, params_type_desc)
    assert results_type_desc[-1].extract_type == ExtractType.OPPORTUNITIES_CSV
    assert results_type_desc[0].extract_type == ExtractType.OPPORTUNITIES_JSON

    # Test ordering by file_name
    params_name_asc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="file_name", sort_direction=SortDirection.ASCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_name_asc, _ = get_extracts(db_session, params_name_asc)
    assert [x.file_name for x in results_name_asc] == sorted([x.file_name for x in extracts])

    params_name_desc = ExtractListParams(
        pagination=PaginationParams(
            sort_order=[
                SortOrderParams(order_by="file_name", sort_direction=SortDirection.DESCENDING)
            ],
            page_size=10,
            page_offset=1,
        ),
        filters=ExtractFilters(created_at=DateSearchFilter(start_date=date(2025, 1, 1))),
    )
    results_name_desc, _ = get_extracts(db_session, params_name_desc)
    assert [x.file_name for x in results_name_desc] == sorted(
        [x.file_name for x in extracts], reverse=True
    )
