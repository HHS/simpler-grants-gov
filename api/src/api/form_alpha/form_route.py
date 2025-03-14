import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.form_alpha.form_schema as form_schema
import src.api.response as response
from src.api.form_alpha.form_blueprint import form_blueprint
from src.auth.api_key_auth import api_key_auth
from src.services.form_alpha.get_form import get_form


@form_blueprint.get("/forms/<uuid:form_id>")
@form_blueprint.output(form_schema.FormResponseAlphaSchema())
@form_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def form_get(db_session: db.Session, form_id: uuid.UUID) -> response.ApiResponse:

    form = get_form(db_session, form_id)

    return response.ApiResponse(message="Success", data=form)
