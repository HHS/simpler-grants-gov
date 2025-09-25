import uuid

from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import Organization
from src.db.models.user_models import User


def get_organization(db_session: db.Session, organization_id: uuid.UUID) -> Organization:
    """Get organization by ID, raising 404 if not found.

    Args:
        db_session: Database session
        organization_id: UUID of the organization to retrieve

    Returns:
        Organization: The organization with SAM.gov entity data loaded

    Raises:
        FlaskError: 404 if organization not found
    """
    stmt = (
        select(Organization)
        .options(joinedload(Organization.sam_gov_entity))
        .where(Organization.organization_id == organization_id)
    )

    organization = db_session.execute(stmt).scalar_one_or_none()

    if organization is None:
        raise_flask_error(404, message=f"Could not find Organization with ID {organization_id}")

    return organization


def get_organization_and_verify_access(
    db_session: db.Session, user: User, organization_id: uuid.UUID
) -> Organization:
    """Get organization by ID and verify user has access, raising appropriate errors if not.

    Args:
        db_session: Database session
        user: User requesting access
        organization_id: UUID of the organization to retrieve

    Returns:
        Organization: The organization with SAM.gov entity data loaded

    Raises:
        FlaskError: 404 if organization not found, 403 if access denied
    """
    # First get the organization
    organization = get_organization(db_session, organization_id)

    # Check if user has VIEW_ORG_MEMBERSHIP privilege for this organization
    if not can_access(user, {Privilege.VIEW_ORG_MEMBERSHIP}, organization):
        raise_flask_error(403, "Forbidden")

    return organization
