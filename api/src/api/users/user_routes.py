import logging
from uuid import UUID

import flask

import src.adapters.search.flask_opensearch as flask_opensearch
from src.adapters import db, search
from src.adapters.db import flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.api.users.user_schemas import (
    UserApiKeyCreateRequestSchema,
    UserApiKeyCreateResponseSchema,
    UserApiKeyDeleteResponseSchema,
    UserApiKeyListRequestSchema,
    UserApiKeyListResponseSchema,
    UserApiKeyRenameRequestSchema,
    UserApiKeyRenameResponseSchema,
    UserApplicationListRequestSchema,
    UserApplicationListResponseSchema,
    UserCanAccessRequestSchema,
    UserCanAccessResponseSchema,
    UserDeleteSavedOpportunityResponseSchema,
    UserDeleteSavedSearchResponseSchema,
    UserGetResponseSchema,
    UserGetRolesAndPrivilegesResponseSchema,
    UserInvitationListRequestSchema,
    UserInvitationListResponseSchema,
    UserOrganizationsResponseSchema,
    UserResponseOrgInvitationRequestSchema,
    UserResponseOrgInvitationResponseSchema,
    UserSavedOpportunitiesRequestSchema,
    UserSavedOpportunitiesResponseSchema,
    UserSavedSearchesRequestSchema,
    UserSavedSearchesResponseSchema,
    UserSaveOpportunityRequestSchema,
    UserSaveOpportunityResponseSchema,
    UserSaveSearchRequestSchema,
    UserSaveSearchResponseSchema,
    UserTokenLogoutResponseSchema,
    UserTokenRefreshResponseSchema,
    UserUpdateProfileRequestSchema,
    UserUpdateProfileResponseSchema,
    UserUpdateSavedSearchRequestSchema,
    UserUpdateSavedSearchResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth, refresh_token_expiration
from src.auth.auth_utils import with_login_redirect_error_handler
from src.auth.login_gov_jwt_auth import get_final_redirect_uri, get_login_gov_redirect_uri
from src.db.models.user_models import UserTokenSession
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.users.create_api_key import create_api_key
from src.services.users.create_saved_opportunity import create_saved_opportunity
from src.services.users.create_saved_search import create_saved_search
from src.services.users.delete_api_key import delete_api_key
from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.services.users.delete_saved_search import delete_saved_search
from src.services.users.get_roles_and_privileges import get_roles_and_privileges
from src.services.users.get_saved_opportunities import get_saved_opportunities
from src.services.users.get_saved_searches import get_saved_searches
from src.services.users.get_user import get_user
from src.services.users.get_user_api_keys import get_user_api_keys
from src.services.users.get_user_applications import get_user_applications
from src.services.users.get_user_invitations import get_user_invitations
from src.services.users.get_user_organizations import get_user_organizations
from src.services.users.login_gov_callback_handler import (
    handle_login_gov_callback_request,
    handle_login_gov_token,
)
from src.services.users.org_invitation_response import org_invitation_response
from src.services.users.rename_api_key import rename_api_key
from src.services.users.update_saved_searches import update_saved_search
from src.services.users.update_user_profile import update_user_profile
from src.services.users.user_can_access import check_user_can_access

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

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()
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

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

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
@user_blueprint.doc(responses=[200, 401, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get(db_session: db.Session, user_id: UUID) -> response.ApiResponse:
    logger.info("GET /v1/users/:user_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    if user_token_session.user_id == user_id:
        with db_session.begin():
            user = get_user(db_session, user_id)

        return response.ApiResponse(message="Success", data=user)

    raise_flask_error(401, "Unauthorized user")


@user_blueprint.get("/<uuid:user_id>/organizations")
@user_blueprint.output(UserOrganizationsResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_organizations(db_session: db.Session, user_id: UUID) -> response.ApiResponse:
    logger.info("GET /v1/users/:user_id/organizations")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        organizations = get_user_organizations(db_session, user_id)

    logger.info(
        "Retrieved organizations for user",
        extra={
            "user_id": user_id,
            "organization_count": len(organizations),
        },
    )

    return response.ApiResponse(message="Success", data=organizations)


@user_blueprint.post("/<uuid:user_id>/applications")
@user_blueprint.input(UserApplicationListRequestSchema, location="json")
@user_blueprint.output(UserApplicationListResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_applications(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Get all applications for a user"""
    logger.info("POST /v1/users/:user_id/applications")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        applications = get_user_applications(db_session, user_id)

    logger.info(
        "Retrieved applications for user",
        extra={
            "user_id": user_id,
            "application_count": len(applications),
        },
    )

    return response.ApiResponse(message="Success", data=applications)


@user_blueprint.post("/<uuid:user_id>/saved-opportunities")
@user_blueprint.input(UserSaveOpportunityRequestSchema, location="json")
@user_blueprint.output(UserSaveOpportunityResponseSchema)
@user_blueprint.doc(responses=[200, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_save_opportunity(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id/saved-opportunities")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        create_saved_opportunity(db_session, user_id, json_data)

    logger.info(
        "Saved opportunity for user",
        extra={
            "user_id": user_id,
            "opportunity_id": json_data["opportunity_id"],
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.delete("/<uuid:user_id>/saved-opportunities/<uuid:opportunity_id>")
@user_blueprint.output(UserDeleteSavedOpportunityResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_delete_saved_opportunity(
    db_session: db.Session, user_id: UUID, opportunity_id: UUID
) -> response.ApiResponse:
    logger.info("DELETE /v1/users/:user_id/saved-opportunities/:opportunity_id")
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        # Delete the saved opportunity
        delete_saved_opportunity(db_session, user_id, opportunity_id)

    return response.ApiResponse(message="Success")


@user_blueprint.delete("/<uuid:user_id>/saved-opportunities/<int:legacy_opportunity_id>")
@user_blueprint.output(UserDeleteSavedOpportunityResponseSchema)
@user_blueprint.doc(responses=[200, 401, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_delete_saved_opportunity_legacy(
    db_session: db.Session, user_id: UUID, legacy_opportunity_id: int
) -> response.ApiResponse:
    logger.info("DELETE /v1/users/:user_id/saved-opportunities/:opportunity_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(401, "Unauthorized user")

    with db_session.begin():
        # Delete the saved opportunity
        delete_saved_opportunity(db_session, user_id, legacy_opportunity_id)

    return response.ApiResponse(message="Success")


@user_blueprint.post("/<uuid:user_id>/saved-opportunities/list")
@user_blueprint.input(UserSavedOpportunitiesRequestSchema, location="json")
@user_blueprint.output(UserSavedOpportunitiesResponseSchema)
@user_blueprint.doc(responses=[200, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_saved_opportunities(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id/saved-opportunities/list")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    # Get all saved opportunities for the user with their related opportunity data
    saved_opportunities, pagination_info = get_saved_opportunities(db_session, user_id, json_data)

    return response.ApiResponse(
        message="Success",
        data=saved_opportunities,
        pagination_info=pagination_info,
    )


@user_blueprint.post("/<uuid:user_id>/saved-searches")
@user_blueprint.input(UserSaveSearchRequestSchema, location="json")
@user_blueprint.output(UserSaveSearchResponseSchema)
@user_blueprint.doc(responses=[200, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
@flask_opensearch.with_search_client()
def user_save_search(
    search_client: search.SearchClient, db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id/saved-searches")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        saved_search = create_saved_search(search_client, db_session, user_id, json_data)

    logger.info(
        "Saved search for user",
        extra={
            "user_id": user_id,
            "saved_search_id": saved_search.saved_search_id,
        },
    )

    return response.ApiResponse(message="Success", data=saved_search)


@user_blueprint.delete("/<uuid:user_id>/saved-searches/<uuid:saved_search_id>")
@user_blueprint.output(UserDeleteSavedSearchResponseSchema)
@user_blueprint.doc(responses=[200, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_delete_saved_search(
    db_session: db.Session, user_id: UUID, saved_search_id: UUID
) -> response.ApiResponse:
    logger.info("DELETE /v1/users/:user_id/saved-searches/:saved_search_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        delete_saved_search(db_session, user_id, saved_search_id)

    logger.info(
        "Deleted saved search",
        extra={
            "user_id": user_id,
            "saved_search_id": saved_search_id,
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.post("/<uuid:user_id>/saved-searches/list")
@user_blueprint.input(UserSavedSearchesRequestSchema, location="json")
@user_blueprint.output(UserSavedSearchesResponseSchema)
@user_blueprint.doc(responses=[200, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_saved_searches(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("POST /v1/users/:user_id/saved-searches/list")
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    saved_searches, pagination_info = get_saved_searches(db_session, user_id, json_data)

    return response.ApiResponse(
        message="Success",
        data=saved_searches,
        pagination_info=pagination_info,
    )


@user_blueprint.put("/<uuid:user_id>/saved-searches/<uuid:saved_search_id>")
@user_blueprint.input(UserUpdateSavedSearchRequestSchema, location="json")
@user_blueprint.output(UserUpdateSavedSearchResponseSchema)
@user_blueprint.doc(responses=[200, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_update_saved_search(
    db_session: db.Session, user_id: UUID, saved_search_id: UUID, json_data: dict
) -> response.ApiResponse:
    logger.info("PUT /v1/users/:user_id/saved-searches/:saved_search_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        updated_saved_search = update_saved_search(db_session, user_id, saved_search_id, json_data)

    logger.info(
        "Updated saved search for user",
        extra={
            "user_id": user_id,
            "saved_search_id": updated_saved_search.saved_search_id,
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.post("/<uuid:user_id>/api-keys")
@user_blueprint.input(UserApiKeyCreateRequestSchema, location="json")
@user_blueprint.output(UserApiKeyCreateResponseSchema)
@user_blueprint.doc(responses=[200, 400, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_create_api_key(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Create a new API key for the authenticated user"""
    add_extra_data_to_current_request_logs({"user_id": user_id})
    logger.info("POST /v1/users/:user_id/api-keys")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        api_key = create_api_key(db_session, user_id, json_data)

    logger.info(
        "Created API key for user",
        extra={
            "user_id": user_id,
            "api_key_id": api_key.api_key_id,
            "key_name": api_key.key_name,
        },
    )

    return response.ApiResponse(message="Success", data=api_key)


@user_blueprint.delete("/<uuid:user_id>/api-keys/<uuid:api_key_id>")
@user_blueprint.output(UserApiKeyDeleteResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_delete_api_key(
    db_session: db.Session, user_id: UUID, api_key_id: UUID
) -> response.ApiResponse:
    """Delete (deactivate) an API key for the authenticated user"""
    add_extra_data_to_current_request_logs({"user_id": user_id, "api_key_id": api_key_id})
    logger.info("DELETE /v1/users/:user_id/api-keys/:api_key_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        delete_api_key(db_session, user_id, api_key_id)

    logger.info(
        "Deleted API key for user",
        extra={
            "user_id": user_id,
            "api_key_id": api_key_id,
        },
    )

    return response.ApiResponse(message="Success")


@user_blueprint.put("/<uuid:user_id>/api-keys/<uuid:api_key_id>")
@user_blueprint.input(UserApiKeyRenameRequestSchema, location="json")
@user_blueprint.output(UserApiKeyRenameResponseSchema)
@user_blueprint.doc(responses=[200, 400, 401, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_rename_api_key(
    db_session: db.Session, user_id: UUID, api_key_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Rename an existing API key for the authenticated user"""
    add_extra_data_to_current_request_logs({"user_id": user_id, "api_key_id": api_key_id})
    logger.info("PUT /v1/users/:user_id/api-keys/:api_key_id")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        api_key = rename_api_key(db_session, user_id, api_key_id, json_data)

    return response.ApiResponse(message="Success", data=api_key)


@user_blueprint.post("/<uuid:user_id>/api-keys/list")
@user_blueprint.input(UserApiKeyListRequestSchema, location="json")
@user_blueprint.output(UserApiKeyListResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_list_api_keys(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """List all API keys for the authenticated user"""
    add_extra_data_to_current_request_logs({"user_id": user_id})
    logger.info("POST /v1/users/:user_id/api-keys/list")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        api_keys = get_user_api_keys(db_session, user_id)

    return response.ApiResponse(message="Success", data=api_keys)


@user_blueprint.put("/<uuid:user_id>/profile")
@user_blueprint.input(UserUpdateProfileRequestSchema, location="json")
@user_blueprint.output(UserUpdateProfileResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_profile_update(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update the authenticated user's profile data'"""
    add_extra_data_to_current_request_logs(
        {
            "user_id": user_id,
        }
    )
    logger.info("PUT /v1/users/:user_id/profile")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        updated_user_profile = update_user_profile(db_session, user_id, json_data)

    logger.info(
        "Updated profile for user",
        extra={
            "user_profile_id": updated_user_profile.user_profile_id,
        },
    )

    return response.ApiResponse(message="Success", data=updated_user_profile)


@user_blueprint.post("/<uuid:user_id>/privileges")
@user_blueprint.output(UserGetRolesAndPrivilegesResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_roles_and_privileges(db_session: db.Session, user_id: UUID) -> response.ApiResponse:
    """Get the roles and privileges for the authenticated user"""
    add_extra_data_to_current_request_logs(
        {
            "user_id": user_id,
        }
    )
    logger.info("POST /v1/users/:user_id/privileges")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        roles_and_privileges = get_roles_and_privileges(db_session, user_id)

    return response.ApiResponse(message="Success", data=roles_and_privileges)


@user_blueprint.post("/<uuid:user_id>/can_access")
@user_blueprint.input(UserCanAccessRequestSchema, location="json")
@user_blueprint.output(UserCanAccessResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403, 404])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_can_access(db_session: db.Session, user_id: UUID, json_data: dict) -> response.ApiResponse:
    """Check user access for a given resource"""
    add_extra_data_to_current_request_logs(
        {
            "user_id": user_id,
        }
    )
    logger.info("POST /v1/users/:user_id/can_access")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()
    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")
    with db_session.begin():
        db_session.add(user_token_session)
        check_user_can_access(db_session, user_token_session.user, json_data)

    return response.ApiResponse(message="Success")


@user_blueprint.post("/<uuid:user_id>/invitations/list")
@user_blueprint.input(UserInvitationListRequestSchema, location="json")
@user_blueprint.output(UserInvitationListResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_get_invitations(
    db_session: db.Session, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Get all invitations for a user by matching their login.gov email"""
    add_extra_data_to_current_request_logs({"user_id": user_id})
    logger.info("POST /v1/users/:user_id/invitations/list")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        invitations = get_user_invitations(db_session, user_id)

    logger.info(
        "Retrieved invitations for user",
        extra={
            "user_id": user_id,
            "invitation_count": len(invitations),
        },
    )

    return response.ApiResponse(message="Success", data=invitations)


@user_blueprint.put("/<uuid:user_id>/invitations/<uuid:invitation_id>")
@user_blueprint.input(UserResponseOrgInvitationRequestSchema)
@user_blueprint.output(UserResponseOrgInvitationResponseSchema)
@user_blueprint.doc(responses=[200, 401, 403, 404, 422])
@user_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_response_org_invitation(
    db_session: db.Session, user_id: UUID, invitation_id: UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(
        {
            "user_id": user_id,
            "invitation_id": invitation_id,
        }
    )
    logger.info("POST /v1/users/:user_id/invitations/{invitation_id}")

    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    # Verify the authenticated user matches the requested user_id
    if user_token_session.user_id != user_id:
        raise_flask_error(403, "Forbidden")

    with db_session.begin():
        db_session.add(user_token_session)
        invitation_response = org_invitation_response(
            db_session, user_token_session.user, invitation_id, json_data
        )

    return response.ApiResponse(message="Success", data=invitation_response)
