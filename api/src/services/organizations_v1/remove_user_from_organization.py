import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import OrganizationAuditEvent, Privilege
from src.db.models.entity_models import Organization
from src.db.models.user_models import (
    LinkRolePrivilege,
    OrganizationUser,
    OrganizationUserRole,
    Role,
    User,
)
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.organization_audit import add_audit_event
from src.services.organizations_v1.organization_user_utils import validate_organization_user_exists

logger = logging.getLogger(__name__)


def check_last_admin_protection(
    db_session: db.Session, target_user_id: UUID, organization: Organization
) -> None:
    """Check if removing this user would leave the organization without any admins.

    Args:
        db_session: Database session
        target_user_id: ID of user being removed
        organization: Organization the user is being removed from

    Raises:
        FlaskError: 403 if this would remove the last admin
    """

    # Get all user IDs in the organization who have.MANAGE_ORG_MEMBERS privilege
    admin_user_ids_stmt = (
        select(OrganizationUser.user_id)
        .join(
            OrganizationUserRole,
            OrganizationUser.organization_user_id == OrganizationUserRole.organization_user_id,
        )
        .join(Role, OrganizationUserRole.role_id == Role.role_id)
        .join(LinkRolePrivilege, Role.role_id == LinkRolePrivilege.role_id)
        .where(OrganizationUser.organization_id == organization.organization_id)
        .where(LinkRolePrivilege.privilege == Privilege.MANAGE_ORG_MEMBERS)
    )

    admin_user_ids = set(db_session.execute(admin_user_ids_stmt).scalars().all())

    # Check if target user is an admin and if they're the only admin
    if target_user_id in admin_user_ids and len(admin_user_ids) == 1:
        raise_flask_error(403, message="Cannot remove the last administrator from organization")


def remove_user_from_organization(
    db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID
) -> None:
    """Remove a user from an organization, after validating permissions and business rules.

    Args:
        db_session: Database session
        user: User making the request
        target_user_id: ID of user to remove from organization
        organization_id: ID of organization to remove user from

    Raises:
        FlaskError: 403 if forbidden, 404 if not found
    """
    logger.info("Attempting to remove user from organization")

    # Get organization and validate it exists
    organization = get_organization(db_session, organization_id)

    # Check if requesting user has permission to manage org members
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    # Validate target user is a member of the organization
    org_user = validate_organization_user_exists(db_session, target_user_id, organization)

    # Check last admin protection
    check_last_admin_protection(db_session, target_user_id, organization)

    # Perform the deletion - cascade delete will handle OrganizationUserRole records
    db_session.delete(org_user)

    # Add audit event when a user role is removed
    add_audit_event(
        db_session=db_session,
        organization=organization,
        user=user,
        audit_event=OrganizationAuditEvent.USER_REMOVED,
        target_user=org_user.user,
    )

    logger.info("Successfully removed user from organization")
