import logging

import src.api.agencies_v1.agency_schema as agency_schema
import src.api.response as response
from src.adapters import search
from src.adapters.search import flask_opensearch
from src.api.agencies_v1.agency_blueprint import agency_blueprint
from src.auth.multi_auth import api_key_multi_auth, api_key_multi_auth_security_schemes
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.agencies_v1.search_agencies import search_agencies
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)






examples = {
    "example1": {
        "summary": "No filters",
        "value": {
            "query": "USAID",
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "agency_name",
                        "sort_direction": "descending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example2": {
        "summary": "Filter by open/forecasted agency",
        "value": {
            "filters": {
                "has_open_opportunity": {"one_of": ["False"]},
                "has_forecasted_opportunity": {"one_of": ["False"]},
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "agency_name",
                        "sort_direction": "descending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
}


@agency_blueprint.post("/agencies/search")
@agency_blueprint.input(
    agency_schema.AgencySearchRequestSchema,
    arg_name="raw_search_params",
    examples=examples,
)
@agency_blueprint.output(agency_schema.AgencySearchResponseV1Schema)
@agency_blueprint.doc(security=api_key_multi_auth_security_schemes)
@api_key_multi_auth.login_required
@flask_opensearch.with_search_client()
def agency_search(
    search_client: search.SearchClient, raw_search_params: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(flatten_dict(raw_search_params, prefix="request.body"))
    logger.info("POST /v1/agencies/search")

    agencies, pagination_info = search_agencies(search_client, raw_search_params)

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    return response.ApiResponse(
        message="Success",
        data=agencies,
        pagination_info=pagination_info,
    )
