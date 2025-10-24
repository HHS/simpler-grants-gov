import logging
import uuid
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import Select, and_, exists, select
from sqlalchemy.orm import InstrumentedAttribute, joinedload

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    ExcludedOpportunityReview,
    Opportunity,
)
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.service_utils import apply_sorting

logger = logging.getLogger(__name__)


class AgencyFilters(BaseModel):
    agency_id: uuid.UUID | None = None
    agency_name: str | None = None
    active: bool | None = None


class AgencyListParams(BaseModel):
    pagination: PaginationParams
    filters: AgencyFilters | None = Field(default_factory=AgencyFilters)
    query: str | None = None


def _construct_active_inner_query(
    field: InstrumentedAttribute[Any], opportunity_status: list[OpportunityStatus]
) -> Select:
    return (
        select(field)
        .join(Opportunity, onclause=Agency.agency_code == Opportunity.agency_code)
        .join(CurrentOpportunitySummary)
        .where(Agency.is_test_agency.isnot(True))  # Exclude test agencies
        .where(
            CurrentOpportunitySummary.opportunity_status.in_(
                opportunity_status,
            )
        )
        .where(  # Exclude opportunities in review
            ~exists(
                select(ExcludedOpportunityReview.legacy_opportunity_id).where(
                    and_(
                        ExcludedOpportunityReview.legacy_opportunity_id
                        == Opportunity.legacy_opportunity_id,
                        CurrentOpportunitySummary.opportunity_status.in_(opportunity_status),
                    )
                )
            )
        )
    )


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams
) -> tuple[Sequence[Agency], PaginationInfo]:

    stmt = (
        select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))
        # Exclude test agencies
        .where(Agency.is_test_agency.isnot(True))
    )

    if list_params.filters:
        if list_params.filters.active:
            agency_subquery = (
                _construct_active_inner_query(
                    Agency.agency_id, [OpportunityStatus.POSTED, OpportunityStatus.FORECASTED]
                )
                .union(
                    _construct_active_inner_query(
                        Agency.top_level_agency_id,
                        [OpportunityStatus.POSTED, OpportunityStatus.FORECASTED],
                    )
                )
                .subquery()
            )

            agency_id_stmt = select(agency_subquery).distinct()
            stmt = stmt.where(Agency.agency_id.in_(agency_id_stmt))

    # Sort
    stmt = apply_sorting(stmt, Agency, list_params.pagination.sort_order)

    # Apply pagination after processing
    paginator: Paginator[Agency] = Paginator(
        Agency, stmt, db_session, page_size=list_params.pagination.page_size
    )

    paginated_agencies = paginator.page_at(page_offset=list_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(list_params.pagination, paginator)

    return paginated_agencies, pagination_info
