import logging

import grants_shared.api.response as response

import src.api.form_v1.form_schema as form_schema
from src.api.form_v1.form_blueprint import form_v1_blueprint
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.services.form_v1.get_forms import get_forms

logger = logging.getLogger(__name__)


@form_v1_blueprint.get("/forms/")
@form_v1_blueprint.output(form_schema.FormCatalogListV1ResponseSchema())
@form_v1_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
def form_list() -> response.ApiResponse:
    logger.info("GET /v1/forms/")
    return response.ApiResponse(message="Success", data=get_forms())
