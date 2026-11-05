import logging

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import (
    InternalUserRole,
    LinkExternalUser,
    LinkRoleRoleType,
    Role,
    User,
)

logger = logging.getLogger(__name__)


def update_internal_user_role(
    db_session: db.Session, internal_role_id: str, user_email: str, user: User
) -> None:

    verify_access(user, {Privilege.MANAGE_INTERNAL_ROLES}, None)

    # Query the role table and verify it is an internal role
    role_stmt = (
        select(Role)
        .join(LinkRoleRoleType, Role.role_id == LinkRoleRoleType.role_id)
        .where(Role.role_id == internal_role_id, LinkRoleRoleType.role_type == RoleType.INTERNAL)
    )
    role = db_session.execute(role_stmt).scalar_one_or_none()

    if not role:
        raise_flask_error(404, "Internal role not found.")

    # Query user by email using LinkExternalUser
    user_stmt = select(LinkExternalUser).where(LinkExternalUser.email == user_email)
    external_user = db_session.execute(user_stmt).scalar_one_or_none()

    if not external_user:
        raise_flask_error(404, "User not found.")

    target_user_id = external_user.user_id

    # Check if the user already has this specific role assigned
    existing_stmt = select(InternalUserRole).filter_by(
        user_id=target_user_id, role_id=internal_role_id
    )
    existing_assignment = db_session.execute(existing_stmt).scalar_one_or_none()

    if existing_assignment:
        raise_flask_error(422, "User already has this role.")

    # Add the new internal role assignment
    new_assignment = InternalUserRole(user_id=target_user_id, role_id=internal_role_id)
    db_session.add(new_assignment)

    logger.info("Successfully assigned role to user.")
