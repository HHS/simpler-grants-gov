import logging
import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities_grantor_v1.opportunity_grantor_schemas as opportunity_grantor_schemas
import src.api.response as response
from src.api.opportunities_grantor_v1.opportunity_grantor_blueprint import (
    opportunity_grantor_blueprint,
)
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth, jwt_or_api_user_key_security_schemes
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.opportunities_grantor_v1.opportunity_creation import create_opportunity
from src.services.opportunities_grantor_v1.opportunity_update import update_opportunity

logger = logging.getLogger(__name__)


@opportunity_grantor_blueprint.post("/opportunities/")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityCreateRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityCreateResponseSchema())
@jwt_or_api_user_key_multi_auth.login_required
@opportunity_grantor_blueprint.doc(
    responses=[200, 403, 404, 422, 500], security=jwt_or_api_user_key_security_schemes
)
@flask_db.with_db_session()
def opportunity_create(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new opportunity"""
    add_extra_data_to_current_request_logs({"agency_id": json_data.get("agency_id")})
    logger.info("POST /v1/grantors/opportunities/")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity = create_opportunity(db_session, user, json_data)

    return response.ApiResponse(message="Success", data=opportunity)


@opportunity_grantor_blueprint.put("/opportunities/<uuid:opportunity_id>")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityUpdateRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityUpdateResponseSchema())
@jwt_or_api_user_key_multi_auth.login_required
@opportunity_grantor_blueprint.doc(
    responses=[200, 401, 403, 404, 422], security=jwt_or_api_user_key_security_schemes
)
@flask_db.with_db_session()
def opportunity_update(
    db_session: db.Session, opportunity_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    """Update an existing opportunity"""
    add_extra_data_to_current_request_logs({"opportunity_id": opportunity_id})
    logger.info("PUT /v1/grantors/opportunities/:opportunity_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity = update_opportunity(db_session, user, opportunity_id, json_data)

    return response.ApiResponse(message="Success", data=opportunity)
