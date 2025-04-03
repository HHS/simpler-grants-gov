import logging
import math
import uuid
from idlelib.searchengine import search_reverse
from typing import Any, Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import Select, select
from sqlalchemy.orm import InstrumentedAttribute, joinedload

import src.adapters.db as db
from src.adapters import search
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortOrder
from src.pagination.paginator import Paginator
from src.search.search_config import get_search_config
from src.services.opportunities_v1.search_opportunities import _get_search_request
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

def _construct_active_inner_query(field: InstrumentedAttribute[Any]) -> Select:
    return (
        select(field)
        .join(Opportunity, onclause=Agency.agency_code == Opportunity.agency_code)
        .join(CurrentOpportunitySummary)
        .where(Agency.is_test_agency.isnot(True))  # Exclude test agencies
        .where(
            CurrentOpportunitySummary.opportunity_status.in_(
                [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]
            )
        )
    )


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams
) -> Tuple[Sequence[Agency], PaginationInfo]:

    stmt = (
        select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))
        # Exclude test agencies
        .where(Agency.is_test_agency.isnot(True))
    )

    if list_params.filters and list_params.filters.active:
        active_agency_subquery = (
            _construct_active_inner_query(Agency.agency_id)
            .union(_construct_active_inner_query(Agency.top_level_agency_id))
            .subquery()
        )

        agency_id_stmt = select(active_agency_subquery).distinct()

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

def _search_agencies(search_client: search.SearchClient, search_params: AgencyListParams) -> Sequence[Agency]:
    search_request = _get_search_request(search_params, aggregation=False)

    index_alias = get_search_config().



def search_agencies(search_client: search.SearchClient, raw_search_params: dict) -> Tuple[Sequence[Agency], PaginationInfo]:
    search_params = AgencyListParams.model_validate(raw_search_params)
    response = _search_agencies(search_client, search_params)

    pagination_info = PaginationInfo(
        page_offset=search_params.pagination.page_offset,
        page_size=search_params.pagination.page_size,
        total_records=response.total_records,
        total_pages=int(math.ceil(response.total_records / search_params.pagination.page_size)),
        sort_order=[
            SortOrder(order_by=p.order_by, sort_direction=p.sort_direction)
            for p in search_params.pagination.sort_order
        ],
    )

    return response, pagination_info



