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
from src.auth.multi_auth import AuthType, api_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.form_alpha.get_form import get_form
from src.services.form_alpha.update_form import update_form

logger = logging.getLogger(__name__)


@form_blueprint.get("/forms/<uuid:form_id>")
@form_blueprint.output(form_schema.FormResponseAlphaSchema())
@api_key_multi_auth.login_required
@flask_db.with_db_session()
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
def form_update(
    db_session: db.Session, form_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"form_id": form_id})
    logger.info("PUT /alpha/forms/:form_id")

    # Check if user is the internal admin user (auth_token_0) - only for environment API keys
    multi_user = api_key_multi_auth.get_user()
    if multi_user.auth_type == AuthType.API_KEY_AUTH:
        # Environment-based API key - check for auth_token_0
        api_key_user = cast(ApiKeyUser, multi_user.user)
        if api_key_user.username != "auth_token_0":
            raise_flask_error(403, "Only internal admin users can update forms")
    else:
        # API Gateway keys are not currently authorized for form updates
        raise_flask_error(403, "Only internal admin users can update forms")

    with db_session.begin():
        form = update_form(db_session, form_id, json_data)

    return response.ApiResponse(message="Success", data=form)
