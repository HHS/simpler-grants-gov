"""Tests for the CommonGrantsOpportunityService."""

from unittest.mock import Mock, patch
from uuid import uuid4

import pytest

from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService


class TestCommonGrantsOpportunityService:
    """Test the CommonGrantsOpportunityService class."""

    @pytest.fixture
    def service(self, db_session):
        """Create a CommonGrantsOpportunityService instance for testing."""
        return CommonGrantsOpportunityService(db_session)

    @pytest.fixture
    def mock_search_client(self):
        """Create a mock search client for testing."""
        return Mock()

    def test_service_initialization(self, service):
        """Test that the service initializes correctly."""
        assert service.db_session is not None

    def test_get_opportunity_invalid_uuid(self, service):
        """Test getting an opportunity with an invalid UUID."""
        result = service.get_opportunity("invalid-uuid")
        assert result is None

    def test_get_opportunity_nonexistent_id(self, service):
        """Test getting an opportunity with a valid UUID that doesn't exist."""
        result = service.get_opportunity(str(uuid4()))
        assert result is None

    def test_get_opportunity_success(self, service, db_session):
        """Test getting an opportunity successfully."""
        # This test would require creating test data in the database
        # For now, we'll test the structure without actual data
        # In a real test environment, you'd create an opportunity record first
        pass

    def test_list_opportunities_default_pagination(self, service):
        """Test listing opportunities with default pagination."""
        response = service.list_opportunities()

        assert response.status == 200
        assert response.message == "Opportunities fetched successfully"
        assert len(response.items) <= 10
        assert response.pagination_info.page == 1
        assert response.pagination_info.page_size == 10
        assert response.pagination_info.total_items >= 0

    def test_list_opportunities_custom_pagination(self, service):
        """Test listing opportunities with custom pagination."""
        response = service.list_opportunities(page=2, page_size=5)

        assert response.status == 200
        assert response.message == "Opportunities fetched successfully"
        assert len(response.items) <= 5
        assert response.pagination_info.page == 2
        assert response.pagination_info.page_size == 5

    def test_list_opportunities_empty_page(self, service):
        """Test listing opportunities with a page that has no results."""
        response = service.list_opportunities(page=999, page_size=10)

        assert response.status == 200
        assert response.message == "Opportunities fetched successfully"
        assert len(response.items) == 0
        assert response.pagination_info.page == 999

    def test_search_opportunities_default(self, mock_search_client):
        """Test searching opportunities with default parameters."""
        # Mock the search_opportunities function from opportunities_v1
        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            # Mock the return values
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            response = CommonGrantsOpportunityService.search_opportunities(mock_search_client)

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            assert isinstance(response.items, list)
            assert response.pagination_info.page == 1
            assert response.pagination_info.page_size == 10
            assert response.sort_info.sort_by == "lastModifiedAt"
            assert response.sort_info.sort_order == "desc"

    def test_search_opportunities_with_custom_pagination(self, mock_search_client):
        """Test searching opportunities with custom pagination."""
        from common_grants_sdk.schemas.pydantic import PaginatedBodyParams

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            pagination = PaginatedBodyParams(page=2, page_size=5)
            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, pagination=pagination
            )

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            assert response.pagination_info.page == 2
            assert response.pagination_info.page_size == 5

    def test_search_opportunities_with_sorting(self, mock_search_client):
        """Test searching opportunities with custom sorting."""
        from common_grants_sdk.schemas.pydantic import OppSorting
        from common_grants_sdk.schemas.pydantic.sorting import OppSortBy, SortOrder

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, sorting=sorting
            )

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            assert response.sort_info.sort_by == "title"
            assert response.sort_info.sort_order == "asc"

    def test_search_opportunities_with_status_filter(self, mock_search_client):
        """Test searching opportunities with status filter."""
        from common_grants_sdk.schemas.pydantic import OppFilters
        from common_grants_sdk.schemas.pydantic.filters import ArrayOperator, StringArrayFilter
        from common_grants_sdk.schemas.pydantic.models import OppStatusOptions

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            # Fix the status filter format to match the schema requirements
            status_filter = StringArrayFilter(
                operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN]
            )
            filters = OppFilters(status=status_filter)
            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, filters=filters
            )

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            # Note: We can't easily verify the filter was applied without checking the actual data

    def test_search_opportunities_with_text_search(self, mock_search_client):
        """Test searching opportunities with text search."""
        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_query="test"
            )

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            # Note: We can't easily verify the text search was applied without checking the actual data

    def test_search_opportunities_with_all_parameters(self, mock_search_client):
        """Test searching opportunities with all parameters specified."""
        from common_grants_sdk.schemas.pydantic import OppFilters, OppSorting, PaginatedBodyParams
        from common_grants_sdk.schemas.pydantic.filters import ArrayOperator, StringArrayFilter
        from common_grants_sdk.schemas.pydantic.models import OppStatusOptions
        from common_grants_sdk.schemas.pydantic.sorting import OppSortBy, SortOrder

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            # Fix the status filter format to match the schema requirements
            status_filter = StringArrayFilter(
                operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN]
            )
            filters = OppFilters(status=status_filter)
            sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
            pagination = PaginatedBodyParams(page=2, page_size=5)

            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client,
                filters=filters,
                sorting=sorting,
                pagination=pagination,
                search_query="test",
            )

            assert response.status == 200
            assert response.message == "Opportunities searched successfully using search client"
            assert response.pagination_info.page == 2
            assert response.pagination_info.page_size == 5
            assert response.sort_info.sort_by == "title"
            assert response.sort_info.sort_order == "asc"
            # Verify filter_info is included in response
            assert hasattr(response, "filter_info")

    def test_list_opportunities_total_pages_calculation(self, service):
        """Test that total pages calculation is correct."""
        response = service.list_opportunities(page=1, page_size=3)

        assert response.status == 200
        assert response.pagination_info.page == 1
        assert response.pagination_info.page_size == 3
        # Verify totalPages is calculated correctly
        expected_total_pages = (response.pagination_info.total_items + 3 - 1) // 3
        assert response.pagination_info.total_pages == expected_total_pages
