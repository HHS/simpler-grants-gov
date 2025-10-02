from uuid import UUID

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.constants.static_role_values import ORG_ADMIN_ID
from src.db.models.user_models import User, OrganizationUser, Role, OrganizationUserRole
from src.services.organizations_v1.get_organization import get_organization
from sqlalchemy import select

ADMIN_ROLES = [str(ORG_ADMIN_ID)]

def get_role(db_session,role_ids):
    return db_session.execute(select(Role).where(Role.role_id.in_(role_ids))).scalars().all()



def update_user_organization_roles( db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID, data: dict):

    organization = get_organization(db_session, organization_id)
    # check if target user exist in org
    org_user = db_session.execute(select(OrganizationUser).where(OrganizationUser.user_id == target_user_id)).scalar_one_or_none()
    if not org_user:
        raise_flask_error(403, "Forbidden")
    # check if user has access to org
    role_ids = data["role_ids"]

    if not can_access(user, {Privilege.MANAGE_ORG_MEMBERS}, organization):
        raise_flask_error(403, "Forbidden")

    if any( role_id in ADMIN_ROLES for role_id in data["role_ids"]):
        if not can_access(user, {Privilege.MANAGE_ORG_ADMIN_MEMBERS}, organization):
            raise_flask_error(403, "Forbidden")

    # grab the role for the role_ids
    roles = get_role(db_session, role_ids)

    # create organization user role
    organization_user_roles = []
    for role in roles:
        org_user_role = OrganizationUserRole(organization_user=org_user, role=role)
        organization_user_roles.append(org_user_role)
        db_session.add(org_user_role)

    # assign role to user
    org_user.organization_user_roles = organization_user_roles

    db_session.add(org_user)


    return org_user.roles