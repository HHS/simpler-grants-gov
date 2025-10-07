import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.entity_models import Organization
from src.db.models.user_models import (
    LinkRoleRoleType,
    OrganizationUser,
    OrganizationUserRole,
    Role,
    User,
)
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


def validate_roles(db_session: db.Session, role_ids: set[UUID]) -> None:
    """Validate provided roles"""
    # TODO: In the future, extend this query to check if the role is either:
    #         - a core role (shared across all orgs), OR
    #         - owned by the organization making the request
    roles = (
        db_session.execute(
            select(Role)
            .join(LinkRoleRoleType, LinkRoleRoleType.role_id == Role.role_id)
            .where(Role.role_id.in_(role_ids))
            .where(LinkRoleRoleType.role_type == RoleType.ORGANIZATION)
            .where(Role.is_core.is_(True))
        )
        .scalars()
        .all()
    )

    if len(roles) != len(role_ids):
        missing = role_ids - {r.role_id for r in roles}
        raise_flask_error(404, message=f"Could not find the following role IDs: {missing}")


def validate_organization_user(
    db_session: db.Session, user_id: UUID, organization: Organization
) -> OrganizationUser:
    """Validate that the user is a member of the specified organization"""
    org_user = db_session.execute(
        select(OrganizationUser)
        .where(OrganizationUser.organization_id == organization.organization_id)
        .where(OrganizationUser.user_id == user_id)
    ).scalar_one_or_none()
    if not org_user:
        raise_flask_error(404, message=f"Could not find User with ID {user_id}")
    return org_user


def update_user_organization_roles(
    db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID, data: dict
) -> list[Role]:
    """Update roles of a user in an organization, after validating permissions and membership."""
    logger.info("Attempting to update roles for user")
    # Lookup organization
    organization = get_organization(db_session, organization_id)
    # Permission checks
    if not can_access(user, {Privilege.MANAGE_ORG_MEMBERS}, organization):
        raise_flask_error(403, "Forbidden")

    # Validate target user exists
    org_user = validate_organization_user(db_session, target_user_id, organization)

    existing_role_ids = {our.role_id for our in org_user.organization_user_roles}
    new_role_ids = set(data["role_ids"])
    if existing_role_ids == new_role_ids:
        logger.info("User has the same roles, skipping")
        return org_user.roles

    # Validate and update roles
    validate_roles(db_session, new_role_ids)
    # Delete roles
    for org_role in [
        r
        for r in org_user.organization_user_roles
        if r.role_id in (existing_role_ids - new_role_ids)
    ]:
        db_session.delete(org_role)

    # Add new roles
    for role_id in new_role_ids - existing_role_ids:
        db_session.add(OrganizationUserRole(organization_user=org_user, role_id=role_id))

    # Push changes to database and refresh
    db_session.flush()
    db_session.refresh(org_user)

    return org_user.roles
