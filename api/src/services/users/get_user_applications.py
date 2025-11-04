import logging
from collections.abc import Sequence
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.constants.lookup_constants import ApplicationStatus, Privilege
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
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.search.search_models import StrSearchFilter, UuidSearchFilter
from src.services.service_utils import apply_sorting

logger = logging.getLogger(__name__)


class ApplicationFilters(BaseModel):
    application_status: StrSearchFilter | None = None
    organization_id: UuidSearchFilter | None = None
    competition_id: UuidSearchFilter | None = None


class ListApplicationParams(BaseModel):
    filters: ApplicationFilters | None = None
    pagination: PaginationParams


def build_filter_clauses(filters: ApplicationFilters | None) -> list:
    if not filters:
        return []

    clauses = []

    if filters.application_status and filters.application_status.one_of:
        # Convert each string to ApplicationStatus enum
        status_enums = [
            ApplicationStatus(status_str) for status_str in filters.application_status.one_of
        ]
        clauses.append(Application.application_status.in_(status_enums))
    if filters.organization_id and filters.organization_id.one_of:
        clauses.append(Application.organization_id.in_(filters.organization_id.one_of))
    if filters.competition_id and filters.competition_id.one_of:
        clauses.append(Application.competition_id.in_(filters.competition_id.one_of))

    return clauses


def get_user_applications(
    db_session: db.Session, user_id: UUID, raw_params: dict
) -> tuple[Sequence[Application], PaginationInfo]:
    """
    Get all applications for a user
    """
    list_params: ListApplicationParams = ListApplicationParams.model_validate(raw_params)

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
    stmt = (
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
    # Filter
    filter_clauses = build_filter_clauses(list_params.filters)
    if filter_clauses:
        stmt = stmt.where(and_(*filter_clauses))
    # import pdb; pdb.set_trace()
    # Sort
    stmt = apply_sorting(stmt, Application, list_params.pagination.sort_order)
    # Paginate
    paginator: Paginator[Application] = Paginator(
        Application, stmt, db_session, page_size=list_params.pagination.page_size
    )

    paginated_applications = paginator.page_at(page_offset=list_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(list_params.pagination, paginator)

    return paginated_applications, pagination_info
