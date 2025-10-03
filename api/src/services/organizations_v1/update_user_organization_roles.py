import logging
from typing import Sequence
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege, RoleType
from src.constants.static_role_values import ORG_ADMIN_ID
from src.db.models.entity_models import Organization
from src.db.models.user_models import OrganizationUser, OrganizationUserRole, Role, User, LinkRoleRoleType
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


ADMIN_ROLES = [str(ORG_ADMIN_ID)]


def get_role(db_session: db.Session, role_ids: list[UUID]) -> Sequence[Role]:
    """Retrieve Role objects matching the given role_ids"""
    # TODO: In the future, extend this query to check if the role is either:
    #         - a core role (shared across all orgs), OR
    #         - owned by the organization making the request
    return db_session.execute(select(Role).where(Role.role_id.in_(role_ids)).where(LinkRoleRoleType.role_type == RoleType.ORGANIZATION).where(Role.is_core.is_(True))).scalars().all()


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
    role_ids = data["role_ids"]
    if not can_access(user, {Privilege.MANAGE_ORG_MEMBERS}, organization):
        raise_flask_error(403, "Forbidden")

    if any(role_id in ADMIN_ROLES for role_id in role_ids):
        logger.info("Admin role assignment requested")
        if not can_access(user, {Privilege.MANAGE_ORG_ADMIN_MEMBERS}, organization):
            raise_flask_error(403, "Forbidden")
    # Validate target user exists
    org_user = validate_organization_user(db_session, target_user_id, organization)


    # Fetch and assign new roles
    roles = get_role(db_session, role_ids)

    org_user_roles = [OrganizationUserRole(organization_user=org_user, role=role) for role in roles]

    for our in org_user_roles:
        db_session.add(our)

    org_user.organization_user_roles = org_user_roles
    db_session.add(org_user)

    return org_user.roles
