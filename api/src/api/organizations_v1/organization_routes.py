import logging
from uuid import UUID

from sqlalchemy.orm import joinedload

from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.api.organizations_v1.organization_blueprint import organization_blueprint
from src.api.organizations_v1.organization_schemas import OrganizationGetResponseSchema
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import api_jwt_auth
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import Organization
from src.db.models.user_models import User, UserTokenSession

logger = logging.getLogger(__name__)


@organization_blueprint.get("/<uuid:organization_id>")
@organization_blueprint.output(OrganizationGetResponseSchema)
@organization_blueprint.doc(responses=[200, 401, 403, 404])
@organization_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def organization_get(db_session: db.Session, organization_id: UUID) -> response.ApiResponse:
    """Get organization information by ID"""
    logger.info("GET /v1/organizations/:organization_id")

    # Get authenticated user
    user_token_session: UserTokenSession = api_jwt_auth.get_user_token_session()
    user_id = user_token_session.user_id

    # Query organization with SAM.gov entity data
    organization = (
        db_session.query(Organization)
        .options(joinedload(Organization.sam_gov_entity))
        .filter(Organization.organization_id == organization_id)
        .first()
    )

    if not organization:
        logger.info(
            "Organization not found",
            extra={
                "organization_id": organization_id,
                "user_id": user_id,
            },
        )
        raise_flask_error(404, "Organization not found")

    # Get the user for privilege checking
    user = db_session.query(User).filter(User.user_id == user_id).first()
    if not user:
        logger.error(
            "User not found for token session",
            extra={
                "user_id": user_id,
                "organization_id": organization_id,
            },
        )
        raise_flask_error(401, "Unauthorized")

    # Check if user has VIEW_ORG_MEMBERSHIP privilege for this organization
    if not can_access(user, {Privilege.VIEW_ORG_MEMBERSHIP}, organization):
        logger.info(
            "User does not have VIEW_ORG_MEMBERSHIP privilege for organization",
            extra={
                "organization_id": organization_id,
                "user_id": user_id,
            },
        )
        raise_flask_error(403, "Forbidden")

    logger.info(
        "Successfully retrieved organization",
        extra={
            "organization_id": organization_id,
            "user_id": user_id,
            "has_sam_gov_entity": organization.sam_gov_entity is not None,
        },
    )

    return response.ApiResponse(message="Success", data=organization)
