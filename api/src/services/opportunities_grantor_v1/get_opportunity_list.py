import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import grants_shared.adapters.db as db
from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams, SortOrder
from grants_shared.pagination.paginator import Paginator
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel, Field
from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import AgencyUser, AgencyUserRole, LinkRolePrivilege, Role, User
from src.search.search_models import BoolSearchFilter
from src.services.opportunities_grantor_v1.get_agency import get_agency


class OpportunityListFilterParams(BaseModel):
    """Optional filters for opportunity list"""

    award_recommendation_ready: BoolSearchFilter | None = None


class ListOpportunitiesParams(BaseModel):
    """Parameters for listing opportunities"""

    pagination: PaginationParams = Field(
        default_factory=lambda: PaginationParams(page_offset=1, page_size=25)
    )
    filters: OpportunityListFilterParams | None = Field(default=None)


@dataclass(frozen=True)
class OpportunityListItem:
    opportunity: Opportunity
    submitted_application_count: int

    def __getattr__(self, name: str) -> Any:
        return getattr(self.opportunity, name)


def _to_opportunity_list_item(
    opportunity: Opportunity,
    submitted_application_count: int,
) -> OpportunityListItem:
    """Convert an Opportunity ORM model into a list response item."""
    return OpportunityListItem(
        opportunity=opportunity,
        submitted_application_count=submitted_application_count,
    )


def _base_opportunity_list_stmt() -> Select:
    """Build the shared base opportunity list query."""
    return (
        select(Opportunity)
        .options(
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
            selectinload(Opportunity.opportunity_assistance_listings),
            selectinload(Opportunity.all_opportunity_summaries).options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary)
            .options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.opportunity_attachments),
            selectinload(Opportunity.competitions).options(
                selectinload(Competition.competition_forms),
                selectinload(Competition.competition_instructions),
                selectinload(Competition.opportunity_assistance_listing),
                selectinload(Competition.link_competition_open_to_applicant),
                selectinload(Competition.applications).selectinload(
                    Application.application_submissions
                ),
            ),
            selectinload(Opportunity.award_recommendations),
        )
        .outerjoin(
            Agency,
            (Opportunity.agency_id == Agency.agency_id)
            | ((Opportunity.agency_id.is_(None)) & (Opportunity.agency_code == Agency.agency_code)),
        )
    )


def _should_filter_award_recommendation_ready(params: ListOpportunitiesParams) -> bool:
    return bool(
        params.filters
        and params.filters.award_recommendation_ready
        and params.filters.award_recommendation_ready.one_of
        and True in params.filters.award_recommendation_ready.one_of
    )


def _apply_opportunity_filters(stmt: Select, params: ListOpportunitiesParams) -> Select:
    """Apply optional opportunity list filters."""
    if not _should_filter_award_recommendation_ready(params):
        return stmt

    return stmt.where(
        Opportunity.is_draft.is_(False),
        Opportunity.is_simpler_grants_opportunity.is_(True),
        Opportunity.competitions.any(
            Competition.applications.any(Application.application_submissions.any())
        ),
        ~Opportunity.award_recommendations.any(),
    )


def _get_submitted_application_counts(
    db_session: db.Session,
    opportunities: Sequence[Opportunity],
) -> dict[uuid.UUID, int]:
    """Get submitted application counts keyed by opportunity ID."""
    opportunity_ids = [opportunity.opportunity_id for opportunity in opportunities]

    if not opportunity_ids:
        return {}

    count_stmt = (
        select(
            Competition.opportunity_id,
            func.count(ApplicationSubmission.application_submission_id).label(
                "submitted_application_count"
            ),
        )
        .join(Application, Application.competition_id == Competition.competition_id)
        .join(
            ApplicationSubmission,
            ApplicationSubmission.application_id == Application.application_id,
        )
        .where(Competition.opportunity_id.in_(opportunity_ids))
        .group_by(Competition.opportunity_id)
    )

    return {
        opportunity_id: submitted_application_count
        for opportunity_id, submitted_application_count in db_session.execute(count_stmt).all()
    }


def _paginate_opportunity_stmt(
    db_session: db.Session,
    stmt: Select,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """Apply filters, sorting, submitted application counts, and pagination."""
    stmt = _apply_opportunity_filters(stmt, params)
    stmt = apply_sorting(stmt, params.pagination.sort_order, Opportunity)

    paginator: Paginator[Opportunity] = Paginator(
        table_model=Opportunity,
        stmt=stmt,
        db_session=db_session,
        page_size=params.pagination.page_size,
    )

    opportunities = paginator.page_at(params.pagination.page_offset)
    counts_by_opportunity_id = _get_submitted_application_counts(db_session, opportunities)

    opportunity_list_items = [
        _to_opportunity_list_item(
            opportunity=opportunity,
            submitted_application_count=counts_by_opportunity_id.get(
                opportunity.opportunity_id,
                0,
            ),
        )
        for opportunity in opportunities
    ]

    pagination_info = PaginationInfo(
        total_records=paginator.total_records,
        page_offset=params.pagination.page_offset,
        page_size=params.pagination.page_size,
        total_pages=paginator.total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in params.pagination.sort_order],
    )

    return opportunity_list_items, pagination_info


def list_opportunities_for_agency_with_filters(
    db_session: db.Session,
    agency_id: uuid.UUID,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """List opportunities for a single agency with filtering, sorting, and pagination."""
    stmt = _base_opportunity_list_stmt().where(Agency.agency_id == agency_id)

    return _paginate_opportunity_stmt(
        db_session=db_session,
        stmt=stmt,
        params=params,
    )


def list_opportunities_with_filters(
    db_session: db.Session,
    agency_id: uuid.UUID,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """Backward-compatible wrapper for listing opportunities by agency."""
    return list_opportunities_for_agency_with_filters(
        db_session=db_session,
        agency_id=agency_id,
        params=params,
    )


def get_opportunity_list_for_grantors(
    db_session: db.Session,
    user: User,
    agency_id: uuid.UUID,
    json_data: dict,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """
    Get a paginated list of opportunities for grantors

    Args:
        db_session: Database session
        user: User making the request
        agency_id: Agency ID to get opportunities for
        json_data: Request JSON data

    Returns:
        Tuple of (opportunities, pagination_info)
    """
    # Validate parameters
    params = ListOpportunitiesParams.model_validate(json_data)

    # Get agency and verify it exists
    agency = get_agency(db_session, agency_id)

    # Verify user has VIEW_OPPORTUNITY privilege for the agency
    verify_access(user, {Privilege.VIEW_OPPORTUNITY}, agency)

    return list_opportunities_for_agency_with_filters(
        db_session=db_session,
        agency_id=agency_id,
        params=params,
    )


def _accessible_agency_ids_for_user_stmt(user: User) -> Select:
    """Build a subquery for agencies where the user has VIEW_OPPORTUNITY."""
    return (
        select(AgencyUser.agency_id)
        .join(AgencyUserRole, AgencyUserRole.agency_user_id == AgencyUser.agency_user_id)
        .join(Role, Role.role_id == AgencyUserRole.role_id)
        .join(LinkRolePrivilege, LinkRolePrivilege.role_id == Role.role_id)
        .where(
            AgencyUser.user_id == user.user_id,
            LinkRolePrivilege.privilege == Privilege.VIEW_OPPORTUNITY,
        )
        .distinct()
    )


def list_opportunities_for_user_with_filters(
    db_session: db.Session,
    user: User,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """List opportunities across all agencies where the user has VIEW_OPPORTUNITY."""
    stmt = _base_opportunity_list_stmt().where(
        Agency.agency_id.in_(_accessible_agency_ids_for_user_stmt(user))
    )

    return _paginate_opportunity_stmt(
        db_session=db_session,
        stmt=stmt,
        params=params,
    )


def get_opportunity_list_for_user(
    db_session: db.Session,
    user: User,
    json_data: dict,
) -> tuple[Sequence[OpportunityListItem], PaginationInfo]:
    """Get a paginated list of opportunities for all agencies the user can access."""
    params = ListOpportunitiesParams.model_validate(json_data)

    return list_opportunities_for_user_with_filters(
        db_session=db_session,
        user=user,
        params=params,
    )
