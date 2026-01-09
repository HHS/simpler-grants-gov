import logging
import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.form_alpha.form_schema as form_schema
import src.api.response as response
from src.api.form_alpha.form_blueprint import form_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.form_alpha.get_form import get_form
from src.services.form_alpha.update_form import update_form
from src.services.form_alpha.upsert_form_instruction import upsert_form_instruction

logger = logging.getLogger(__name__)


@form_blueprint.get("/forms/<uuid:form_id>")
@form_blueprint.output(form_schema.FormResponseAlphaSchema())
@form_blueprint.auth_required(api_user_key_auth)
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
@form_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def form_update(
    db_session: db.Session, form_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"form_id": form_id})
    logger.info("PUT /alpha/forms/:form_id")

    user = api_user_key_auth.get_user()

    with db_session.begin():
        db_session.add(user)
        form = update_form(db_session, form_id, json_data, user)

    return response.ApiResponse(message="Success", data=form)


@form_blueprint.put("/forms/<uuid:form_id>/form_instructions/<uuid:form_instruction_id>")
@form_blueprint.input(form_schema.FormInstructionUploadRequestSchema(), location="form_and_files")
@form_blueprint.output(form_schema.FormInstructionUploadResponseSchema())
@form_blueprint.auth_required(api_user_key_auth)
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

    file_obj = form_and_files_data["file"]
    user = api_user_key_auth.get_user()

    with db_session.begin():
        db_session.add(user)
        upsert_form_instruction(db_session, form_id, form_instruction_id, file_obj, user)

    return response.ApiResponse(message="Success")
