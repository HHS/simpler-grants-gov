import uuid

from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.entity_models import Organization


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
