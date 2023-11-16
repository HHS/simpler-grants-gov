import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities.opportunity_schemas as opportunity_schemas
import src.api.response as response
from src.api.feature_flags.feature_flag_config import FeatureFlagConfig
from src.api.opportunities.opportunity_blueprint import opportunity_blueprint
from src.auth.api_key_auth import api_key_auth
from src.services.opportunities.get_opportunities import get_opportunity
from src.services.opportunities.search_opportunities import search_opportunities

logger = logging.getLogger(__name__)


@opportunity_blueprint.post("/v1/opportunities/search")
@opportunity_blueprint.input(opportunity_schemas.OpportunitySearchSchema, arg_name="search_params")
@opportunity_blueprint.input(
    opportunity_schemas.OpportunitySearchHeaderSchema,
    location="headers",
    arg_name="feature_flag_config",
)
# many=True allows us to return a list of opportunity objects
@opportunity_blueprint.output(opportunity_schemas.OpportunitySchema(many=True))
@opportunity_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def opportunity_search(
    db_session: db.Session, search_params: dict, feature_flag_config: FeatureFlagConfig
) -> response.ApiResponse:
    if feature_flag_config.enable_opportunity_log_msg:
        logger.info("Feature flag enabled")

    with db_session.begin():
        opportunities, pagination_info = search_opportunities(db_session, search_params)

    return response.ApiResponse(
        message="Success", data=opportunities, pagination_info=pagination_info
    )


@opportunity_blueprint.get("/v1/opportunities/<int:opportunity_id>")
@opportunity_blueprint.output(opportunity_schemas.OpportunitySchema)
@opportunity_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def opportunity_get(db_session: db.Session, opportunity_id: int) -> response.ApiResponse:
    with db_session.begin():
        opportunity = get_opportunity(db_session, opportunity_id)

    return response.ApiResponse(message="Success", data=opportunity)
