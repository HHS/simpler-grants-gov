import logging
import uuid
from collections.abc import Sequence

from pydantic import BaseModel, Field

import src.adapters.search as search
from src.adapters.search.opensearch_response import SearchResponse
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema, SearchQueryOperator
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.search.search_config import get_search_config
from src.search.search_models import (
    BoolSearchFilter,
    DateSearchFilter,
    IntSearchFilter,
    StrSearchFilter,
)
from src.services.opportunities_v1.experimental_constant import (
    AGENCY,
    DEFAULT,
    EXPANDED,
    ScoringRule,
)
from src.services.service_utils import _add_search_filters, _adjust_field_name

logger = logging.getLogger(__name__)

# To assist with mapping field names from our API requests
# to what they are called in the search index, this mapping
# can be used. Note that in many cases its just adjusting paths
# or for text based fields adding ".keyword" to the end to tell
# the query we want to use the raw value rather than the tokenized one
# See: https://opensearch.org/docs/latest/field-types/supported-field-types/keyword/
OPP_REQUEST_FIELD_NAME_MAPPING = {
    "opportunity_id": "opportunity_id.keyword",
    "opportunity_number": "opportunity_number.keyword",
    "opportunity_title": "opportunity_title.keyword",
    "post_date": "summary.post_date",
    "close_date": "summary.close_date",
    "agency_code": "agency_code.keyword",
    "agency": "agency_code.keyword",
    "agency_name": "agency_name.keyword",
    "top_level_agency_name": "top_level_agency_name.keyword",
    "opportunity_status": "opportunity_status.keyword",
    "funding_instrument": "summary.funding_instruments.keyword",
    "funding_category": "summary.funding_categories.keyword",
    "applicant_type": "summary.applicant_types.keyword",
    "is_cost_sharing": "summary.is_cost_sharing",
    "expected_number_of_awards": "summary.expected_number_of_awards",
    "award_floor": "summary.award_floor",
    "award_ceiling": "summary.award_ceiling",
    "estimated_total_program_funding": "summary.estimated_total_program_funding",
    "assistance_listing_number": "opportunity_assistance_listings.assistance_listing_number.keyword",
}

FILTER_RULE_MAPPING = {
    ScoringRule.EXPANDED: EXPANDED,
    ScoringRule.AGENCY: AGENCY,
    ScoringRule.DEFAULT: DEFAULT,
}

STATIC_PAGINATION = {
    "pagination": {
        "page_offset": 1,
        "page_size": 1000,
        "sort_order": [
            {
                "order_by": "post_date",
                "sort_direction": "descending",
            }
        ],
    }
}

STATIC_DATE_RANGES: list = [
    {"from": "now", "to": "now+7d/d", "key": "7"},
    {"from": "now", "to": "now+30d/d", "key": "30"},
    {"from": "now", "to": "now+60d/d", "key": "60"},
    {"from": "now", "to": "now+90d/d", "key": "90"},
    {"from": "now", "to": "now+120d/d", "key": "120"},
]

STATIC_POSTED_DATE_RANGES: list = [
    {"from": "now-3d/d", "to": "now", "key": "3"},
    {"from": "now-7d/d", "to": "now", "key": "7"},
    {"from": "now-14d/d", "to": "now", "key": "14"},
    {"from": "now-30d/d", "to": "now", "key": "30"},
    {"from": "now-60d/d", "to": "now", "key": "60"},
]

SCHEMA = OpportunityV1Schema()


class OpportunityFilters(BaseModel):
    applicant_type: StrSearchFilter | None = None
    funding_instrument: StrSearchFilter | None = None
    funding_category: StrSearchFilter | None = None
    funding_applicant_type: StrSearchFilter | None = None
    opportunity_status: StrSearchFilter | None = None
    agency: StrSearchFilter | None = None
    top_level_agency: StrSearchFilter | None = None
    assistance_listing_number: StrSearchFilter | None = None

    is_cost_sharing: BoolSearchFilter | None = None

    expected_number_of_awards: IntSearchFilter | None = None
    award_floor: IntSearchFilter | None = None
    award_ceiling: IntSearchFilter | None = None
    estimated_total_program_funding: IntSearchFilter | None = None

    post_date: DateSearchFilter | None = None
    close_date: DateSearchFilter | None = None


class Experimental(BaseModel):
    scoring_rule: ScoringRule = Field(default=ScoringRule.DEFAULT)


class SearchOpportunityParams(BaseModel):
    pagination: PaginationParams

    query: str | None = Field(default=None)
    query_operator: str = Field(default=SearchQueryOperator.AND)
    filters: OpportunityFilters | None = Field(default=None)
    experimental: Experimental = Field(default=Experimental())


def _get_sort_by(pagination: PaginationParams) -> list[tuple[str, SortDirection]]:
    sort_by: list[tuple[str, SortDirection]] = []

    for sort_order in pagination.sort_order:
        sort_by.append(
            (
                _adjust_field_name(sort_order.order_by, OPP_REQUEST_FIELD_NAME_MAPPING),
                sort_order.sort_direction,
            )
        )

    return sort_by


def _add_aggregations(builder: search.SearchQueryBuilder) -> None:
    """Add aggregations / facet_counts to the query to the search index"""
    builder.aggregation_terms(
        "opportunity_status",
        _adjust_field_name("opportunity_status", OPP_REQUEST_FIELD_NAME_MAPPING),
    )
    builder.aggregation_terms(
        "applicant_type", _adjust_field_name("applicant_type", OPP_REQUEST_FIELD_NAME_MAPPING)
    )
    builder.aggregation_terms(
        "funding_instrument",
        _adjust_field_name("funding_instrument", OPP_REQUEST_FIELD_NAME_MAPPING),
    )
    builder.aggregation_terms(
        "funding_category", _adjust_field_name("funding_category", OPP_REQUEST_FIELD_NAME_MAPPING)
    )
    builder.aggregation_terms(
        "agency", _adjust_field_name("agency_code", OPP_REQUEST_FIELD_NAME_MAPPING), size=1000
    )
    builder.aggregation_terms(
        "is_cost_sharing",
        _adjust_field_name("is_cost_sharing", OPP_REQUEST_FIELD_NAME_MAPPING),
    )
    builder.aggregation_relative_date_range(
        "close_date",
        _adjust_field_name("close_date", OPP_REQUEST_FIELD_NAME_MAPPING),
        STATIC_DATE_RANGES,
    )
    builder.aggregation_relative_date_range(
        "post_date",
        _adjust_field_name("post_date", OPP_REQUEST_FIELD_NAME_MAPPING),
        STATIC_POSTED_DATE_RANGES,
    )


def _add_top_level_agency_prefix(
    builder: search.SearchQueryBuilder, filters: OpportunityFilters | None
) -> None:
    """
    If top_level_agency is provided it adds an OR-based agency filter using a `should` clause:
      - Matches agencies whose code starts with the given top-level prefix.
      - Also includes specific agency codes from filters agency (if provided).

    Clears filters top_level_agency and agency to prevent duplication in other filters.
    """

    if not filters or not (filters.top_level_agency and filters.top_level_agency.one_of):
        return

    # Exact match for the top-level agency itself (e.g., "DOC")
    builder.filter_should_terms(
        "agency_code.keyword", [agency for agency in filters.top_level_agency.one_of]
    )

    # Add a prefix match on the top-level agency code (e.g. "DOS-")
    builder.filter_should_prefix(
        "agency_code.keyword", [f"{agency}-" for agency in filters.top_level_agency.one_of]
    )

    # remove top level agency from filter
    filters.top_level_agency = None

    # If specific sub-agency codes are also provided, add them to the should clause
    if filters.agency and filters.agency.one_of:
        builder.filter_should_terms("agency_code.keyword", filters.agency.one_of)

        # Clear it so this field isn't added again as a hard filter
        filters.agency = None


def _normalize_aln(filters: OpportunityFilters | None) -> None:
    if not filters or not filters.assistance_listing_number:
        return

    one_of = filters.assistance_listing_number.one_of
    if one_of:
        filters.assistance_listing_number.one_of = [v.upper() for v in one_of]


def _get_search_request(params: SearchOpportunityParams, aggregation: bool = True) -> dict:
    builder = search.SearchQueryBuilder()

    # Make sure total hit count gets counted for more than 10k records
    builder.track_total_hits(True)

    # Pagination
    builder.pagination(
        page_size=params.pagination.page_size, page_number=params.pagination.page_offset
    )

    # Sorting
    builder.sort_by(_get_sort_by(params.pagination))
    # Query
    if params.query:
        filter_rule = FILTER_RULE_MAPPING.get(params.experimental.scoring_rule, DEFAULT)
        builder.simple_query(params.query, filter_rule, params.query_operator)

    # Filter Prefix
    _add_top_level_agency_prefix(builder, params.filters)

    # Normalize ALN casing
    _normalize_aln(params.filters)

    # Filters
    _add_search_filters(builder, OPP_REQUEST_FIELD_NAME_MAPPING, params.filters)

    if aggregation:
        # Aggregations / Facet / Filter Counts
        _add_aggregations(builder)

    return builder.build()


def _search_opportunities(
    search_client: search.SearchClient,
    search_params: SearchOpportunityParams,
    includes: list | None = None,
) -> SearchResponse:
    search_request = _get_search_request(search_params)
    index_alias = get_search_config().opportunity_search_index_alias
    logger.info(
        "Querying search index alias %s", index_alias, extra={"search_index_alias": index_alias}
    )
    response = search_client.search(
        index_alias, search_request, includes=includes, excludes=["attachments"]
    )

    return response


def search_opportunities(
    search_client: search.SearchClient, raw_search_params: dict
) -> tuple[Sequence[dict], dict, PaginationInfo]:

    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    response = _search_opportunities(search_client, search_params)

    pagination_info = PaginationInfo.from_search_response(search_params.pagination, response)

    # While the data returned is already JSON/dicts like we want to return
    # APIFlask will try to run whatever we return through the deserializers
    # which means anything that requires conversions like timestamps end up failing
    # as they don't need to be converted. So, we convert everything to those types (serialize)
    # so that deserialization won't fail.
    records = SCHEMA.load(response.records, many=True)

    return records, response.aggregations, pagination_info


def search_opportunities_id(
    search_client: search.SearchClient, search_query: dict
) -> list[uuid.UUID]:
    # Override pagination when calling opensearch
    updated_search_query = search_query | STATIC_PAGINATION
    search_params = SearchOpportunityParams.model_validate(updated_search_query)

    response = _search_opportunities(search_client, search_params, includes=["opportunity_id"])

    return [uuid.UUID(opp["opportunity_id"]) for opp in response.records]
