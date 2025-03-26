import logging
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.service_utils import apply_sorting

logger = logging.getLogger(__name__)


class AgencyFilters(BaseModel):
    agency_id: int | None = None
    agency_name: str | None = None
    active: bool | None = None


class AgencyListParams(BaseModel):
    pagination: PaginationParams

    filters: AgencyFilters | None = Field(default_factory=AgencyFilters)


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams
) -> Tuple[Sequence[Agency], PaginationInfo]:

    stmt = (
        select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))
        # Exclude test agencies
        .where(Agency.is_test_agency.isnot(True))
    )

    if list_params.filters.active:
        active_stmt = (
            select(Agency.agency_id, Agency.top_level_agency_id)
            .join(Opportunity, onclause=Agency.agency_code == Opportunity.agency_code)
            .join(CurrentOpportunitySummary)
            .where(Agency.is_test_agency.isnot(True))  # Exclude test agencies
            .where(
                CurrentOpportunitySummary.opportunity_status.in_(
                    [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]
                )
            )
        ).alias('active')

        stmt =  (
            stmt
            .join(active_stmt,
                  (Agency.agency_id == active_stmt.c.top_level_agency_id) |
                  (Agency.agency_id == active_stmt.c.agency_id))
            .distinct()

        )

    stmt = apply_sorting(stmt, Agency, list_params.pagination.sort_order)

    if list_params.filters:
        if list_params.filters.agency_name:
            stmt = stmt.where(Agency.agency_name == list_params.filters.agency_name)

    # Apply pagination after processing
    paginator: Paginator[Agency] = Paginator(
        Agency, stmt, db_session, page_size=list_params.pagination.page_size
    )

    paginated_agencies = paginator.page_at(page_offset=list_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(list_params.pagination, paginator)

    return paginated_agencies, pagination_info
