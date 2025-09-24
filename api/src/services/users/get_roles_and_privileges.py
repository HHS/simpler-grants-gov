import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.user_models import (
    AgencyUser,
    AgencyUserRole,
    ApplicationUser,
    ApplicationUserRole,
    InternalUserRole,
    OrganizationUser,
    OrganizationUserRole,
    Role,
    User,
)

logger = logging.getLogger(__name__)


def get_roles_and_privileges(
    db_session: db.Session,
    user_id: UUID,
) -> User | None:
    stmt = (
        select(User)
        .where(User.user_id == user_id)
        .options(
            # Organization-related relationships
            selectinload(User.organizations),
            selectinload(User.organizations).selectinload(
                OrganizationUser.organization
            ),  # Load Organization inside each OrganizationUser
            selectinload(User.organizations).selectinload(
                OrganizationUser.organization_user_roles
            ),  # Load roles
            selectinload(User.organizations)
            .selectinload(OrganizationUser.organization_user_roles)
            .selectinload(OrganizationUserRole.role)  # Load Role inside each OrganizationUserRole
            .selectinload(Role.link_privileges),
            selectinload(User.organizations)
            .selectinload(OrganizationUser.organization)
            .selectinload(Organization.sam_gov_entity),
            # Application-related relationships
            selectinload(User.application_users),  # Load list of ApplicationUser
            selectinload(User.application_users).selectinload(
                ApplicationUser.application
            ),  # Load Application inside each ApplicationUser
            selectinload(User.application_users).selectinload(
                ApplicationUser.application_user_roles
            ),  # Load roles
            selectinload(User.application_users)
            .selectinload(ApplicationUser.application_user_roles)
            .selectinload(ApplicationUserRole.role)  # Load Role inside each ApplicationUserRole
            .selectinload(Role.link_privileges),
            selectinload(User.application_users)
            .selectinload(ApplicationUser.application)
            .selectinload(Application.organization),
            selectinload(User.application_users)
            .selectinload(ApplicationUser.application)
            .selectinload(Application.competition),
            # Agency-related relationships
            selectinload(User.user_agencies),
            selectinload(User.user_agencies).selectinload(AgencyUser.agency),
            selectinload(User.user_agencies).selectinload(AgencyUser.agency_user_roles),
            selectinload(User.user_agencies)
            .selectinload(AgencyUser.agency_user_roles)
            .selectinload(AgencyUserRole.role)
            .selectinload(Role.link_privileges),
            selectinload(User.user_agencies)
            .selectinload(AgencyUser.agency)
            .selectinload(Agency.top_level_agency),
            # Internal roles
            selectinload(User.internal_user_roles),
            selectinload(User.internal_user_roles)
            .selectinload(InternalUserRole.role)
            .selectinload(Role.link_privileges),
        )
    )
    user = db_session.execute(stmt).scalar_one_or_none()

    return user
