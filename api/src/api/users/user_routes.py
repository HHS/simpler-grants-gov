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
    UserDeleteSavedOpportunityResponseSchema,
    UserGetResponseSchema,
    UserSaveOpportunityRequestSchema,
    UserSaveOpportunityResponseSchema,
    UserTokenLogoutResponseSchema,
    UserTokenRefreshResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth, refresh_token_expiration
from src.auth.auth_utils import with_login_redirect_error_handler
from src.auth.login_gov_jwt_auth import get_final_redirect_uri, get_login_gov_redirect_uri
from src.db.models.user_models import UserSavedOpportunity, UserTokenSession
from src.services.users.get_user import get_user
from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.services.users.login_gov_callback_handler import (
    handle_login_gov_callback_request,
    handle_login_gov_token,
)

logger = logging.getLogger(__name__)

LOGIN_DESCRIPTION = """
To use this endpoint, click [this link](/v1/users/login) which will redirect
you to an OAuth provider where you can sign into an account.

Do not try to use the execute option below as OpenAPI will not redirect your browser for you.

The token you receive can then be set to the X-SGG-Token header for authenticating with endpoints.
"""


@user_blueprint.get("/login")
@user_blueprint.doc(responses=[302], description=LOGIN_DESCRIPTION)
@with_login_redirect_error_handler()
@flask_db.with_db_session()
def user_login(db_session: db.Session) -> flask.Response:
    logger.info("GET /v1/users/login")
    with db_session.begin():
        redirect_uri = get_login_gov_redirect_uri(db_session)

    return response.redirect_response(redirect_uri)


@user_blueprint.get("/login/callback")
@user_blueprint.input(user_schemas.UserLoginGovCallbackSchema, location="query")
@user_blueprint.doc(responses=[302], hide=True)
@with_login_redirect_error_handler()
@flask_db.with_db_session()
def user_login_callback(db_session: db.Session, query_data: dict) -> flask.Response:
    logger.info("GET /v1/users/login/callback")

    # We process this in two separate DB transactions
    # as we delete state at the end of the first handler
    # even if it were to later error to avoid replay attacks
    with db_session.begin():
        data = handle_login_gov_callback_request(query_data, db_session)
    with db_session.begin():
        result = handle_login_gov_token(db_session, data)

    # Redirect to the final location for the user
    return response.redirect_response(
        get_final_redirect_uri("success", result.token, result.is_user_new)
    )


@user_blueprint.get("/login/result")
@user_blueprint.doc(hide=True)
def login_result() -> flask.Response:
    logger.info("GET /v1/users/login/result")
    """Dummy endpoint for easily displaying the results of the login flow without the frontend"""

    # Echo back the query args as JSON for some readability
    return flask.jsonify(flask.request.args)


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


@user_blueprint.post("/<uuid:user_id>/saved-opportunities")
@user_blueprint.input(UserSaveOpportunityRequestSchema, location="json")
@user_blueprint.output(UserSaveOpportunityResponseSchema)
@user_blueprint.doc(responses=[200, 401])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_save_opportunity(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id/saved-opportunities")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(401, "Unauthorized user")

    # Create the saved opportunity record
    saved_opportunity = UserSavedOpportunity(
        user_id=user_id, opportunity_id=json_data["opportunity_id"]
    )

    with db_session.begin():
        db_session.add(saved_opportunity)

    logger.info(
        "Saved opportunity for user",
        extra={
            "user.id": str(user_id),
            "opportunity.id": json_data["opportunity_id"],
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.delete("/<uuid:user_id>/saved-opportunities/<int:opportunity_id>")
@user_blueprint.output(UserDeleteSavedOpportunityResponseSchema)
@user_blueprint.doc(responses=[200, 401, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_delete_saved_opportunity(
    db_session: db.Session, user_id: UUID, opportunity_id: int
) -> response.ApiResponse:
    logger.info("DELETE /v1/users/:user_id/saved-opportunities/:opportunity_id")

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(401, "Unauthorized user")

    with db_session.begin():
        # Try to find and delete the saved opportunity
        result = delete_saved_opportunity(db_session, user_id, opportunity_id)

    if result == 0:
        raise_flask_error(404, "Saved opportunity not found")

    db_session.commit()

    return response.ApiResponse(message="Success")
