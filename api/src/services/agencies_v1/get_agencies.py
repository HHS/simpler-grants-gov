import logging
import math
import uuid
from typing import Any, Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import Select, select
from sqlalchemy.orm import InstrumentedAttribute, joinedload

import src.adapters.db as db
from src.adapters import search
from src.adapters.search.opensearch_response import SearchResponse
from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.api.opportunities_v1.opportunity_schemas import SearchQueryOperator
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.pagination.pagination_models import (
    PaginationInfo,
    PaginationParams,
    SortDirection,
    SortOrder,
)
from src.pagination.paginator import Paginator
from src.search.search_config import get_search_config
from src.search.search_models import BoolSearchFilter
from src.services.agencies_v1.experimental_constant import DEFAULT
from src.services.opportunities_v1.search_opportunities import _adjust_field_name
from src.services.service_utils import _add_search_filters, apply_sorting

logger = logging.getLogger(__name__)

SCHEMA = AgencyV1Schema()


class AgencyFilters(BaseModel):
    agency_id: uuid.UUID | None = None
    agency_name: str | None = None
    active: bool | None = None


class AgencyListParams(BaseModel):
    pagination: PaginationParams
    filters: AgencyFilters | None = Field(default_factory=AgencyFilters)
    query: str | None = None


class AgencySearchFilters(BaseModel):
    active: BoolSearchFilter | None = None


class AgencySearchParams(BaseModel):
    pagination: PaginationParams
    filters: AgencySearchFilters | None = Field(default=None)
    query: str | None = None
    query_operator: str = Field(default=SearchQueryOperator.OR)


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


def _get_sort_by(pagination: PaginationParams) -> list[tuple[str, SortDirection]]:
    sort_by: list[tuple[str, SortDirection]] = []

    for sort_order in pagination.sort_order:
        sort_by.append((_adjust_field_name(sort_order.order_by), sort_order.sort_direction))

    return sort_by


def get_search_request(params: AgencySearchParams) -> dict:
    builder = search.SearchQueryBuilder()

    # Pagination
    builder.pagination(
        page_size=params.pagination.page_size, page_number=params.pagination.page_offset
    )

    # Sorting
    builder.sort_by(_get_sort_by(params.pagination))

    # Query
    if params.query:
        filter_rule = DEFAULT
        builder.simple_query(params.query, filter_rule, SearchQueryOperator.OR)

    # Filters
    if params.filters:
        _add_search_filters(builder, params.filters)

    return builder.build()


def _search_agencies(
    search_client: search.SearchClient, search_params: AgencySearchParams
) -> SearchResponse:
    search_request = get_search_request(search_params)

    index_alias = get_search_config().agency_search_index_alias
    logger.info(
        "Querying search index alias %s", index_alias, extra={"search_index_alias": index_alias}
    )

    response = search_client.search(index_alias, search_request)

    return response


def search_agencies(
    search_client: search.SearchClient, raw_search_params: dict
) -> Tuple[Sequence[dict], PaginationInfo]:

    params = AgencySearchParams.model_validate(raw_search_params)
    response = _search_agencies(search_client, params)
    pagination_info = PaginationInfo(
        page_offset=params.pagination.page_offset,
        page_size=params.pagination.page_size,
        total_records=response.total_records,
        total_pages=int(math.ceil(response.total_records / params.pagination.page_size)),
        sort_order=[
            SortOrder(order_by=p.order_by, sort_direction=p.sort_direction)
            for p in params.pagination.sort_order
        ],
    )

    records = SCHEMA.load(response.records, many=True)

    return records, pagination_info
