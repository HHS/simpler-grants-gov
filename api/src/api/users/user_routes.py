import logging

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.api.users.user_schemas import UserTokenLogoutResponseSchema, UserTokenRefreshResponseSchema, \
    UserGetResponseSchema
from src.auth.api_jwt_auth import api_jwt_auth, refresh_token_expiration
from src.auth.api_key_auth import api_key_auth
from src.db.models.user_models import UserTokenSession

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


@user_blueprint.post("/token/logout")
@user_blueprint.output(UserTokenLogoutResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_token_logout(db_session: db.Session) -> response.ApiResponse:
    logger.info("POST /v1/users/token/logout")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore
    with db_session.begin():
        user_token_session.is_valid = False
        db_session.add(user_token_session)

    logger.info(
        "Logged out a user",
        extra={
            "user_token_session.token_id": str(user_token_session.token_id),
            "user_token_session.user_id": str(user_token_session.user_id),
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.post("/token/refresh")
@user_blueprint.output(UserTokenRefreshResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_token_refresh(db_session: db.Session) -> response.ApiResponse:
    logger.info("POST /v1/users/token/refresh")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore

    with db_session.begin():
        refresh_token_expiration(user_token_session)
        db_session.add(user_token_session)

    logger.info(
        "Refreshed a user token",
        extra={
            "user_token_session.token_id": str(user_token_session.token_id),
            "user_token_session.user_id": str(user_token_session.user_id),
        },
    )

    return response.ApiResponse(message="Success")

@user_blueprint.post("/<int:user_id>")
@user_blueprint.output(UserGetResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get(db_session: db.Session, user_id: int) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id")

    with db_session.begin():
        user = get_user(db_session, user_id)


    return response.ApiResponse(message="Success", data=user)
