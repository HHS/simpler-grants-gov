import logging
from datetime import timedelta

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.api.users.user_schemas import UserTokenRefreshResponseSchema
from src.auth.api_jwt_auth import api_jwt_auth, get_config
from src.auth.api_key_auth import api_key_auth
from src.db.models.user_models import UserTokenSession
from src.util import datetime_util

logger = logging.getLogger(__name__)


@user_blueprint.post("/token")
@user_blueprint.input(
    user_schemas.UserTokenHeaderSchema, location="headers", arg_name="x_oauth_login_gov"
)
@user_blueprint.output(user_schemas.UserTokenResponseSchema)
@user_blueprint.auth_required(api_key_auth)
def user_token(x_oauth_login_gov: dict) -> response.ApiResponse:
    logger.info("POST /v1/users/token")

    if x_oauth_login_gov:
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
    logger.info(message)

    raise_flask_error(400, message)


@user_blueprint.post("/token/refresh")
@user_blueprint.output(UserTokenRefreshResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_token_refresh(db_session: db.Session) -> response.ApiResponse:
    logger.info("POST /v1/users/token/refresh")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore
    config = get_config()
    expiration_time = datetime_util.utcnow() + timedelta(minutes=config.token_expiration_minutes)

    with db_session.begin():
        user_token_session.expires_at = expiration_time
        db_session.add(user_token_session)

    logger.info(
        "Refreshed a user token",
        extra={
            "user_token_session.token_id": str(user_token_session.token_id),
            "user_token_session.user_id": str(user_token_session.user_id),
        },
    )

    return response.ApiResponse(message="Success")
