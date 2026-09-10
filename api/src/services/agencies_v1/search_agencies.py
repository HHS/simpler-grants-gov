import logging
from collections.abc import Sequence

from grants_shared.pagination.pagination_models import (
    PaginationInfo,
    PaginationParams,
    SortDirection,
)
from pydantic import BaseModel, Field

from src.adapters import search
from src.adapters.search.opensearch_response import SearchResponse
from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.api.opportunities_v1.opportunity_schemas import SearchQueryOperator
from src.constants.lookup_constants import OpportunityStatus
from src.search.search_config import get_search_config
from src.search.search_models import BoolSearchFilter, StrSearchFilter
from src.services.agencies_v1.experimental_constant import DEFAULT
from src.services.opportunities_v1.search_opportunities import _adjust_field_name
from src.services.service_utils import _add_search_filters

logger = logging.getLogger(__name__)

SCHEMA = AgencyV1Schema()

AGENCY_REQUEST_FIELD_NAME_MAPPING = {
    "agency_name": "agency_name.keyword",
    "agency_code": "agency_code.keyword",
}


class AgencySearchFilters(BaseModel):
    has_active_opportunity: BoolSearchFilter | None = None
    opportunity_statuses: StrSearchFilter | None = None
    is_test_agency: BoolSearchFilter | None = None


class AgencySearchParams(BaseModel):
    pagination: PaginationParams
    filters: AgencySearchFilters | None = Field(default=None)
    query: str | None = None
    query_operator: str = Field(default=SearchQueryOperator.AND)


def _get_sort_by(pagination: PaginationParams) -> list[tuple[str, SortDirection]]:
    sort_by: list[tuple[str, SortDirection]] = []

    for sort_order in pagination.sort_order:
        sort_by.append(
            (
                _adjust_field_name(sort_order.order_by, AGENCY_REQUEST_FIELD_NAME_MAPPING),
                sort_order.sort_direction,
            )
        )

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
        # A bool prefix query analyzes every term the same way the index did, and treats
        # the final term as a prefix so results narrow as a user types. Combined with the
        # AND operator this means a full agency name like "Department of Energy" matches
        # only that agency, rather than every agency sharing any one of those words.
        #
        # This endpoint only allows sorting by agency code or name, never by relevancy, so
        # the query goes in the filter block to skip scoring entirely and stay cacheable.
        builder.filter_match_bool_prefix(params.query, DEFAULT, params.query_operator)

    # Filters
    if params.filters:
        value = params.filters.has_active_opportunity
        if value and value.one_of and True in value.one_of:
            params.filters.opportunity_statuses = StrSearchFilter(
                one_of=[OpportunityStatus.POSTED, OpportunityStatus.FORECASTED]
            )
        _add_search_filters(builder, AGENCY_REQUEST_FIELD_NAME_MAPPING, params.filters)

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
) -> tuple[Sequence[dict], PaginationInfo]:
    params = AgencySearchParams.model_validate(raw_search_params)
    response = _search_agencies(search_client, params)
    pagination_info = PaginationInfo.from_search_response(params.pagination, response.total_records)

    records = SCHEMA.load(response.records, many=True)

    return records, pagination_info
