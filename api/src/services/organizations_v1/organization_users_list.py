from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.user_models import OrganizationUser, OrganizationUserRole, User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


def _fetch_organization_users(
    db_session: db.Session, organization_id: UUID
) -> list[OrganizationUser]:
    """Fetch all organization users with their roles and privileges eagerly loaded."""
    stmt = (
        select(OrganizationUser)
        .options(
            selectinload(OrganizationUser.user).selectinload(User.linked_login_gov_external_user),
            selectinload(OrganizationUser.organization_user_roles).selectinload(
                OrganizationUserRole.role
            ),
        )
        .where(OrganizationUser.organization_id == organization_id)
    )
    org_users = db_session.execute(stmt).scalars().all()
    return list(org_users)


def get_organization_users_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> list[dict[str, Any]]:
    """Get organization users and verify user has access.

    Args:
        db_session: Database session
        user: User requesting access
        organization_id: UUID of the organization

    Returns:
        list[dict]: List of user data with roles and privileges

    Raises:
        FlaskError: 404 if organization not found, 403 if access denied
    """

    # Check if user has VIEW_ORG_MEMBERSHIP privilege for this organization
    get_organization_and_verify_access(db_session, user, organization_id)

    return get_organization_users(db_session, organization_id)


def get_organization_users(db_session: db.Session, organization_id: UUID) -> list[dict[str, Any]]:
    """Get all users in an organization with their roles and privileges.

    Args:
        db_session: Database session
        organization_id: UUID of the organization

    Returns:
        list[dict]: List of user data with roles and privileges
    """
    org_users = _fetch_organization_users(db_session, organization_id)
    return [
        {
            "user_id": org_user.user.user_id,
            "email": org_user.user.email,
            "roles": [
                {
                    "role_id": org_user_role.role.role_id,
                    "role_name": org_user_role.role.role_name,
                    "privileges": [priv.value for priv in org_user_role.role.privileges],
                }
                for org_user_role in org_user.organization_user_roles
            ],
            "first_name": org_user.user.profile.first_name if org_user.user.profile else None,
            "last_name": org_user.user.profile.last_name if org_user.user.profile else None,
        }
        for org_user in org_users
    ]
