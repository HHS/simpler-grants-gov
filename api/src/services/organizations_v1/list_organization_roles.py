from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.constants.lookup_constants import RoleType
from src.db.models.user_models import LinkRoleRoleType, Role, User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


def get_organization_roles_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> Sequence[Role]:
    """Verifies that the user has access to the specified organization,
    then returns the roles associated with that organization.

    Note: Currently only core (default) roles are returned, not custom roles."""
    get_organization_and_verify_access(db_session, user, organization_id)
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
