from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.entity_models import Organization
from src.db.models.user_models import OrganizationUser


def _fetch_user_organizations(db_session: db.Session, user_id: UUID) -> list[OrganizationUser]:
    """Fetch all organizations for a user with their SAM.gov entity data."""
    stmt = (
        select(OrganizationUser)
        .where(OrganizationUser.user_id == user_id)
        .options(
            selectinload(OrganizationUser.organization).selectinload(Organization.sam_gov_entity)
        )
    )

    organization_users = db_session.execute(stmt).scalars().all()
    return list(organization_users)


def get_user_organizations(db_session: db.Session, user_id: UUID) -> list[dict[str, Any]]:
    """Get user organizations in the format expected by the API response."""
    organization_users = _fetch_user_organizations(db_session, user_id)

    organizations = []
    for org_user in organization_users:
        organization = org_user.organization
        sam_gov_entity = organization.sam_gov_entity

        org_data: dict[str, Any] = {
            "organization_id": str(organization.organization_id),
            "sam_gov_entity": sam_gov_entity,
        }

        organizations.append(org_data)

    return organizations
