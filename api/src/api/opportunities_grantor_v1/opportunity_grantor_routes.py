import logging
from uuid import UUID

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities_grantor_v1.opportunity_grantor_schemas as opportunity_grantor_schemas
import src.api.response as response
from src.api.opportunities_grantor_v1.opportunity_grantor_blueprint import (
    opportunity_grantor_blueprint,
)
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.get_opportunity_list import (
    get_opportunity_list_for_grantors,
)
from src.services.opportunities_grantor_v1.opportunity_creation import create_opportunity
from src.services.opportunities_grantor_v1.opportunity_summaries import (
    create_opportunity_summary,
    update_opportunity_summary,
)
from src.services.opportunities_grantor_v1.opportunity_update import update_opportunity

logger = logging.getLogger(__name__)


@opportunity_grantor_blueprint.post("/opportunities")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityCreateRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityCreateResponseSchema())
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 403, 404, 422, 500])
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


@opportunity_grantor_blueprint.post("/agencies/<uuid:agency_id>/opportunities")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityListRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityListResponseSchema())
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 403, 404, 500])
@flask_db.with_db_session()
def opportunity_get_list_by_agency(
    db_session: db.Session, agency_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Get paginated list of opportunities by agency"""
    add_extra_data_to_current_request_logs({"agency_id": agency_id})
    logger.info("POST /v1/grantors/agencies/{agency_id}/opportunities")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunities, pagination_info = get_opportunity_list_for_grantors(
            db_session, user, agency_id, json_data
        )

    return response.ApiResponse(
        message="Success", data=opportunities, pagination_info=pagination_info
    )


@opportunity_grantor_blueprint.get("/opportunities/<uuid:opportunity_id>")
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityGetResponseSchema())
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 403, 404, 500])
@flask_db.with_db_session()
def opportunity_get(db_session: db.Session, opportunity_id: UUID) -> response.ApiResponse:
    """Get an editable opportunity for grantors"""
    add_extra_data_to_current_request_logs({"opportunity_id": opportunity_id})
    logger.info("GET /v1/grantors/opportunities/{opportunity_id}/grantor")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    return response.ApiResponse(message="Success", data=opportunity)


@opportunity_grantor_blueprint.put("/opportunities/<uuid:opportunity_id>")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityUpdateRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityUpdateResponseSchema())
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 401, 403, 404, 422])
@flask_db.with_db_session()
def opportunity_update(
    db_session: db.Session, opportunity_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update an existing opportunity"""
    add_extra_data_to_current_request_logs({"opportunity_id": opportunity_id})
    logger.info("PUT /v1/grantors/opportunities/:opportunity_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity = update_opportunity(db_session, user, opportunity_id, json_data)

    return response.ApiResponse(message="Success", data=opportunity)


@opportunity_grantor_blueprint.post("/opportunities/<uuid:opportunity_id>/summaries")
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunitySummaryCreateRequestV1Schema(), location="json"
)
@opportunity_grantor_blueprint.output(
    opportunity_grantor_schemas.OpportunitySummaryCreateResponseV1Schema()
)
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 403, 404, 422, 500])
@flask_db.with_db_session()
def opportunity_summary_create(
    db_session: db.Session, opportunity_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Create a new opportunity summary"""
    add_extra_data_to_current_request_logs({"opportunity_id": opportunity_id})
    logger.info("POST /v1/opportunities/:opportunity_id/summaries")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity_summary = create_opportunity_summary(
            db_session, opportunity_id, json_data, user
        )
    return response.ApiResponse(message="Success", data=opportunity_summary)


@opportunity_grantor_blueprint.put(
    "/opportunities/<uuid:opportunity_id>/summaries/<uuid:opportunity_summary_id>"
)
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunitySummaryUpdateRequestV1Schema(), location="json"
)
@opportunity_grantor_blueprint.output(
    opportunity_grantor_schemas.OpportunitySummaryUpdateResponseV1Schema()
)
@opportunity_grantor_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@opportunity_grantor_blueprint.doc(responses=[200, 403, 404, 422, 500])
@flask_db.with_db_session()
def opportunity_summary_update(
    db_session: db.Session, opportunity_id: UUID, opportunity_summary_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update an existing opportunity summary"""
    add_extra_data_to_current_request_logs(
        {"opportunity_id": opportunity_id, "opportunity_summary_id": opportunity_summary_id}
    )
    logger.info("PUT /v1/grantors/opportunities/:opportunity_id/summaries/:opportunity_summary_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        opportunity_summary = update_opportunity_summary(
            db_session, opportunity_id, opportunity_summary_id, json_data, user
        )

    return response.ApiResponse(message="Success", data=opportunity_summary)
