import logging
from uuid import UUID

import flask

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.api.users.user_schemas import (
    UserGetResponseSchema,
    UserTokenLogoutResponseSchema,
    UserTokenRefreshResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth, refresh_token_expiration
from src.auth.api_key_auth import api_key_auth
from src.auth.login_gov_jwt_auth import get_final_redirect_uri, get_login_gov_redirect_uri
from src.db.models.user_models import UserTokenSession
from src.services.users.get_user import get_user

logger = logging.getLogger(__name__)

LOGIN_DESCRIPTION = """
To use this endpoint, click [this link](/v1/users/login) which will redirect
you to an OAuth provider where you can sign into an account.

Do not try to use the execute option below as OpenAPI will not redirect your browser for you.

The token you receive can then be set to the X-SGG-Token header for authenticating with endpoints.
"""


@user_blueprint.get("/login")
@user_blueprint.doc(responses=[302], description=LOGIN_DESCRIPTION)
def user_login() -> flask.Response:
    logger.info("GET /v1/users/login")

    return response.redirect_response(get_login_gov_redirect_uri())


@user_blueprint.get("/login/callback")
@user_blueprint.input(user_schemas.UserLoginGovCallbackSchema, location="query")
@user_blueprint.doc(responses=[302], hide=True)
def user_login_callback(query_data: dict) -> flask.Response:
    logger.info("GET /v1/users/login/callback")

    # TODO: Do not launch with this, just keeping this here for debugging
    # as we get it built out.
    # logger.info(query_data)

    # You can test what we do in this endpoint manually by:
    #
    # - Go to: http://localhost:8080/v1/users/login
    # - Enter a username in the box
    # - This should end with you on the final redirect (google right now)
    #
    # You can see the log messages above and grab the code.
    #
    # You can use this code to query the final endpoint by doing:
    # curl -X 'POST' 'http://localhost:5001/issuer1/token' -d 'grant_type=authorization_code&client_id=local_mock_client_id&code=<insert code>'
    #
    # The JWT we will process is the id_token returned

    #########################################
    # TODO - implementation remaining
    # Process the data coming back from login.gov after the redirect
    ## Fetch the state UUID from the DB - validate we have it

    # Call the token endpoint with the code
    ## Need to also account for making a JWT to call login.gov (not needed locally)
    ## Probably want to make a "client" for easier mocking

    # Process the token response from login.gov + create a token (Existing draft PR for all of this)

    # Docs - see if there is a way to either describe the "return" values or consider just hiding this route and document it manually.

    # Redirect to the final location for the user
    return response.redirect_response(get_final_redirect_uri("success", "abc123xyz456", False))


@user_blueprint.get("/login/result")
@user_blueprint.doc(hide=True)
def login_result() -> flask.Response:
    logger.info("GET /v1/users/login/result")
    """Dummy endpoint for easily displaying the results of the login flow without the frontend"""

    # Echo back the query args as JSON for some readability
    return flask.jsonify(flask.request.args)


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


@user_blueprint.get("/<uuid:user_id>")
@user_blueprint.output(UserGetResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get(db_session: db.Session, user_id: UUID) -> response.ApiResponse:
    logger.info("GET /v1/users/:user_id")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore

    if user_token_session.user_id == user_id:
        with db_session.begin():
            user = get_user(db_session, user_id)

        return response.ApiResponse(message="Success", data=user)

    raise_flask_error(401, "Unauthorized user")
