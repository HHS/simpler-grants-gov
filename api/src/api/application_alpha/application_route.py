import logging
from uuid import UUID

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.application_alpha.application_blueprint import application_blueprint
from src.api.application_alpha.application_schemas import (
    ApplicationFormGetResponseSchema,
    ApplicationFormUpdateRequestSchema,
    ApplicationFormUpdateResponseSchema,
    ApplicationGetResponseSchema,
    ApplicationStartRequestSchema,
    ApplicationStartResponseSchema,
)
from src.api.schemas.response_schema import AbstractResponseSchema
from src.auth.api_jwt_auth import api_jwt_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.applications.create_application import create_application
from src.services.applications.get_application import get_application
from src.services.applications.get_application_form import get_application_form
from src.services.applications.submit_application import submit_application
from src.services.applications.update_application_form import update_application_form

logger = logging.getLogger(__name__)


@application_blueprint.post("/applications/start")
@application_blueprint.input(ApplicationStartRequestSchema, location="json")
@application_blueprint.output(ApplicationStartResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_start(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new application for a competition"""
    competition_id = json_data["competition_id"]
    # application_name is optional, so we use get to avoid a KeyError
    application_name = json_data.get("application_name", None)
    add_extra_data_to_current_request_logs({"competition_id": competition_id})
    logger.info("POST /alpha/applications/start")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application = create_application(db_session, competition_id, user, application_name)

    return response.ApiResponse(
        message="Success", data={"application_id": application.application_id}
    )


@application_blueprint.put("/applications/<uuid:application_id>/forms/<uuid:form_id>")
@application_blueprint.input(ApplicationFormUpdateRequestSchema, location="json")
@application_blueprint.output(ApplicationFormUpdateResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_form_update(
    db_session: db.Session, application_id: UUID, form_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update an application form response"""
    add_extra_data_to_current_request_logs({"application_id": application_id, "form_id": form_id})
    logger.info("PUT /alpha/applications/:application_id/forms/:form_id")

    application_response = json_data["application_response"]

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        # Call the service to update the application form
        _, warnings = update_application_form(
            db_session, application_id, form_id, application_response, user
        )

    return response.ApiResponse(
        message="Success", data={"application_id": application_id}, warnings=warnings
    )


@application_blueprint.get(
    "/applications/<uuid:application_id>/application_form/<uuid:app_form_id>"
)
@application_blueprint.output(ApplicationFormGetResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_form_get(
    db_session: db.Session, application_id: UUID, app_form_id: UUID
) -> response.ApiResponse:
    """Get an application form by ID"""
    add_extra_data_to_current_request_logs(
        {
            "application_id": application_id,
            "application_form_id": app_form_id,
        }
    )
    logger.info("GET /alpha/applications/:application_id/application_form/:app_form_id")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application_form, warnings = get_application_form(
            db_session, application_id, app_form_id, user
        )

    return response.ApiResponse(
        message="Success",
        data=application_form,
        warnings=warnings,
    )


@application_blueprint.get("/applications/<uuid:application_id>")
@application_blueprint.output(ApplicationGetResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_get(
    db_session: db.Session,
    application_id: UUID,
) -> response.ApiResponse:
    """Get an application by ID"""
    add_extra_data_to_current_request_logs({"application_id": application_id})
    logger.info("GET /alpha/applications/:application_id")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application = get_application(db_session, application_id, user)

    # Return the application form data
    return response.ApiResponse(
        message="Success",
        data=application,
    )


@application_blueprint.post("/applications/<uuid:application_id>/submit")
@application_blueprint.output(AbstractResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_submit(db_session: db.Session, application_id: UUID) -> response.ApiResponse:
    """Submit an application"""
    add_extra_data_to_current_request_logs({"application_id": application_id})
    logger.info("POST /alpha/applications/:application_id/submit")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        submit_application(db_session, application_id, user)

    # Return success response
    return response.ApiResponse(message="Success")
