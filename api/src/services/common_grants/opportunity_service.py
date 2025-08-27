"""CommonGrants Protocol opportunity service."""

import logging
from uuid import UUID

from common_grants_sdk.schemas import (
    FilterInfo,
    OppFilters,
    OpportunitiesListResponse,
    OpportunitiesSearchResponse,
    OpportunityBase,
    PaginatedBodyParams,
    PaginatedResultsInfo,
    SortedResultsInfo,
)
from common_grants_sdk.schemas.pydantic.sorting import OppSortBy, OppSorting
from sqlalchemy.orm import Session, selectinload

from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity

from .transformation import transform_opportunity_to_common_grants

logger = logging.getLogger(__name__)


class CommonGrantsOpportunityService:
    """Service for managing opportunities in CommonGrants Protocol format."""

    def __init__(self, db_session: Session) -> None:
        """Initialize the service."""
        self.db_session = db_session

    def get_opportunity(self, opportunity_id: str) -> OpportunityBase | None:
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

            return transform_opportunity_to_common_grants(opportunity)
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

        # Build search query using existing search functionality
        # This is a simplified approach - in practice, you'd want to map
        # CommonGrants filters to the existing search system
        query = self.db_session.query(Opportunity)

        # Apply search text if provided
        if search:
            query = query.filter(Opportunity.opportunity_title.ilike(f"%{search}%"))

        # Apply status filter if provided
        if filters.status and filters.status.value:
            from common_grants_sdk.schemas.pydantic.models import OppStatusOptions

            status_mapping = {
                OppStatusOptions.FORECASTED: "forecasted",
                OppStatusOptions.OPEN: "posted",
                OppStatusOptions.CLOSED: "closed",
                OppStatusOptions.CUSTOM: "archived",
            }

            # Handle the first status value from the array
            status_value = filters.status.value[0] if filters.status.value else None
            db_status = status_mapping.get(status_value)
            if db_status:
                from src.constants.lookup_constants import OpportunityStatus

                # Map the string back to the enum
                status_enum = None
                if db_status == "forecasted":
                    status_enum = OpportunityStatus.FORECASTED
                elif db_status == "posted":
                    status_enum = OpportunityStatus.POSTED
                elif db_status == "closed":
                    status_enum = OpportunityStatus.CLOSED
                elif db_status == "archived":
                    status_enum = OpportunityStatus.ARCHIVED

                if status_enum:
                    query = query.join(CurrentOpportunitySummary).filter(
                        CurrentOpportunitySummary.opportunity_status == status_enum
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
            sort_by=sorting.sort_by,
            sort_order=sorting.sort_order,
        )

        filter_info = FilterInfo(
            filters=filters.model_dump() if filters else {},
        )

        return OpportunitiesSearchResponse(
            status=200,
            message="Opportunities searched successfully",
            items=items,
            pagination_info=pagination_info,
            sort_info=sorted_info,
            filter_info=filter_info,
        )
