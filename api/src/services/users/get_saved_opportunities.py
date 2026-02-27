import logging
import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import asc, desc, func, nulls_last, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select, Subquery, union_all

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access, check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import Organization, OrganizationSavedOpportunity
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import User, UserSavedOpportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator
from src.search.search_models import StrSearchFilter

logger = logging.getLogger(__name__)


class SavedOpportunityFilterParams(BaseModel):
    opportunity_status: StrSearchFilter | None = None
    organization_ids: list[uuid.UUID] | None = None


class SavedOpportunityListParams(BaseModel):
    filters: SavedOpportunityFilterParams | None = None
    pagination: PaginationParams


def add_sort_order(stmt: Select, sort_order: list, saved_union: Subquery) -> Select:
    model_mapping = {"opportunity_title": Opportunity, "close_date": OpportunitySummary}

    order_cols: list = []
    for order in sort_order:
        if order.order_by == "created_at":
            # Most recent save event across user + org
            column = saved_union.c.saved_at
        else:
            column = getattr(model_mapping[order.order_by], order.order_by)

        if (
            order.sort_direction == SortDirection.ASCENDING
        ):  # defaults to nulls at the end when asc order
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(
                nulls_last(desc(column)) if order.order_by == "close_date" else desc(column)
            )

    return stmt.order_by(*order_cols)


def add_opportunity_status_filter(
    stmt: Select, filters: SavedOpportunityFilterParams | None
) -> Select:
    if filters is None:
        return stmt

    if filters.opportunity_status is not None and filters.opportunity_status.one_of:
        stmt = stmt.where(
            CurrentOpportunitySummary.opportunity_status.in_(filters.opportunity_status.one_of)
        )

    return stmt


def _get_accessible_org_ids(
    user: User,
    org_users: list,
) -> list[uuid.UUID]:
    """
    Returns only the organization ids the user has required access to.
    """
    return [
        org_user.organization_id
        for org_user in org_users
        if can_access(user, {Privilege.VIEW_ORG_SAVED_OPPORTUNITIES}, org_user.organization)
    ]


def _check_access(db_session: db.Session, user: User, organization_ids: list) -> None:
    # Fetch all organizations in one query
    organizations = (
        db_session.query(Organization)
        .filter(Organization.organization_id.in_(organization_ids))
        .all()
    )
    org_map = {org.organization_id: org for org in organizations}

    missing_ids = set(organization_ids) - org_map.keys()
    if missing_ids:
        raise raise_flask_error(404, f"Organization(s) not found: {missing_ids}")

    for org in organizations:
        # Check if user has VIEW_ORG_SAVED_OPPORTUNITIES privilege for this organization
        check_user_access(
            db_session,
            user,
            {Privilege.VIEW_ORG_SAVED_OPPORTUNITIES},
            org,
        )


def _build_saved_union_subquery(
    user_id: uuid.UUID, org_ids_to_use: list, include_user_saved_opps: bool
) -> Subquery:
    """
    Returns a saved_union subquery with one row per opportunity and a saved_at timestamp that combines user + org saves based on org_ids_to_use.
    Example query generated:
    SELECT anon_1.opportunity_id, max(anon_1.saved_at) AS saved_at
            FROM (
                SELECT organization_saved_opportunity.opportunity_id AS opportunity_id,
                       organization_saved_opportunity.created_at AS saved_at
                FROM organization_saved_opportunity
                WHERE organization_saved_opportunity.organization_id IN (__[POSTCOMPILE_organization_id_1])

                UNION ALL

                SELECT user_saved_opportunity.opportunity_id AS opportunity_id,
                       user_saved_opportunity.created_at AS saved_at
                FROM user_saved_opportunity
                WHERE user_saved_opportunity.user_id = :user_id_1
                  AND user_saved_opportunity.is_deleted IS NOT true
            ) AS anon_1
            GROUP BY anon_1.opportunity_id
    """

    subqueries = []

    # Add org saved subquery if applicable
    if org_ids_to_use:
        subqueries.append(
            select(
                OrganizationSavedOpportunity.opportunity_id.label("opportunity_id"),
                OrganizationSavedOpportunity.created_at.label("saved_at"),
            ).where(OrganizationSavedOpportunity.organization_id.in_(org_ids_to_use))
        )

    # Add user saved subquery if applicable
    if include_user_saved_opps:
        subqueries.append(
            select(
                UserSavedOpportunity.opportunity_id.label("opportunity_id"),
                UserSavedOpportunity.created_at.label("saved_at"),
            ).where(
                UserSavedOpportunity.user_id == user_id, UserSavedOpportunity.is_deleted.isnot(True)
            )
        )

    # Combine subqueries
    saved_sq = union_all(*subqueries).subquery()

    # Aggregate to get one row per opportunity
    saved_union = (
        select(
            saved_sq.c.opportunity_id,
            func.max(saved_sq.c.saved_at).label("saved_at"),
        )
        .group_by(saved_sq.c.opportunity_id)
        .subquery()
    )
    return saved_union


def get_saved_opportunities(
    db_session: db.Session, user: User, raw_opportunity_params: dict
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    opportunity_params = SavedOpportunityListParams.model_validate(raw_opportunity_params)
    org_ids_param = opportunity_params.filters and opportunity_params.filters.organization_ids
    user_id = user.user_id
    logger.info("Getting saved opportunities for user")
    include_user_saved_opps = True
    # Determine which orgs to consider
    if org_ids_param is None:
        logger.info("All saved opportunities requested")
        org_ids_to_use = _get_accessible_org_ids(user, user.organization_users)
    elif org_ids_param:
        logger.info("Organization saved opportunities requested")
        _check_access(db_session, user, org_ids_param)
        org_ids_to_use = org_ids_param
        include_user_saved_opps = False
    else:
        logger.info("User saved opportunities requested")
        org_ids_to_use = []
    # Build saved_union subquery
    saved_union = _build_saved_union_subquery(user_id, org_ids_to_use, include_user_saved_opps)

    # Base opportunity query
    stmt = (
        select(Opportunity)
        .join(
            CurrentOpportunitySummary,
            CurrentOpportunitySummary.opportunity_id == Opportunity.opportunity_id,
        )
        .join(
            OpportunitySummary,
            CurrentOpportunitySummary.opportunity_summary_id
            == OpportunitySummary.opportunity_summary_id,
        )
        .join(saved_union, saved_union.c.opportunity_id == Opportunity.opportunity_id)
        .options(
            selectinload(Opportunity.current_opportunity_summary).selectinload(
                CurrentOpportunitySummary.opportunity_summary
            )
        )
    )

    # Apply filters and sorting
    stmt = add_opportunity_status_filter(stmt, opportunity_params.filters)
    stmt = add_sort_order(stmt, opportunity_params.pagination.sort_order, saved_union=saved_union)

    # Paginate
    paginator: Paginator[Opportunity] = Paginator(
        Opportunity, stmt, db_session, page_size=opportunity_params.pagination.page_size
    )
    paginated_search = paginator.page_at(page_offset=opportunity_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(
        opportunity_params.pagination, paginator
    )

    return paginated_search, pagination_info
