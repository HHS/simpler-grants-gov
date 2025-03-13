import logging

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.application_alpha.application_blueprint import application_blueprint
from src.api.application_alpha.application_schemas import (
    ApplicationStartRequestSchema,
    ApplicationStartResponseSchema,
)
from src.auth.api_key_auth import api_key_auth
from src.services.applications.create_application import create_application

logger = logging.getLogger(__name__)


@application_blueprint.post("/application_alpha/start")
@application_blueprint.input(ApplicationStartRequestSchema, location="json")
@application_blueprint.output(ApplicationStartResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_start(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new application for a competition"""
    logger.info("POST /alpha/application_alpha/start")

    competition_id = json_data["competition_id"]

    application = create_application(db_session, competition_id)

    return response.ApiResponse(
        message="Success", data={"application_id": str(application.application_id)}
    )
