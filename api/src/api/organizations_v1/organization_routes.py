import logging
from uuid import UUID

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.organizations_v1.organization_blueprint import organization_blueprint
from src.api.organizations_v1.organization_schemas import (
    OrganizationGetResponseSchema,
    OrganizationUsersResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth
from src.db.models.user_models import UserTokenSession
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.organizations_v1.get_organization import get_organization_and_verify_access
from src.services.organizations_v1.organization_users_list import (
    get_organization_users_and_verify_access,
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
