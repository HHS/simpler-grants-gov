import logging

import src.api.form_v1.form_schema as form_schema
import src.api.response as response
from src.api.form_v1.form_blueprint import form_v1_blueprint
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.form_schema.forms import get_active_forms

logger = logging.getLogger(__name__)


@form_v1_blueprint.get("/forms/")
@form_v1_blueprint.output(form_schema.FormCatalogListV1ResponseSchema())
@form_v1_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
def form_list() -> response.ApiResponse:
    logger.info("GET /v1/forms/")
    forms = get_active_forms()
    return response.ApiResponse(message="Success", data=forms)
