from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import LinkRoleRoleType, Role, User
from src.services.organizations_v1.get_organization import get_organization


def get_organization_roles_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> Sequence[Role]:
    """Verifies that the user has access to the specified organization,
    then returns the roles associated with that organization.

    Note: Currently only core (default) roles are returned, not custom roles."""
    # Retrieve organization (raises 404 if not found)
    organization = get_organization(db_session, organization_id)

    # Enforce privilege check
    check_user_access(
        db_session,
        user,
        {Privilege.VIEW_ORG_MEMBERSHIP},
        organization,
    )
    return get_organization_roles(db_session)


def get_organization_roles(db_session: db.Session) -> Sequence[Role]:
    """Returns the organization core roles."""
    stmt = (
        select(Role)
        .join(LinkRoleRoleType)
        .where(LinkRoleRoleType.role_type == RoleType.ORGANIZATION)
        .where(Role.is_core.is_(True))
    )

    roles = db_session.execute(stmt).scalars().all()

    return roles
