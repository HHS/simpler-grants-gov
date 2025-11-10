"""Tests for the CommonGrantsOpportunityService."""

from datetime import datetime
from unittest.mock import Mock, patch
from uuid import uuid4

import pytest
from common_grants_sdk.schemas.pydantic import (
    ArrayOperator,
    OppFilters,
    OpportunitySearchRequest,
    OppSortBy,
    OppSorting,
    OppStatusOptions,
    PaginatedBodyParams,
    SortOrder,
    StringArrayFilter,
)

from src.constants.lookup_constants import OpportunityStatus
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
        from sqlalchemy.exc import DataError

        with pytest.raises(DataError):
            CommonGrantsOpportunityService.get_opportunity(db_session, "invalid-uuid")

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
        pagination = PaginatedBodyParams(page=1, page_size=10)
        opportunities, pagination_info = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, pagination
        )

        assert isinstance(opportunities, list)
        assert len(opportunities) <= 10
        assert pagination_info.page == 1
        assert pagination_info.page_size == 10
        assert pagination_info.total_items >= 0

    def test_list_opportunities_custom_pagination(self, service, mock_search_client):
        """Test listing opportunities with custom pagination."""
        pagination = PaginatedBodyParams(page=2, page_size=5)
        opportunities, pagination_info = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, pagination
        )

        assert isinstance(opportunities, list)
        assert len(opportunities) <= 5
        assert pagination_info.page == 2
        assert pagination_info.page_size == 5

    def test_list_opportunities_empty_page(self, service, mock_search_client):
        """Test listing opportunities with a page that has no results."""
        pagination = PaginatedBodyParams(page=999, page_size=10)
        opportunities, pagination_info = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, pagination
        )

        assert isinstance(opportunities, list)
        assert len(opportunities) == 0
        assert pagination_info.page == 999

    def test_search_opportunities_default(self, mock_search_client):
        """Test searching opportunities with default parameters."""
        # Mock the search_opportunities function from opportunities_v1
        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            # Mock the return values
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            search_request = OpportunitySearchRequest()
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            assert pagination_info.page == 1
            assert pagination_info.page_size == 10

    def test_search_opportunities_with_custom_pagination(self, mock_search_client):
        """Test searching opportunities with custom pagination."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 2
            mock_pagination.page_size = 5
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            pagination = PaginatedBodyParams(page=2, page_size=5)
            search_request = OpportunitySearchRequest(pagination=pagination)
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            assert pagination_info.page == 2
            assert pagination_info.page_size == 5

    def test_search_opportunities_with_sorting(self, mock_search_client):
        """Test searching opportunities with custom sorting."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
            search_request = OpportunitySearchRequest(sorting=sorting)
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            # Note: We can't easily verify the sorting was applied without checking the actual data

    def test_search_opportunities_with_status_filter(self, mock_search_client):
        """Test searching opportunities with status filter."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            # Fix the status filter format to match the schema requirements
            status_filter = StringArrayFilter(
                operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN]
            )
            filters = OppFilters(status=status_filter)
            search_request = OpportunitySearchRequest(filters=filters)
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            # Note: We can't easily verify the filter was applied without checking the actual data

    def test_search_opportunities_with_text_search(self, mock_search_client):
        """Test searching opportunities with text search."""
        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            search_request = OpportunitySearchRequest(search="test")
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            # Note: We can't easily verify the text search was applied without checking the actual data

    def test_search_opportunities_with_all_parameters(self, mock_search_client):
        """Test searching opportunities with all parameters specified."""

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 2
            mock_pagination.page_size = 5
            mock_pagination.total_records = 0
            mock_pagination.total_pages = 0
            mock_search.return_value = ([], {}, mock_pagination)

            # Fix the status filter format to match the schema requirements
            status_filter = StringArrayFilter(
                operator=ArrayOperator.IN, value=[OppStatusOptions.OPEN]
            )
            filters = OppFilters(status=status_filter)
            sorting = OppSorting(sort_by=OppSortBy.TITLE, sort_order=SortOrder.ASC)
            pagination = PaginatedBodyParams(page=2, page_size=5)

            search_request = OpportunitySearchRequest(
                filters=filters,
                sorting=sorting,
                pagination=pagination,
                search="test",
            )
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            assert isinstance(opportunities, list)
            assert pagination_info.page == 2
            assert pagination_info.page_size == 5
            # Note: We can't easily verify the sorting and filters were applied without checking the actual data

    def test_list_opportunities_total_pages_calculation(self, service, mock_search_client):
        """Test that total pages calculation is correct."""
        pagination = PaginatedBodyParams(page=1, page_size=3)
        opportunities, pagination_info = CommonGrantsOpportunityService.list_opportunities(
            mock_search_client, pagination
        )

        assert isinstance(opportunities, list)
        assert pagination_info.page == 1
        assert pagination_info.page_size == 3
        # Verify totalPages is calculated correctly
        expected_total_pages = (pagination_info.total_items + 3 - 1) // 3
        assert pagination_info.total_pages == expected_total_pages

    def test_search_opportunities_filters_invalid_data(self, mock_search_client, caplog):
        """Test that search_opportunities filters out invalid data while keeping valid data."""
        import logging

        caplog.set_level(logging.WARNING)

        # Create a mix of valid and invalid opportunity data
        valid_opp_1 = {
            "opportunity_id": uuid4(),
            "opportunity_title": "Valid Opportunity 1",
            "opportunity_status": OpportunityStatus.POSTED,
            "created_at": datetime(2024, 1, 1, 12, 0, 0),
            "updated_at": datetime(2024, 1, 2, 12, 0, 0),
            "summary": {
                "summary_description": "Valid description",
                "post_date": None,
                "close_date": None,
                "estimated_total_program_funding": None,
                "award_ceiling": None,
                "award_floor": None,
                "additional_info_url": None,
            },
        }

        valid_opp_2 = {
            "opportunity_id": uuid4(),
            "opportunity_title": "Valid Opportunity 2",
            "opportunity_status": OpportunityStatus.CLOSED,
            "created_at": datetime(2024, 2, 1, 12, 0, 0),
            "updated_at": datetime(2024, 2, 2, 12, 0, 0),
            "summary": {
                "summary_description": "Another valid description",
                "post_date": None,
                "close_date": None,
                "estimated_total_program_funding": None,
                "award_ceiling": None,
                "award_floor": None,
                "additional_info_url": None,
            },
        }

        # Invalid opportunity data that will fail transformation
        invalid_opp = {
            "opportunity_id": "not-a-valid-uuid",  # This will cause transformation to fail
            "invalid_field": "invalid_value",
        }

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 3  # Total includes invalid data
            mock_pagination.total_pages = 1

            # Return mix of valid and invalid data
            mock_search.return_value = (
                [valid_opp_1, invalid_opp, valid_opp_2],
                {},
                mock_pagination,
            )

            search_request = OpportunitySearchRequest()
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            # Verify that only valid opportunities are in the result
            assert len(opportunities) == 2
            assert opportunities[0].title == "Valid Opportunity 1"
            assert opportunities[1].title == "Valid Opportunity 2"

            # Verify that pagination still reflects the original total
            assert pagination_info.total_items == 3

            # Verify that transformation failure was logged
            assert any(
                record.levelname == "WARNING"
                and "Failed to transform search result to CommonGrants format:" in record.message
                for record in caplog.records
            )

    def test_list_opportunities_filters_invalid_data(self, mock_search_client, caplog):
        """Test that list_opportunities filters out invalid data while keeping valid data."""
        import logging

        caplog.set_level(logging.WARNING)

        # Create a mix of valid and invalid opportunity data
        valid_opp = {
            "opportunity_id": uuid4(),
            "opportunity_title": "Valid Opportunity",
            "opportunity_status": OpportunityStatus.POSTED,
            "created_at": datetime(2024, 1, 1, 12, 0, 0),
            "updated_at": datetime(2024, 1, 2, 12, 0, 0),
            "summary": {
                "summary_description": "Valid description",
                "post_date": None,
                "close_date": None,
                "estimated_total_program_funding": None,
                "award_ceiling": None,
                "award_floor": None,
                "additional_info_url": None,
            },
        }

        # Invalid opportunity data
        invalid_opp = {
            "opportunity_id": "not-a-uuid",
            "invalid_field": "invalid_value",
        }

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 2
            mock_pagination.total_pages = 1

            # Return mix of valid and invalid data
            mock_search.return_value = ([valid_opp, invalid_opp], {}, mock_pagination)

            pagination = PaginatedBodyParams(page=1, page_size=10)
            opportunities, pagination_info = CommonGrantsOpportunityService.list_opportunities(
                mock_search_client, pagination
            )

            # Verify that only valid opportunities are in the result
            assert len(opportunities) == 1
            assert opportunities[0].title == "Valid Opportunity"

            # Verify that transformation failure was logged
            assert any(
                record.levelname == "WARNING"
                and "Failed to transform search result to CommonGrants format:" in record.message
                for record in caplog.records
            )

    def test_search_opportunities_all_invalid_data(self, mock_search_client, caplog):
        """Test that search_opportunities returns empty list when all data is invalid."""
        import logging

        caplog.set_level(logging.WARNING)

        # Create only invalid opportunity data
        invalid_opp_1 = {"opportunity_id": "not-a-uuid-1", "invalid_field": "invalid_value"}
        invalid_opp_2 = {"opportunity_id": "not-a-uuid-2", "invalid_field": "invalid_value"}

        with patch(
            "src.services.common_grants.opportunity_service.search_opportunities"
        ) as mock_search:
            mock_pagination = Mock()
            mock_pagination.page_offset = 1
            mock_pagination.page_size = 10
            mock_pagination.total_records = 2
            mock_pagination.total_pages = 1

            # Return only invalid data
            mock_search.return_value = ([invalid_opp_1, invalid_opp_2], {}, mock_pagination)

            search_request = OpportunitySearchRequest()
            opportunities, pagination_info = CommonGrantsOpportunityService.search_opportunities(
                mock_search_client, search_request
            )

            # Verify that result is empty
            assert len(opportunities) == 0

            # Verify that pagination still reflects the original total
            assert pagination_info.total_items == 2

            # Verify that transformation failures were logged (should be 2)
            warning_logs = [
                record
                for record in caplog.records
                if record.levelname == "WARNING"
                and "Failed to transform search result to CommonGrants format:" in record.message
            ]
            assert len(warning_logs) == 2
