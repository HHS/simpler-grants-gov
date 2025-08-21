"""Tests for the CommonGrantsOpportunityService."""

from uuid import uuid4

import pytest

from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService


class TestCommonGrantsOpportunityService:
    """Test the CommonGrantsOpportunityService class."""

    @pytest.fixture
    def service(self, db_session):
        """Create a CommonGrantsOpportunityService instance for testing."""
        return CommonGrantsOpportunityService(db_session)

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

    def test_search_opportunities_default(self, service):
        """Test searching opportunities with default parameters."""
        response = service.search_opportunities()

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        assert isinstance(response.items, list)
        assert response.pagination_info.page == 1
        assert response.pagination_info.page_size == 10
        assert response.sort_info.sort_by == "lastModifiedAt"  # Changed from .value
        assert response.sort_info.sort_order == "desc"  # Changed from .value

    def test_search_opportunities_with_custom_pagination(self, service):
        """Test searching opportunities with custom pagination."""
        from common_grants_sdk.schemas import PaginatedBodyParams

        pagination = PaginatedBodyParams(page=2, page_size=5)
        response = service.search_opportunities(pagination=pagination)

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        assert len(response.items) <= 5
        assert response.pagination_info.page == 2
        assert response.pagination_info.page_size == 5

    def test_search_opportunities_with_sorting(self, service):
        """Test searching opportunities with custom sorting."""
        from common_grants_sdk.schemas import OppSorting
        from common_grants_sdk.schemas.sorting import OppSortBy, SortOrder

        sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
        response = service.search_opportunities(sorting=sorting)

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        assert response.sort_info.sort_by == "title"
        assert response.sort_info.sort_order == "asc"

    def test_search_opportunities_with_status_filter(self, service):
        """Test searching opportunities with status filter."""
        from common_grants_sdk.schemas import OppFilters
        from common_grants_sdk.schemas.filters.base import ArrayOperator
        from common_grants_sdk.schemas.filters.string import StringArrayFilter
        from common_grants_sdk.schemas.models.opp_status import OppStatusOptions

        # Fix the status filter format to match the schema requirements
        status_filter = StringArrayFilter(operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN])
        filters = OppFilters(status=status_filter)
        response = service.search_opportunities(filters=filters)

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        # Note: We can't easily verify the filter was applied without checking the actual data

    def test_search_opportunities_with_text_search(self, service):
        """Test searching opportunities with text search."""
        response = service.search_opportunities(search="test")

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        # Note: We can't easily verify the text search was applied without checking the actual data

    def test_search_opportunities_with_all_parameters(self, service):
        """Test searching opportunities with all parameters specified."""
        from common_grants_sdk.schemas import OppFilters, OppSorting, PaginatedBodyParams
        from common_grants_sdk.schemas.filters.base import ArrayOperator
        from common_grants_sdk.schemas.filters.string import StringArrayFilter
        from common_grants_sdk.schemas.models.opp_status import OppStatusOptions
        from common_grants_sdk.schemas.sorting import OppSortBy, SortOrder

        # Fix the status filter format to match the schema requirements
        status_filter = StringArrayFilter(operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN])
        filters = OppFilters(status=status_filter)
        sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
        pagination = PaginatedBodyParams(page=2, page_size=5)

        response = service.search_opportunities(
            filters=filters, sorting=sorting, pagination=pagination, search="test"
        )

        assert response.status == 200
        assert response.message == "Opportunities searched successfully"
        assert response.pagination_info.page == 2
        assert response.pagination_info.page_size == 5
        assert response.sort_info.sort_by == "title"
        assert response.sort_info.sort_order == "asc"
