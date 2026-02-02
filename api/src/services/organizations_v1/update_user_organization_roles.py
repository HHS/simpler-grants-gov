import logging
from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import OrganizationAuditEvent, Privilege, RoleType
from src.db.models.user_models import LinkRoleRoleType, OrganizationUserRole, Role, User
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.organization_audit import add_audit_event
from src.services.organizations_v1.organization_user_utils import validate_organization_user_exists

logger = logging.getLogger(__name__)


def validate_roles(db_session: db.Session, role_ids: set[UUID]) -> Sequence[Role]:
    """Validate provided roles and return them"""
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

    return roles


def update_user_organization_roles(
    db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID, data: dict
) -> list[Role]:
    """Update roles of a user in an organization, after validating permissions and membership."""
    logger.info("Attempting to update roles for user")
    # Lookup organization
    organization = get_organization(db_session, organization_id)
    # Permission checks
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    # Validate target user exists
    org_user = validate_organization_user_exists(db_session, target_user_id, organization)

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

    # Add audit event when a user role is updated
    add_audit_event(
        db_session=db_session,
        organization=organization,
        user=user,
        audit_event=OrganizationAuditEvent.USER_UPDATED,
        target_user=org_user.user,
    )

    # Push changes to database and refresh
    db_session.flush()
    db_session.refresh(org_user)

    return org_user.roles
