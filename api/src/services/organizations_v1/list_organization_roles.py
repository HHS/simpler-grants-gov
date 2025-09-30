from uuid import UUID

from src.adapters import db
from src.constants.static_role_values import ORG_ADMIN, ORG_MEMBER
from src.db.models.user_models import Role, User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


def get_organization_roles_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> list[Role]:
    """Verifies that the user has access to the specified organization,
    then returns the core roles associated with that organization.

    Note: Currently only core (default) roles are returned, not custom roles."""
    # We are currently only grabbing the core roles
    get_organization_and_verify_access(db_session, user, organization_id)
    return get_organization_roles()


def get_organization_roles() -> list[Role]:
    """Returns the organization core roles."""
    core_org_roles = [ORG_ADMIN, ORG_MEMBER]

    return core_org_roles
