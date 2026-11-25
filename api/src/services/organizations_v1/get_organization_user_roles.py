from uuid import UUID

from src.adapters import db
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import User
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.organization_user_utils import (
    OrganizationUserRoles,
    build_organization_user_roles,
    validate_organization_user_exists,
)


def get_organization_user_roles(
    db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID
) -> OrganizationUserRoles:
    """Get a user's roles in an organization, after validating permissions and membership."""
    organization = get_organization(db_session, organization_id)

    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    org_user = validate_organization_user_exists(db_session, target_user_id, organization)

    return build_organization_user_roles(db_session, org_user)
