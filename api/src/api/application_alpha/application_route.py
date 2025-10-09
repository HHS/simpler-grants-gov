import logging
from uuid import UUID

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.application_alpha.application_blueprint import application_blueprint
from src.api.application_alpha.application_schemas import (
    ApplicationAttachmentCreateRequestSchema,
    ApplicationAttachmentCreateResponseSchema,
    ApplicationAttachmentDeleteResponseSchema,
    ApplicationAttachmentGetResponseSchema,
    ApplicationAttachmentUpdateRequestSchema,
    ApplicationAttachmentUpdateResponseSchema,
    ApplicationFormGetResponseSchema,
    ApplicationFormInclusionUpdateRequestSchema,
    ApplicationFormInclusionUpdateResponseSchema,
    ApplicationFormUpdateRequestSchema,
    ApplicationFormUpdateResponseSchema,
    ApplicationGetResponseSchema,
    ApplicationStartRequestSchema,
    ApplicationStartResponseSchema,
    ApplicationUpdateRequestSchema,
    ApplicationUpdateResponseSchema,
)
from src.api.schemas.response_schema import AbstractResponseSchema
from src.auth.api_jwt_auth import api_jwt_auth
from src.auth.multi_auth import jwt_key_or_internal_multi_auth, jwt_key_or_internal_security_schemes
from src.db.models.user_models import UserTokenSession
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.applications.create_application import create_application
from src.services.applications.create_application_attachment import create_application_attachment
from src.services.applications.delete_application_attachment import delete_application_attachment
from src.services.applications.get_application import get_application_with_warnings
from src.services.applications.get_application_attachment import get_application_attachment
from src.services.applications.get_application_form import get_application_form
from src.services.applications.submit_application import submit_application
from src.services.applications.update_application import update_application
from src.services.applications.update_application_attachment import update_application_attachment
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
    # organization_id is optional, so we use get to avoid a KeyError
    organization_id = json_data.get("organization_id", None)
    add_extra_data_to_current_request_logs({"competition_id": competition_id})
    logger.info("POST /alpha/applications/start")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application = create_application(
            db_session, competition_id, user, application_name, organization_id
        )

    return response.ApiResponse(
        message="Success", data={"application_id": application.application_id}
    )


@application_blueprint.put("/applications/<uuid:application_id>")
@application_blueprint.input(ApplicationUpdateRequestSchema, location="json")
@application_blueprint.output(ApplicationUpdateResponseSchema)
@application_blueprint.doc(responses=[200, 401, 403, 404, 422])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_update(
    db_session: db.Session, application_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update an application"""
    add_extra_data_to_current_request_logs({"application_id": application_id})
    logger.info("PUT /alpha/applications/:application_id")

    # Create updates dictionary from the request data
    updates = {"application_name": json_data["application_name"]}

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        # Call the service to update the application
        application = update_application(db_session, application_id, updates, user)

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
    is_included_in_submission = json_data.get("is_included_in_submission")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        # Call the service to update the application form
        application_form, warnings = update_application_form(
            db_session,
            application_id,
            form_id,
            user,
            application_response,
            is_included_in_submission,
        )

    return response.ApiResponse(message="Success", data=application_form, warnings=warnings)


@application_blueprint.put("/applications/<uuid:application_id>/forms/<uuid:form_id>/inclusion")
@application_blueprint.input(ApplicationFormInclusionUpdateRequestSchema, location="json")
@application_blueprint.output(ApplicationFormInclusionUpdateResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_form_inclusion_update(
    db_session: db.Session, application_id: UUID, form_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update whether an application form should be included in submission"""
    add_extra_data_to_current_request_logs({"application_id": application_id, "form_id": form_id})
    logger.info("PUT /alpha/applications/:application_id/forms/:form_id/inclusion")

    is_included_in_submission = json_data["is_included_in_submission"]

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        # Use the existing service with inclusion-only update
        application_form, _ = update_application_form(
            db_session,
            application_id,
            form_id,
            user,
            is_included_in_submission=is_included_in_submission,
        )

    return response.ApiResponse(message="Success", data=application_form)


@application_blueprint.get(
    "/applications/<uuid:application_id>/application_form/<uuid:app_form_id>"
)
@application_blueprint.output(ApplicationFormGetResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404], security=jwt_key_or_internal_security_schemes)
@jwt_key_or_internal_multi_auth.login_required
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

    # Get user from the multi-auth and determine auth type
    multi_auth_user = jwt_key_or_internal_multi_auth.get_user()

    if isinstance(multi_auth_user.user, UserTokenSession):
        # validate user can access as we already do
        user = multi_auth_user.user.user
    else:
        # Do not check
        user = None

    with db_session.begin():
        if user:
            db_session.add(multi_auth_user.user)
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
        db_session.add(token_session)
        application, warnings = get_application_with_warnings(db_session, application_id, user)

    # Return the application form data
    return response.ApiResponse(
        message="Success",
        data=application,
        warnings=warnings,
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


@application_blueprint.post("/applications/<uuid:application_id>/attachments")
@application_blueprint.input(ApplicationAttachmentCreateRequestSchema(), location="form_and_files")
@application_blueprint.output(ApplicationAttachmentCreateResponseSchema())
@application_blueprint.doc(responses=[200, 401, 404, 422])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_attachment_create(
    db_session: db.Session, application_id: UUID, form_and_files_data: dict
) -> response.ApiResponse:
    """Create an attachment on an application"""
    add_extra_data_to_current_request_logs({"application_id": application_id})
    logger.info("POST /alpha/applications/:application_id/attachments")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application_attachment = create_application_attachment(
            db_session, application_id, user, form_and_files_data
        )

    return response.ApiResponse(message="Success", data=application_attachment)


@application_blueprint.get(
    "/applications/<uuid:application_id>/attachments/<uuid:application_attachment_id>"
)
@application_blueprint.output(ApplicationAttachmentGetResponseSchema())
@application_blueprint.doc(responses=[200, 401, 404, 422])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_attachment_get(
    db_session: db.Session, application_id: UUID, application_attachment_id: UUID
) -> response.ApiResponse:
    """Fetch an application attachment"""
    add_extra_data_to_current_request_logs(
        {"application_id": application_id, "application_attachment_id": application_attachment_id}
    )
    logger.info("GET /alpha/applications/:application_id/attachments/:application_attachment_id")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        db_session.add(token_session)
        application_attachment = get_application_attachment(
            db_session, application_id, application_attachment_id, user
        )

    return response.ApiResponse(message="Success", data=application_attachment)


@application_blueprint.put(
    "/applications/<uuid:application_id>/attachments/<uuid:application_attachment_id>"
)
@application_blueprint.input(ApplicationAttachmentUpdateRequestSchema(), location="form_and_files")
@application_blueprint.output(ApplicationAttachmentUpdateResponseSchema())
@application_blueprint.doc(responses=[200, 401, 404, 422])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_attachment_update(
    db_session: db.Session,
    application_id: UUID,
    application_attachment_id: UUID,
    form_and_files_data: dict,
) -> response.ApiResponse:
    """Update an attachment on an application"""
    add_extra_data_to_current_request_logs(
        {"application_id": application_id, "application_attachment_id": application_attachment_id}
    )
    logger.info("PUT /alpha/applications/:application_id/attachments/:application_attachment_id")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        application_attachment = update_application_attachment(
            db_session, application_id, application_attachment_id, user, form_and_files_data
        )

    return response.ApiResponse(message="Success", data=application_attachment)


@application_blueprint.delete(
    "/applications/<uuid:application_id>/attachments/<uuid:application_attachment_id>"
)
@application_blueprint.output(ApplicationAttachmentDeleteResponseSchema())
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_attachment_delete(
    db_session: db.Session, application_id: UUID, application_attachment_id: UUID
) -> response.ApiResponse:
    """Delete an application attachment"""
    add_extra_data_to_current_request_logs(
        {"application_id": application_id, "application_attachment_id": application_attachment_id}
    )
    logger.info("DELETE /alpha/applications/:application_id/attachments/:application_attachment_id")

    # Get user from token session
    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        delete_application_attachment(db_session, application_id, application_attachment_id, user)

    return response.ApiResponse(message="Success")
