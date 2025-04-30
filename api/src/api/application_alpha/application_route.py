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
from src.auth.api_key_auth import api_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.applications.create_application import create_application
from src.services.applications.get_application import get_application
from src.services.applications.get_application_form import get_application_form
from src.services.applications.update_application_form import update_application_form

logger = logging.getLogger(__name__)


@application_blueprint.post("/applications/start")
@application_blueprint.input(ApplicationStartRequestSchema, location="json")
@application_blueprint.output(ApplicationStartResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_start(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new application for a competition"""
    logger.info("POST /alpha/applications/start")

    competition_id = json_data["competition_id"]

    with db_session.begin():
        application = create_application(db_session, competition_id)

    return response.ApiResponse(
        message="Success", data={"application_id": application.application_id}
    )


@application_blueprint.put("/applications/<uuid:application_id>/forms/<uuid:form_id>")
@application_blueprint.input(ApplicationFormUpdateRequestSchema, location="json")
@application_blueprint.output(ApplicationFormUpdateResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_form_update(
    db_session: db.Session, application_id: UUID, form_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update an application form response"""
    add_extra_data_to_current_request_logs(
        {"application.application_id": application_id, "form.form_id": form_id}
    )
    logger.info("PUT /alpha/applications/:application_id/forms/:form_id")

    application_response = json_data["application_response"]

    with db_session.begin():
        # Call the service to update the application form
        _, warnings = update_application_form(
            db_session, application_id, form_id, application_response
        )

    return response.ApiResponse(
        message="Success", data={"application_id": application_id}, warnings=warnings
    )


@application_blueprint.get(
    "/applications/<uuid:application_id>/application_form/<uuid:app_form_id>"
)
@application_blueprint.output(ApplicationFormGetResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_form_get(
    db_session: db.Session, application_id: UUID, app_form_id: UUID
) -> response.ApiResponse:
    """Get an application form by ID"""
    add_extra_data_to_current_request_logs(
        {
            "application.application_id": application_id,
            "application_form.application_form_id": app_form_id,
        }
    )
    logger.info("GET /alpha/applications/:application_id/application_form/:app_form_id")

    with db_session.begin():
        application_form, warnings = get_application_form(db_session, application_id, app_form_id)

    return response.ApiResponse(
        message="Success",
        data=application_form,
        warnings=warnings,
    )


@application_blueprint.get("/applications/<uuid:application_id>")
@application_blueprint.output(ApplicationGetResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_get(
    db_session: db.Session,
    application_id: UUID,
) -> response.ApiResponse:
    """Get an application by ID"""
    add_extra_data_to_current_request_logs(
        {
            "application.application_id": application_id,
        }
    )
    logger.info("GET /alpha/applications/:application_id")

    with db_session.begin():
        application = get_application(db_session, application_id)

    # Return the application form data
    return response.ApiResponse(
        message="Success",
        data=application,
    )
