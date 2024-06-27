import logging
import math
from typing import Sequence, Tuple

from pydantic import BaseModel, Field

import src.adapters.search as search
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.search.search_config import get_search_config

logger = logging.getLogger(__name__)

# To assist with mapping field names from our API requests
# to what they are called in the search index, this mapping
# can be used. Note that in many cases its just adjusting paths
# or for text based fields adding ".keyword" to the end to tell
# the query we want to use the raw value rather than the tokenized one
# See: https://opensearch.org/docs/latest/field-types/supported-field-types/keyword/
REQUEST_FIELD_NAME_MAPPING = {
    "opportunity_number": "opportunity_number.keyword",
    "opportunity_title": "opportunity_title.keyword",
    "post_date": "summary.post_date",
    "close_date": "summary.close_date",
    "agency_code": "agency.keyword",
    "agency": "agency.keyword",
    "opportunity_status": "opportunity_status.keyword",
    "funding_instrument": "summary.funding_instruments.keyword",
    "funding_category": "summary.funding_categories.keyword",
    "applicant_type": "summary.applicant_types.keyword",
}

SEARCH_FIELDS = [
    # Note that we do keyword for agency & opportunity number
    # as we don't want to compare to a tokenized value which
    # may have split on the dashes.
    "agency.keyword^16",
    "opportunity_title^2",
    "opportunity_number.keyword^12",
    "summary.summary_description",
    "opportunity_assistance_listings.assistance_listing_number^10",
    "opportunity_assistance_listings.program_title^4",
]

SCHEMA = OpportunityV1Schema()


class SearchOpportunityParams(BaseModel):
    pagination: PaginationParams

    query: str | None = Field(default=None)
    filters: dict | None = Field(default=None)


def _adjust_field_name(field: str) -> str:
    return REQUEST_FIELD_NAME_MAPPING.get(field, field)


def _get_sort_by(pagination: PaginationParams) -> list[tuple[str, SortDirection]]:
    sort_by: list[tuple[str, SortDirection]] = []

    sort_by.append((_adjust_field_name(pagination.order_by), pagination.sort_direction))

    # Add a secondary sort for relevancy to sort by post date (matching the sort direction)
    if pagination.order_by == "relevancy":
        sort_by.append((_adjust_field_name("post_date"), pagination.sort_direction))

    return sort_by


def _add_search_filters(builder: search.SearchQueryBuilder, filters: dict | None) -> None:
    if filters is None:
        return

    for field, field_filters in filters.items():
        # one_of filters translate to an opensearch term filter
        # see: https://opensearch.org/docs/latest/query-dsl/term/terms/
        one_of_filters = field_filters.get("one_of", None)
        if one_of_filters:
            builder.filter_terms(_adjust_field_name(field), one_of_filters)


def _add_aggregations(builder: search.SearchQueryBuilder) -> None:
    # TODO - we'll likely want to adjust the total number of values returned, especially
    # for agency as there could be hundreds of different agencies, and currently it's limited to 25.
    builder.aggregation_terms("opportunity_status", _adjust_field_name("applicant_types"))
    builder.aggregation_terms("applicant_type", _adjust_field_name("applicant_types"))
    builder.aggregation_terms("funding_instrument", _adjust_field_name("funding_instruments"))
    builder.aggregation_terms("funding_category", _adjust_field_name("funding_categories"))
    builder.aggregation_terms("agency", _adjust_field_name("agency_code"))


def _get_search_request(params: SearchOpportunityParams) -> dict:
    builder = search.SearchQueryBuilder()

    # Pagination
    builder.pagination(
        page_size=params.pagination.page_size, page_number=params.pagination.page_offset
    )

    # Sorting
    builder.sort_by(_get_sort_by(params.pagination))

    # Query
    if params.query:
        builder.simple_query(params.query, SEARCH_FIELDS)

    # Filters
    _add_search_filters(builder, params.filters)

    # Aggregations / Facet / Filter Counts
    _add_aggregations(builder)

    return builder.build()


def search_opportunities(
    search_client: search.SearchClient, raw_search_params: dict
) -> Tuple[Sequence[dict], dict, PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    search_request = _get_search_request(search_params)

    index_alias = get_search_config().opportunity_search_index_alias
    logger.info(
        "Querying search index alias %s", index_alias, extra={"search_index_alias": index_alias}
    )

    response = search_client.search(index_alias, search_request)

    pagination_info = PaginationInfo(
        page_offset=search_params.pagination.page_offset,
        page_size=search_params.pagination.page_size,
        order_by=search_params.pagination.order_by,
        sort_direction=search_params.pagination.sort_direction,
        total_records=response.total_records,
        total_pages=int(math.ceil(response.total_records / search_params.pagination.page_size)),
    )

    # While the data returned is already JSON/dicts like we want to return
    # APIFlask will try to run whatever we return through the deserializers
    # which means anything that requires conversions like timestamps end up failing
    # as they don't need to be converted. So, we convert everything to those types (serialize)
    # so that deserialization won't fail.
    records = SCHEMA.load(response.records, many=True)

    return records, response.aggregations, pagination_info
