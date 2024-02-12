import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities_v0_1.opportunity_schemas as opportunity_schemas
import src.api.response as response
from src.api.opportunities_v0_1.opportunity_blueprint import opportunity_blueprint
from src.auth.api_key_auth import api_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.opportunities_v0_1.get_opportunities import get_opportunity
from src.services.opportunities_v0_1.search_opportunities import search_opportunities

logger = logging.getLogger(__name__)

# Descriptions in OpenAPI support markdown https://swagger.io/specification/
SHARED_ALPHA_DESCRIPTION = """
__ALPHA VERSION__

This endpoint in its current form is primarily for testing and feedback.

Features in this endpoint are still under heavy development, and subject to change. Not for production use.

See [Release Phases](https://github.com/github/roadmap?tab=readme-ov-file#release-phases) for further details.
"""


@opportunity_blueprint.post("/opportunities/search")
@opportunity_blueprint.input(
    opportunity_schemas.OpportunitySearchRequestSchema, arg_name="search_params"
)
# many=True allows us to return a list of opportunity objects
@opportunity_blueprint.output(opportunity_schemas.OpportunitySchema(many=True))
@opportunity_blueprint.auth_required(api_key_auth)
@opportunity_blueprint.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_search(db_session: db.Session, search_params: dict) -> response.ApiResponse:
    with db_session.begin():
        opportunities, pagination_info = search_opportunities(db_session, search_params)

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


@opportunity_blueprint.get("/opportunities/<int:opportunity_id>")
@opportunity_blueprint.output(opportunity_schemas.OpportunitySchema)
@opportunity_blueprint.auth_required(api_key_auth)
@opportunity_blueprint.doc(description=SHARED_ALPHA_DESCRIPTION)
@flask_db.with_db_session()
def opportunity_get(db_session: db.Session, opportunity_id: int) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"request.path.opportunity_id": opportunity_id})
    logger.info("GET /v0.1/opportunities/:opportunity_id")
    with db_session.begin():
        opportunity = get_opportunity(db_session, opportunity_id)

    return response.ApiResponse(message="Success", data=opportunity)
