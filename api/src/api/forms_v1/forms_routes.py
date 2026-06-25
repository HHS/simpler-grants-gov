import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.forms_v1.forms_schemas as forms_schemas
import src.api.response as response
from src.api.forms_v1.forms_blueprint import forms_blueprint
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.services.forms_v1.get_forms import get_all_forms

logger = logging.getLogger(__name__)


@forms_blueprint.get("/forms/")
@forms_blueprint.output(forms_schemas.FormsListResponseSchema())
@forms_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def forms_get_all(db_session: db.Session) -> response.ApiResponse:
    """Get all forms associated with the SGG agency code"""
    logger.info("GET /v1/forms/")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        forms = get_all_forms(db_session, user)

    return response.ApiResponse(message="Success", data=forms)
