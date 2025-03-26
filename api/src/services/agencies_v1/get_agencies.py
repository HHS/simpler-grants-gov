import logging
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import select, Select
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

def _construct_active_query(stmt: Select) -> Select:
    active_agency = (
        select(Agency.agency_id)
        .join(Opportunity, onclause=Agency.agency_code == Opportunity.agency_code)
        .join(CurrentOpportunitySummary)
        .where(Agency.is_test_agency.isnot(True))  # Exclude test agencies
        .where(
            CurrentOpportunitySummary.opportunity_status.in_(
                [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]
            )
        )
    )

    active_top_level_agency = (
        (
            select(Agency.top_level_agency_id)
            .join(Opportunity, onclause=Agency.agency_code == Opportunity.agency_code)
            .join(CurrentOpportunitySummary)
            .where(Agency.is_test_agency.isnot(True))  # Exclude test agencies
            .where(
                CurrentOpportunitySummary.opportunity_status.in_(
                    [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]
                )
            )
        )
        .union(active_agency)
        .subquery()
    )

    agency_id_stmt = select(active_top_level_agency).distinct

    return stmt.where(Agency.agency_id.in_(agency_id_stmt))


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams
) -> Tuple[Sequence[Agency], PaginationInfo]:

    stmt = (
        select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))
        # Exclude test agencies
        .where(Agency.is_test_agency.isnot(True))
    )

    if list_params.filters and list_params.filters.active:
        stmt = _construct_active_query(stmt)

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
