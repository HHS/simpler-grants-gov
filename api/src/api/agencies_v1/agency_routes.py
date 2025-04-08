import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.agencies_v1.agency_schema as agency_schema
import src.api.response as response
from src.adapters import search
from src.adapters.search import flask_opensearch
from src.api.agencies_v1.agency_blueprint import agency_blueprint
from src.auth.api_key_auth import api_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.agencies_v1.get_agencies import AgencyListParams, get_agencies, search_agencies
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)

examples = {
    "example1": {
        "summary": "No filters",
        "value": {
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "created_at",
                        "sort_direction": "descending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
}


@agency_blueprint.post("/agencies")
@agency_blueprint.input(
    agency_schema.AgencyListRequestSchema,
    arg_name="raw_list_params",
    examples=examples,
)
@agency_blueprint.output(agency_schema.AgencyListResponseSchema)
@agency_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def agencies_get(db_session: db.Session, raw_list_params: dict) -> response.ApiResponse:
    list_params: AgencyListParams = AgencyListParams.model_validate(raw_list_params)

    # Call service with params to get results
    with db_session.begin():
        results, pagination_info = get_agencies(db_session, list_params)

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    logger.info("Successfully fetched agencies")

    # Serialize results
    return response.ApiResponse(message="Success", data=results, pagination_info=pagination_info)


@agency_blueprint.post("/agencies/search")
@agency_blueprint.input(
    agency_schema.AgencySearchRequestSchema,
    arg_name="raw_search_params",
    examples=examples,
)
@agency_blueprint.output(agency_schema.AgencySearchResponseV1Schema)
@agency_blueprint.doc(
    responses={200: {"content": {"application/octet-stream": {}}}},  # type: ignore
)
@agency_blueprint.auth_required(api_key_auth)
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
