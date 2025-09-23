"""Tests for the CommonGrantsOpportunityService."""

from unittest.mock import Mock, patch
from uuid import uuid4

import pytest
from common_grants_sdk.schemas.pydantic import (
    ArrayOperator,
    OppFilters,
    OppSortBy,
    OppSorting,
    OppStatusOptions,
    PaginatedBodyParams,
    SortOrder,
    StringArrayFilter,
)

from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService


class TestCommonGrantsOpportunityService:
    """Test the CommonGrantsOpportunityService class."""

    @pytest.fixture
    def service(self, db_session):
        """Create a CommonGrantsOpportunityService instance for testing."""
        return CommonGrantsOpportunityService()

    @pytest.fixture
    def mock_search_client(self):
        """Create a mock search client for testing."""
        mock_client = Mock()
        # Mock the search response structure
        mock_response = Mock()
        mock_response.total_records = 0
        mock_response.total_pages = 0
        mock_response.records = []  # Empty list of records
        mock_client.search.return_value = mock_response
        return mock_client

    def test_service_initialization(self, service):
        """Test that the service initializes correctly."""
        assert service is not None

    def test_get_opportunity_invalid_uuid(self, service, db_session):
        """Test getting an opportunity with an invalid UUID."""
        result = CommonGrantsOpportunityService.get_opportunity(db_session, "invalid-uuid")
        assert result is None

    def test_get_opportunity_nonexistent_id(self, service, db_session):
        """Test getting an opportunity with a valid UUID that doesn't exist."""
        # The service raises an HTTPError when opportunity is not found
        from apiflask.exceptions import HTTPError

        with pytest.raises(HTTPError):
            CommonGrantsOpportunityService.get_opportunity(db_session, str(uuid4()))

    def test_get_opportunity_success(self, service, db_session):
        """Test getting an opportunity successfully."""
        # This test would require creating test data in the database
        # For now, we'll test the structure without actual data
        # In a real test environment, you'd create an opportunity record first
        pass

    def test_list_opportunities_default_pagination(self, service, mock_search_client):
        """Test listing opportunities with default pagination."""
        response = CommonGrantsOpportunityService.list_opportunities(mock_search_client)

        assert response["status"] == 200
        assert response["message"] == "Opportunities fetched successfully"
        assert len(response["items"]) <= 10
        assert response["paginationInfo"]["page"] == 1
        assert response["paginationInfo"]["pageSize"] == 10
        assert response["paginationInfo"]["totalItems"] >= 0

    def test_list_opportunities_custom_pagination(self, service, mock_search_client):
        """Test listing opportunities with custom pagination."""
        response = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, page=2, page_size=5
        )

        assert response["status"] == 200
        assert response["message"] == "Opportunities fetched successfully"
        assert len(response["items"]) <= 5
        assert response["paginationInfo"]["page"] == 2
        assert response["paginationInfo"]["pageSize"] == 5

    def test_list_opportunities_empty_page(self, service, mock_search_client):
        """Test listing opportunities with a page that has no results."""
        response = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, page=999, page_size=10
        )

        assert response["status"] == 200
        assert response["message"] == "Opportunities fetched successfully"
        assert len(response["items"]) == 0
        assert response["paginationInfo"]["page"] == 999

    def test_search_opportunities_default(self, mock_search_client):
        """Test searching opportunities with default parameters."""
        # Mock the search_opportunities function from opportunities_v1
        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            # Mock the return values
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            response = CommonGrantsOpportunityService.search_opportunities(mock_search_client)

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
            assert isinstance(response["items"], list)
            assert response["paginationInfo"]["page"] == 1
            assert response["paginationInfo"]["pageSize"] == 10
            assert response["sortInfo"]["sortBy"] == "lastModifiedAt"
            assert response["sortInfo"]["sortOrder"] == "desc"

    def test_search_opportunities_with_custom_pagination(self, mock_search_client):
        """Test searching opportunities with custom pagination."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            pagination = PaginatedBodyParams(page=2, page_size=5)
            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, pagination=pagination
            )

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
            assert response["paginationInfo"]["page"] == 2
            assert response["paginationInfo"]["pageSize"] == 5

    def test_search_opportunities_with_sorting(self, mock_search_client):
        """Test searching opportunities with custom sorting."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_search.return_value = ([], {}, Mock(total_records=0, total_pages=0))

            sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
            response = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, sorting=sorting
            )

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
            assert response["sortInfo"]["sortBy"] == "title"
            assert response["sortInfo"]["sortOrder"] == "asc"

    def test_search_opportunities_with_status_filter(self, mock_search_client):
        """Test searching opportunities with status filter."""

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

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
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

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
            # Note: We can't easily verify the text search was applied without checking the actual data

    def test_search_opportunities_with_all_parameters(self, mock_search_client):
        """Test searching opportunities with all parameters specified."""

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

            assert response["status"] == 200
            assert response["message"] == "Opportunities searched successfully using search client"
            assert response["paginationInfo"]["page"] == 2
            assert response["paginationInfo"]["pageSize"] == 5
            assert response["sortInfo"]["sortBy"] == "title"
            assert response["sortInfo"]["sortOrder"] == "asc"
            # Verify filterInfo is included in response
            assert "filterInfo" in response

    def test_list_opportunities_total_pages_calculation(self, service, mock_search_client):
        """Test that total pages calculation is correct."""
        response = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, page=1, page_size=3
        )

        assert response["status"] == 200
        assert response["paginationInfo"]["page"] == 1
        assert response["paginationInfo"]["pageSize"] == 3
        # Verify totalPages is calculated correctly
        expected_total_pages = (response["paginationInfo"]["totalItems"] + 3 - 1) // 3
        assert response["paginationInfo"]["totalPages"] == expected_total_pages
