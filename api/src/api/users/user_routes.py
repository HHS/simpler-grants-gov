import logging

from flask import Response, request

from api.src.api import response
from api.src.api.route_utils import raise_flask_error
from api.src.api.users import user_schemas
from api.src.api.users.user_blueprint import user_blueprint
from api.src.auth import api_key_auth

logger = logging.getLogger(__name__)


@user_blueprint.post("/user/token")
@user_blueprint.output(user_schemas.UserTokenResponseV1Schema)
@user_blueprint.auth_required(api_key_auth)
def user_token() -> response.ApiResponse | Response:
    logger.info("POST /v1/users/user/token")

    header_token = request.headers.get("X-OAuth-login-gov")
    if header_token:
        data = {
            "token": "the token goes here!",
            "user": {
                "user_id": "abc-...",
                "email": "example@gmail.com",
                "external_user_type": "login_gov",
            },
            "is_user_new": True,
        }
        return response.ApiResponse(message="Success", data=data)

    message = "Missing X-OAuth-login-gov header"
    logger.error(message)

    return raise_flask_error(400, message)
