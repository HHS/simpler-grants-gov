import logging
from typing import Any

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.response as response
import src.api.users.user_schemas as user_schemas
import src.services.users as user_service
import src.services.users as users
from src.api.users.user_blueprint import user_blueprint
from src.auth.api_key_auth import api_key_auth
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


@user_blueprint.post("/v1/users")
@user_blueprint.input(user_schemas.UserSchema, arg_name="user_params")
@user_blueprint.output(user_schemas.UserSchema, status_code=201)
@user_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def user_post(db_session: db.Session, user_params: users.CreateUserParams) -> response.ApiResponse:
    """
    POST /v1/users
    """
    user = user_service.create_user(db_session, user_params)
    logger.info("Successfully inserted user", extra=get_user_log_params(user))
    return response.ApiResponse(message="Success", data=user)


@user_blueprint.patch("/v1/users/<uuid:user_id>")
# Allow partial updates. partial=true means requests that are missing
# required fields will not be rejected.
# https://marshmallow.readthedocs.io/en/stable/quickstart.html#partial-loading
@user_blueprint.input(user_schemas.UserSchema(partial=True), arg_name="patch_user_params")
@user_blueprint.output(user_schemas.UserSchema)
@user_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def user_patch(
    db_session: db.Session, user_id: str, patch_user_params: users.PatchUserParams
) -> response.ApiResponse:
    user = user_service.patch_user(db_session, user_id, patch_user_params)
    logger.info("Successfully patched user", extra=get_user_log_params(user))
    return response.ApiResponse(message="Success", data=user)


@user_blueprint.get("/v1/users/<uuid:user_id>")
@user_blueprint.output(user_schemas.UserSchema)
@user_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def user_get(db_session: db.Session, user_id: str) -> response.ApiResponse:
    user = user_service.get_user(db_session, user_id)
    logger.info("Successfully fetched user", extra=get_user_log_params(user))
    return response.ApiResponse(message="Success", data=user)


@user_blueprint.post("/v1/users/search")
@user_blueprint.input(user_schemas.UserSearchSchema, arg_name="search_params")
# many=True allows us to return a list of user objects
@user_blueprint.output(user_schemas.UserSchema(many=True))
@user_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def user_search(db_session: db.Session, search_params: dict) -> response.ApiResponse:
    user_result, pagination_info = user_service.search_user(db_session, search_params)
    logger.info("Successfully searched users")
    return response.ApiResponse(
        message="Success", data=user_result, pagination_info=pagination_info
    )


def get_user_log_params(user: User) -> dict[str, Any]:
    return {"user.id": user.id}
