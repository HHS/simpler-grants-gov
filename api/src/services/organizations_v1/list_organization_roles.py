from uuid import UUID

from src.adapters import db
from src.constants.static_role_values import ORG_ADMIN, ORG_MEMBER
from src.db.models.user_models import Role, User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


def get_organization_roles_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> list[Role]:
    """Get all the roles for the organization specified"""
    # We are currently only grabbing the core roles
    get_organization_and_verify_access(db_session, user, organization_id)
    return get_organization_roles()


def get_organization_roles() -> list[Role]:
    """Returns the organization core roles."""
    core_org_roles = [ORG_ADMIN, ORG_MEMBER]

    return core_org_roles
