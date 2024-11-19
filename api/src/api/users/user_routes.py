import logging

from flask import Response, request

from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.auth.api_key_auth import api_key_auth

logger = logging.getLogger(__name__)


@user_blueprint.post("/user/token")
@user_blueprint.output(user_schemas.UserTokenResponseSchema)
@user_blueprint.auth_required(api_key_auth)
@user_blueprint.doc(
    description="Test",
    responses=[200, 400],
    # parameters={
    #     "name": "X-OAuth-login-gov",
    #     "in": "header",
    #     "schema": {"type": "string"},
    #     "description": "JWT token",
    # },
)
def user_token() -> response.ApiResponse | Response:
    """
    parameters:
        - name: X-OAuth-login-gov
            in: header
            type: string
            required: true
            description: The Oauth2 JWT token
    """

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

    raise_flask_error(400, message)
