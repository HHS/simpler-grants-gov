import logging
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Application, Competition
from src.db.models.entity_models import Organization
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import (
    ApplicationUser,
    ApplicationUserRole,
    LinkRolePrivilege,
    OrganizationUser,
    OrganizationUserRole,
)

logger = logging.getLogger(__name__)


def get_user_applications(db_session: db.Session, user_id: UUID) -> list[Application]:
    """
    Get all applications for a user
    """
    logger.info(f"Getting applications for user {user_id}")
    # Applications user can view through application roles
    app_access_sq = (
        select(Application.application_id)
        .join(ApplicationUser, ApplicationUser.application_id == Application.application_id)
        .join(
            ApplicationUserRole,
            ApplicationUserRole.application_user_id == ApplicationUser.application_user_id,
        )
        .join(LinkRolePrivilege, LinkRolePrivilege.role_id == ApplicationUserRole.role_id)
        .where(
            (ApplicationUser.user_id == user_id)
            & (LinkRolePrivilege.privilege == Privilege.VIEW_APPLICATION)
        )
    )
    # Applications user can view through organization roles
    org_access_sq = (
        select(Application.application_id)
        .join(OrganizationUser, OrganizationUser.organization_id == Application.organization_id)
        .join(
            OrganizationUserRole,
            OrganizationUserRole.organization_user_id == OrganizationUser.organization_user_id,
        )
        .join(LinkRolePrivilege, LinkRolePrivilege.role_id == OrganizationUserRole.role_id)
        .where(
            (OrganizationUser.user_id == user_id)
            & (LinkRolePrivilege.privilege == Privilege.VIEW_APPLICATION)
        )
    )
    result = db_session.execute(
        select(Application)
        .where(
            or_(
                Application.application_id.in_(app_access_sq),
                Application.application_id.in_(org_access_sq),
            )
        )
        .options(
            # Load the competition data
            selectinload(Application.competition)
            .selectinload(Competition.opportunity)
            .selectinload(Opportunity.agency_record),
            # Load organization and its sam_gov_entity
            selectinload(Application.organization).selectinload(Organization.sam_gov_entity),
        )
    )

    applications = list(result.scalars().all())
    logger.info(f"Retrieved {len(applications)} applications for user {user_id}")

    return applications
