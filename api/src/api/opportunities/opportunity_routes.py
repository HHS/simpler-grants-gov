import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities.opportunity_schemas as opportunity_schemas
import src.api.response as response
from src.api.feature_flags.feature_flag_config import FeatureFlagConfig
from src.api.opportunities.opportunity_blueprint import opportunity_blueprint_v0, opportunity_blueprint_v0_1
from src.auth.api_key_auth import api_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.opportunities.get_opportunities import get_opportunity, get_opportunity_v01
from src.services.opportunities.search_opportunities import search_opportunities_v0, search_opportunities_v01
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)

# Descriptions in OpenAPI support markdown https://swagger.io/specification/
SHARED_ALPHA_DESCRIPTION = """
__ALPHA VERSION__

This endpoint in its current form is primarily for testing and feedback.

Features in this endpoint are still under heavy development, and subject to change. Not for production use.

See [Release Phases](https://github.com/github/roadmap?tab=readme-ov-file#release-phases) for further details.
"""


@opportunity_blueprint_v0.post("/v0/opportunities/search")
@opportunity_blueprint_v0.input(opportunity_schemas.OpportunitySearchV0Schema, arg_name="search_params")
@opportunity_blueprint_v0.input(
    opportunity_schemas.OpportunitySearchHeaderV0Schema,
    location="headers",
    arg_name="feature_flag_config",
)
# many=True allows us to return a list of opportunity objects
@opportunity_blueprint_v0.output(opportunity_schemas.OpportunityV0Schema(many=True))
@opportunity_blueprint_v0.auth_required(api_key_auth)
@opportunity_blueprint_v0.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_search_v0(
    db_session: db.Session, search_params: dict, feature_flag_config: FeatureFlagConfig
) -> response.ApiResponse:
    # Attach the request parameters to all logs for the rest of the request lifecycle
    add_extra_data_to_current_request_logs(flatten_dict(search_params, prefix="request.body"))
    logger.info("POST /v0/opportunities/search")

    if feature_flag_config.enable_opportunity_log_msg:
        logger.info("Feature flag enabled")

    with db_session.begin():
        opportunities, pagination_info = search_opportunities_v0(db_session, search_params)

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    logger.info("Successfully fetched opportunities")

    return response.ApiResponse(
        message="Success", data=opportunities, pagination_info=pagination_info
    )


@opportunity_blueprint_v0.get("/v0/opportunities/<int:opportunity_id>")
@opportunity_blueprint_v0.output(opportunity_schemas.OpportunityV0Schema)
@opportunity_blueprint_v0.auth_required(api_key_auth)
@opportunity_blueprint_v0.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_get_v0(db_session: db.Session, opportunity_id: int) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"request.path.opportunity_id": opportunity_id})
    logger.info("GET /v0/opportunities/:opportunity_id")
    with db_session.begin():
        opportunity = get_opportunity(db_session, opportunity_id)

    return response.ApiResponse(message="Success", data=opportunity)


#########################
# v0.1 endpoints
#########################

@opportunity_blueprint_v0_1.post("/v0.1/opportunities/search")
@opportunity_blueprint_v0_1.input(opportunity_schemas.OpportunitySearchRequestV01Schema, arg_name="search_params")
# many=True allows us to return a list of opportunity objects
@opportunity_blueprint_v0_1.output(opportunity_schemas.OpportunityV01Schema(many=True))
@opportunity_blueprint_v0_1.auth_required(api_key_auth)
@opportunity_blueprint_v0_1.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_search_v0_1(
    db_session: db.Session, search_params: dict
) -> response.ApiResponse:

    with db_session.begin():
        opportunities, pagination_info = search_opportunities_v01(db_session, search_params)

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    logger.info("Successfully fetched opportunities")

    return response.ApiResponse(
        message="Success", data=opportunities, pagination_info=pagination_info
    )


@opportunity_blueprint_v0_1.get("/v0.1/opportunities/<int:opportunity_id>")
@opportunity_blueprint_v0_1.output(opportunity_schemas.OpportunityV01Schema)
@opportunity_blueprint_v0_1.auth_required(api_key_auth)
@opportunity_blueprint_v0_1.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_get_v0_1(db_session: db.Session, opportunity_id: int) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"request.path.opportunity_id": opportunity_id})
    logger.info("GET /v0.1/opportunities/:opportunity_id")
    with db_session.begin():
        opportunity = get_opportunity_v01(db_session, opportunity_id)

    return response.ApiResponse(message="Success", data=opportunity)