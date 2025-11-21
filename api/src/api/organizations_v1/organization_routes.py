import logging
from uuid import UUID

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.organizations_v1.organization_blueprint import organization_blueprint
from src.api.organizations_v1.organization_schemas import (
    OrganizationCreateInvitationRequestSchema,
    OrganizationCreateInvitationResponseSchema,
    OrganizationGetResponseSchema,
    OrganizationIgnoreLegacyUserRequestSchema,
    OrganizationIgnoreLegacyUserResponseSchema,
    OrganizationInvitationListRequestSchema,
    OrganizationInvitationListResponseSchema,
    OrganizationListRolesResponseSchema,
    OrganizationRemoveUserResponseSchema,
    OrganizationUpdateUserRolesRequestSchema,
    OrganizationUpdateUserRolesResponseSchema,
    OrganizationUsersResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth
from src.db.models.user_models import UserTokenSession
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.organizations_v1.create_organization_invitation import (
    create_organization_invitation,
)
from src.services.organizations_v1.get_organization import get_organization_and_verify_access
from src.services.organizations_v1.ignore_legacy_user_organization import (
    ignore_legacy_user_organization,
)
from src.services.organizations_v1.list_organization_invitations import (
    list_organization_invitations_and_verify_access,
)
from src.services.organizations_v1.list_organization_roles import (
    get_organization_roles_and_verify_access,
)
from src.services.organizations_v1.organization_users_list import (
    get_organization_users_and_verify_access,
)
from src.services.organizations_v1.remove_user_from_organization import (
    remove_user_from_organization,
)
from src.services.organizations_v1.update_user_organization_roles import (
    update_user_organization_roles,
)

logger = logging.getLogger(__name__)


@organization_blueprint.get("/<uuid:organization_id>")
@organization_blueprint.output(OrganizationGetResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_get(db_session: db.Session, organization_id: UUID) -> response.ApiResponse:
    """Get organization information by ID"""
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("GET /v1/organizations/:organization_id")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        # This prevents DetachedInstanceError when accessing user relationships
        db_session.add(user_token_session)

        # Get organization and verify access using service layer
        organization = get_organization_and_verify_access(
            db_session, user_token_session.user, organization_id
        )

    return response.ApiResponse(message="Success", data=organization)


@organization_blueprint.post("/<uuid:organization_id>/users")
@organization_blueprint.output(OrganizationUsersResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_users_list(db_session: db.Session, organization_id: UUID) -> response.ApiResponse:
    """Get all users in an organization"""
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("POST /v1/organizations/:organization_id/users")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        db_session.add(user_token_session)

        # Get organization users using service layer
        users = get_organization_users_and_verify_access(
            db_session, user_token_session.user, organization_id
        )

    return response.ApiResponse(message="Success", data=users)


@organization_blueprint.post("/<uuid:organization_id>/roles/list")
@organization_blueprint.output(OrganizationListRolesResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_list_roles(db_session: db.Session, organization_id: UUID) -> response.ApiResponse:
    """List organization roles"""
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("GET /v1/organizations/:organization_id/roles/list")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        db_session.add(user_token_session)
        roles = get_organization_roles_and_verify_access(
            db_session, user_token_session.user, organization_id
        )

    return response.ApiResponse(message="Success", data=roles)


@organization_blueprint.delete("/<uuid:organization_id>/users/<uuid:user_id>")
@organization_blueprint.output(OrganizationRemoveUserResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_remove_user(
    db_session: db.Session, organization_id: UUID, user_id: UUID
) -> response.ApiResponse:
    """Remove a user from an organization"""
    add_extra_data_to_current_request_logs(
        {"organization_id": organization_id, "target_user_id": user_id}
    )
    logger.info("DELETE /v1/organizations/:organization_id/users/:user_id")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        db_session.add(user_token_session)

        # Remove user from organization using service layer
        remove_user_from_organization(db_session, user_token_session.user, user_id, organization_id)

    return response.ApiResponse(message="Success", data=None)


@organization_blueprint.put("/<uuid:organization_id>/users/<uuid:user_id>")
@organization_blueprint.input(OrganizationUpdateUserRolesRequestSchema, location="json")
@organization_blueprint.output(OrganizationUpdateUserRolesResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_update_user_roles(
    db_session: db.Session, organization_id: UUID, user_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Update roles for an organization user"""
    add_extra_data_to_current_request_logs(
        {"organization_id": organization_id, "target_user_id": user_id}
    )
    logger.info("PUT /v1/organizations/:organization_id/users/:user_id")
    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()
    with db_session.begin():
        db_session.add(user_token_session)
        roles = update_user_organization_roles(
            db_session, user_token_session.user, user_id, organization_id, json_data
        )

    return response.ApiResponse(message="Success", data=roles)


@organization_blueprint.post("/<uuid:organization_id>/invitations")
@organization_blueprint.input(OrganizationCreateInvitationRequestSchema, location="json")
@organization_blueprint.output(OrganizationCreateInvitationResponseSchema)
@organization_blueprint.doc(responses=[200, 400, 401, 403, 404, 422])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_create_invitation(
    db_session: db.Session, organization_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Create an invitation for a new organization member"""
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("POST /v1/organizations/:organization_id/invitations")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        db_session.add(user_token_session)

        # Create invitation using service layer
        invitation_data = create_organization_invitation(
            db_session, user_token_session.user, organization_id, json_data
        )

    return response.ApiResponse(message="Success", data=invitation_data)


@organization_blueprint.post("/<uuid:organization_id>/invitations/list")
@organization_blueprint.input(OrganizationInvitationListRequestSchema, location="json")
@organization_blueprint.output(OrganizationInvitationListResponseSchema)
@organization_blueprint.doc(responses=[200, 400, 401, 403, 404, 422])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_invitations_list(
    db_session: db.Session, organization_id: UUID, json_data: dict
) -> response.ApiResponse:
    """List organization invitations with filtering"""
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("POST /v1/organizations/:organization_id/invitations/list")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        db_session.add(user_token_session)

        # Get organization invitations using service layer
        invitations = list_organization_invitations_and_verify_access(
            db_session=db_session,
            user=user_token_session.user,
            organization_id=organization_id,
            filters=json_data.get("filters"),
        )

    return response.ApiResponse(message="Success", data=invitations)


@organization_blueprint.post("/<uuid:organization_id>/legacy-users/ignore")
@organization_blueprint.input(OrganizationIgnoreLegacyUserRequestSchema, location="json")
@organization_blueprint.output(OrganizationIgnoreLegacyUserResponseSchema)
@organization_blueprint.doc(responses=[200, 400, 401, 403, 404, 422])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_ignore_legacy_user(
    db_session: db.Session, organization_id: UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"organization_id": organization_id})
    logger.info("POST /v1/organizations/:organization_id/legacy-users/ignore")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()

    with db_session.begin():
        # Add the user from the token session to our current session
        db_session.add(user_token_session)

        ignore_legacy_user_organization(
            db_session, user_token_session.user, organization_id, json_data
        )

    return response.ApiResponse(message="Success")
