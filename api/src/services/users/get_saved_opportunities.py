import logging
import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import and_, asc, desc, exists, nulls_last, or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

from src.adapters import db
from src.auth.endpoint_access_util import check_user_access
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
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


class SavedOpportunityFilterParams(BaseModel):
    opportunity_status: StrSearchFilter | None = None


class SavedOpportunityListParams(BaseModel):
    organization_ids: list[uuid.UUID] | None = None
    filters: SavedOpportunityFilterParams | None = None
    pagination: PaginationParams


def add_sort_order(stmt: Select, sort_order: list) -> Select:
    model_mapping = {"opportunity_title": Opportunity, "close_date": OpportunitySummary}

    order_cols: list = []
    for order in sort_order:
        column = (
            getattr(model_mapping[order.order_by], order.order_by)
            if order.order_by in model_mapping
            else getattr(UserSavedOpportunity, order.order_by)
        )

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


def get_organization_and_verify_access(
    db_session: db.Session, user: User, organization_id: uuid.UUID, privilege: set[Privilege]
) -> Organization:
    """Get organization by ID and verify user has access, raising appropriate errors if not.

    Args:
        db_session: Database session
        user: User requesting access
        organization_id: UUID of the organization to retrieve
        privilege: set of Privileges to check against

    Returns:
        Organization: The organization with SAM.gov entity data loaded

    Raises:
        FlaskError: 404 if organization not found, 403 if access denied
    """
    # First get the organization
    organization = get_organization(db_session, organization_id)

    # Check if user has the correct privilege for this organization
    check_user_access(
        db_session,
        user,
        privilege,
        organization,
    )

    return organization


def _check_access(db_session: db.Session, user: User, organization_ids: list) -> None:
    for org_id in organization_ids:
        get_organization_and_verify_access(
            db_session, user, org_id, {Privilege.VIEW_ORG_SAVED_OPPORTUNITIES}
        )


def get_saved_opportunities(
    db_session: db.Session, user: User, raw_opportunity_params: dict
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    user_id = user.user_id
    logger.info(f"Getting saved opportunities for user {user_id}")

    opportunity_params = SavedOpportunityListParams.model_validate(raw_opportunity_params)
    org_ids_param = opportunity_params.organization_ids

    if org_ids_param is None:
        # Not provided, get all orgs the user is a member of
        org_ids = [ou.organization_id for ou in user.organization_users]
    elif not org_ids_param:
        # Explicit empty list, only user saved opportunities
        org_ids = []
    else:
        # Explicit organization ids provided, verify access
        org_ids = org_ids_param
        _check_access(db_session, user, org_ids)

    # Base query
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
        .options(
            selectinload(Opportunity.current_opportunity_summary).selectinload(
                CurrentOpportunitySummary.opportunity_summary
            )
        )
    )

    user_saved = exists().where(
        and_(
            UserSavedOpportunity.user_id == user.user_id,
            UserSavedOpportunity.is_deleted.isnot(True),
            UserSavedOpportunity.opportunity_id == Opportunity.opportunity_id,
        )
    )

    org_saved = exists().where(
        and_(
            OrganizationSavedOpportunity.opportunity_id == Opportunity.opportunity_id,
            OrganizationSavedOpportunity.organization_id.in_(org_ids),
        )
    )

    if org_ids_param == []:
        # Only user saved
        stmt = stmt.where(user_saved)

    elif org_ids_param is None:
        # Both user and org saved
        stmt = stmt.where(or_(user_saved, org_saved))

    else:
        # Only provided orgs
        stmt = stmt.where(org_saved)

    stmt = add_opportunity_status_filter(stmt, opportunity_params.filters)
    stmt = add_sort_order(stmt, opportunity_params.pagination.sort_order)

    paginator: Paginator[Opportunity] = Paginator(
        Opportunity, stmt, db_session, page_size=opportunity_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=opportunity_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(
        opportunity_params.pagination, paginator
    )

    return paginated_search, pagination_info
