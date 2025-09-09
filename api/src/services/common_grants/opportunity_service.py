"""CommonGrants Protocol opportunity service."""

import logging
from uuid import UUID

from common_grants_sdk.schemas.pydantic import (
    FilterInfo,
    OppFilters,
    OpportunitiesListResponse,
    OpportunitiesSearchResponse,
    OpportunityResponse,
    OppSortBy,
    OppSorting,
    OppStatusOptions,
    PaginatedBodyParams,
    PaginatedResultsInfo,
    SortedResultsInfo,
)
from sqlalchemy.orm import Session, selectinload

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity

from .transformation import transform_opportunity_to_common_grants

logger = logging.getLogger(__name__)


class CommonGrantsOpportunityService:
    """Service for managing opportunities in CommonGrants Protocol format."""

    # Mapping from CommonGrants SDK status options to database status enums
    STATUS_MAPPING = {
        OppStatusOptions.FORECASTED: OpportunityStatus.FORECASTED,
        OppStatusOptions.OPEN: OpportunityStatus.POSTED,
        OppStatusOptions.CLOSED: OpportunityStatus.CLOSED,
        OppStatusOptions.CUSTOM: OpportunityStatus.ARCHIVED,
    }

    def __init__(self, db_session: Session) -> None:
        """Initialize the service."""
        self.db_session = db_session

    def get_opportunity(self, opportunity_id: str) -> OpportunityResponse | None:
        """Get a specific opportunity by ID."""
        try:
            opportunity_uuid = UUID(opportunity_id)
            opportunity = (
                self.db_session.query(Opportunity)
                .filter(
                    Opportunity.opportunity_id == opportunity_uuid, Opportunity.is_draft.is_(False)
                )
                .options(
                    selectinload(Opportunity.current_opportunity_summary).selectinload(
                        CurrentOpportunitySummary.opportunity_summary
                    )
                )
                .first()
            )

            if not opportunity:
                return None

            opportunity_data = transform_opportunity_to_common_grants(opportunity)

            return OpportunityResponse(
                status=200,
                message="Success",
                data=opportunity_data,
            )
        except ValueError:
            return None

    def list_opportunities(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> OpportunitiesListResponse:
        """Get a paginated list of opportunities."""
        # Get total count (excluding drafts)
        total_count = (
            self.db_session.query(Opportunity).filter(Opportunity.is_draft.is_(False)).count()
        )

        # Get paginated opportunities (excluding drafts)
        opportunities = (
            self.db_session.query(Opportunity)
            .filter(Opportunity.is_draft.is_(False))
            .options(
                selectinload(Opportunity.current_opportunity_summary).selectinload(
                    CurrentOpportunitySummary.opportunity_summary
                )
            )
            .order_by(Opportunity.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # Transform to CommonGrants format
        opportunities_data = [transform_opportunity_to_common_grants(opp) for opp in opportunities]

        pagination_info = PaginatedResultsInfo(
            page=page,
            page_size=page_size,
            totalItems=total_count,
            totalPages=(total_count + page_size - 1) // page_size,
        )

        return OpportunitiesListResponse(
            status=200,
            message="Opportunities fetched successfully",
            items=opportunities_data,
            pagination_info=pagination_info,
        )

    def search_opportunities(
        self,
        filters: OppFilters | None = None,
        sorting: OppSorting | None = None,
        pagination: PaginatedBodyParams | None = None,
        search: str | None = None,
    ) -> OpportunitiesSearchResponse:
        """Search for opportunities based on the provided filters."""
        # Use default values if not provided
        if filters is None:
            filters = OppFilters()
        if sorting is None:
            sorting = OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)
        if pagination is None:
            pagination = PaginatedBodyParams()

        # Build search query
        query = self.db_session.query(Opportunity)

        # Apply search text
        if search:
            query = query.filter(Opportunity.opportunity_title.ilike(f"%{search}%"))

        # Apply status filter
        if filters.status and filters.status.value:
            # Handle the first status value from the array
            status_value = filters.status.value[0] if filters.status.value else None
            db_status_enum = self.STATUS_MAPPING.get(status_value)

            if db_status_enum:
                query = query.join(CurrentOpportunitySummary).filter(
                    CurrentOpportunitySummary.opportunity_status == db_status_enum
                )

        # Apply sorting
        if sorting.sort_by == OppSortBy.LAST_MODIFIED_AT:
            query = query.order_by(Opportunity.updated_at.desc())
        elif sorting.sort_by == OppSortBy.TITLE:
            query = query.order_by(Opportunity.opportunity_title.asc())
        elif sorting.sort_by == OppSortBy.CLOSE_DATE:
            query = query.order_by(
                Opportunity.current_opportunity_summary.opportunity_summary.close_date.asc()
            )

        # Apply pagination
        total_count = query.count()
        opportunities = (
            query.offset((pagination.page - 1) * pagination.page_size)
            .limit(pagination.page_size)
            .all()
        )

        # Transform to CommonGrants format
        items = [transform_opportunity_to_common_grants(opp) for opp in opportunities]

        # Build response
        pagination_info = PaginatedResultsInfo(
            page=pagination.page,
            page_size=pagination.page_size,
            totalItems=total_count,
            totalPages=(total_count + pagination.page_size - 1) // pagination.page_size,
        )

        sorted_info = SortedResultsInfo(
            sort_by=sorting.sort_by.value,  # Convert enum to string
            sort_order=sorting.sort_order,
            errors=[],
        )

        # Build applied filters using the utility function pattern
        applied_filters = {}
        if filters:
            if filters.status is not None:
                applied_filters["status"] = filters.status.model_dump()
            if filters.close_date_range is not None:
                applied_filters["closeDateRange"] = filters.close_date_range.model_dump()
            if filters.total_funding_available_range is not None:
                applied_filters["totalFundingAvailableRange"] = (
                    filters.total_funding_available_range.model_dump()
                )
            if filters.min_award_amount_range is not None:
                applied_filters["minAwardAmountRange"] = filters.min_award_amount_range.model_dump()
            if filters.max_award_amount_range is not None:
                applied_filters["maxAwardAmountRange"] = filters.max_award_amount_range.model_dump()
            if filters.custom_filters is not None:
                applied_filters["customFilters"] = filters.custom_filters

        filter_info = FilterInfo(
            filters=applied_filters,
            errors=[],
        )

        return OpportunitiesSearchResponse(
            status=200,
            message="Opportunities searched successfully",
            items=items,
            pagination_info=pagination_info,
            sort_info=sorted_info,
            filter_info=filter_info,
        )
