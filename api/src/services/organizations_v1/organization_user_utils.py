"""Shared utilities for organization user operations."""

from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.entity_models import Organization
from src.db.models.user_models import OrganizationUser


def validate_organization_user_exists(
    db_session: db.Session, user_id: UUID, organization: Organization
) -> OrganizationUser:
    """Validate that the user is a member of the specified organization.

    Args:
        db_session: Database session
        user_id: ID of user to validate
        organization: Organization to check membership in

    Returns:
        OrganizationUser: The organization user record

    Raises:
        FlaskError: 404 if user is not a member of the organization
    """
    org_user = db_session.execute(
        select(OrganizationUser)
        .where(OrganizationUser.organization_id == organization.organization_id)
        .where(OrganizationUser.user_id == user_id)
    ).scalar_one_or_none()

    if not org_user:
        raise_flask_error(404, message=f"Could not find User with ID {user_id}")

    return org_user
