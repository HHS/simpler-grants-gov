import logging
import uuid
from typing import cast

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.form_alpha.form_schema as form_schema
import src.api.response as response
from src.api.form_alpha.form_blueprint import form_blueprint
from src.api.route_utils import raise_flask_error
from src.auth.api_key_auth import ApiKeyUser
from src.auth.api_user_key_auth import api_user_key_auth
from src.auth.endpoint_access_util import verify_access
from src.auth.multi_auth import AuthType, api_key_multi_auth, api_key_multi_auth_security_schemes
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import UserApiKey
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.form_alpha.get_form import get_form
from src.services.form_alpha.update_form import update_form
from src.services.form_alpha.upsert_form_instruction import upsert_form_instruction

logger = logging.getLogger(__name__)


@form_blueprint.get("/forms/<uuid:form_id>")
@form_blueprint.output(form_schema.FormResponseAlphaSchema())
@api_key_multi_auth.login_required
@flask_db.with_db_session()
@form_blueprint.doc(security=api_key_multi_auth_security_schemes)
def form_get(db_session: db.Session, form_id: uuid.UUID) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"form_id": form_id})
    logger.info("GET /alpha/forms/:form_id")

    with db_session.begin():
        form = get_form(db_session, form_id)

    return response.ApiResponse(message="Success", data=form)


@form_blueprint.put("/forms/<uuid:form_id>")
@form_blueprint.input(form_schema.FormUpdateRequestSchema, location="json")
@form_blueprint.output(form_schema.FormUpdateResponseSchema)
@api_key_multi_auth.login_required
@flask_db.with_db_session()
@form_blueprint.doc(security=api_key_multi_auth_security_schemes)
def form_update(
    db_session: db.Session, form_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"form_id": form_id})
    logger.info("PUT /alpha/forms/:form_id")

    with db_session.begin():
        multi_auth_user = api_key_multi_auth.get_user()
        # If the old API key approach is used (only allowed temporarily)
        # then we need to verify it's the internal auth token we haven't shared
        if multi_auth_user.auth_type == AuthType.API_KEY_AUTH:
            # Check if user is the internal admin user (auth_token_0)
            if cast(ApiKeyUser, multi_auth_user.user).username != "auth_token_0":
                raise_flask_error(403, "Only internal admin users can update forms")
        else:
            # This is only temporary until we remove the other way of calling
            # this route, after that, we'll always have a user.
            # When we do that, we should move these auth checks to
            # be in the service layer as well.
            user = cast(UserApiKey, multi_auth_user.user).user
            db_session.add(user)
            verify_access(user, {Privilege.UPDATE_FORM}, None)

        form = update_form(db_session, form_id, json_data)

    return response.ApiResponse(message="Success", data=form)


@form_blueprint.put("/forms/<uuid:form_id>/form_instructions/<uuid:form_instruction_id>")
@form_blueprint.input(form_schema.FormInstructionUploadRequestSchema(), location="form_and_files")
@form_blueprint.output(form_schema.FormInstructionUploadResponseSchema())
@api_user_key_auth.login_required
@flask_db.with_db_session()
def form_instruction_upsert(
    db_session: db.Session,
    form_id: uuid.UUID,
    form_instruction_id: uuid.UUID,
    form_and_files_data: dict,
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(
        {"form_id": form_id, "form_instruction_id": form_instruction_id}
    )
    logger.info("PUT /alpha/forms/:form_id/form_instructions/:form_instruction_id")

    # Get the file from the validated form data
    file_obj = form_and_files_data["file"]

    user = api_user_key_auth.get_user()

    with db_session.begin():
        db_session.add(user)
        upsert_form_instruction(db_session, form_id, form_instruction_id, file_obj, user)

    return response.ApiResponse(message="Success")
