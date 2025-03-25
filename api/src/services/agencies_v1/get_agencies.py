import logging
import pdb
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.db.models.agency_models import Agency
from src.db.models.lookup_models import LkOpportunityCategory, LkOpportunityStatus
from src.db.models.opportunity_models import Opportunity, CurrentOpportunitySummary
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.service_utils import apply_sorting

logger = logging.getLogger(__name__)


class AgencyFilters(BaseModel):
    agency_id: int | None = None
    agency_name: str | None = None


class AgencyListParams(BaseModel):
    pagination: PaginationParams

    filters: AgencyFilters | None = Field(default_factory=AgencyFilters)


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams, active: bool | None = None
) -> Tuple[Sequence[Agency], PaginationInfo]:

    import pdb; pdb.set_trace()

    stmt = (
    select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))
    # Exclude test agencies
    .where(Agency.is_test_agency.isnot(True))
    )

    if active:
        stmt = (
            select(Agency)
            .join(Opportunity, onclause=Agency.agency_code==Opportunity.agency_code)
            .join(CurrentOpportunitySummary)
            .join(LkOpportunityStatus)
            .where(Agency.is_test_agency.isnot(True)) # Exclude test agencies
            .where(LkOpportunityStatus.opportunity_status_id.in_([1,2])) # Opportunities associated with posted or forecasted status
            .options(joinedload(Agency.top_level_agency), joinedload("*"))
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
