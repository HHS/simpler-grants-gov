import logging
from typing import Sequence, Tuple

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
    ATTACHMENT_ONLY,
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
}

FILTER_RULE_MAPPING = {
    ScoringRule.EXPANDED: EXPANDED,
    ScoringRule.AGENCY: AGENCY,
    ScoringRule.DEFAULT: DEFAULT,
    ScoringRule.ATTACHMENT_ONLY: ATTACHMENT_ONLY,
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

SCHEMA = OpportunityV1Schema()


class OpportunityFilters(BaseModel):
    applicant_type: StrSearchFilter | None = None
    funding_instrument: StrSearchFilter | None = None
    funding_category: StrSearchFilter | None = None
    funding_applicant_type: StrSearchFilter | None = None
    opportunity_status: StrSearchFilter | None = None
    agency: StrSearchFilter | None = None
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
    # TODO - we'll likely want to adjust the total number of values returned, especially
    # for agency as there could be hundreds of different agencies, and currently it's limited to 25.
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
) -> Tuple[Sequence[dict], dict, PaginationInfo]:

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


def search_opportunities_id(search_client: search.SearchClient, search_query: dict) -> list:
    # Override pagination when calling opensearch
    updated_search_query = search_query | STATIC_PAGINATION
    search_params = SearchOpportunityParams.model_validate(updated_search_query)

    response = _search_opportunities(search_client, search_params, includes=["opportunity_id"])

    return [opp["opportunity_id"] for opp in response.records]
