import logging
import uuid
from collections.abc import Sequence

import grants_shared.adapters.db as db
from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams
from grants_shared.pagination.paginator import Paginator
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

from src.db.models.opportunity_models import OpportunityAudit
from src.db.models.user_models import User
from src.search.search_models import StrSearchFilter
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors

logger = logging.getLogger(__name__)


class OpportunityAuditFilters(BaseModel):
    opportunity_audit_event: StrSearchFilter | None = None


class OpportunityAuditRequest(BaseModel):
    filters: OpportunityAuditFilters | None = None
    pagination: PaginationParams


def apply_filters(stmt: Select, filters: OpportunityAuditFilters | None) -> Select:
    """Apply filters from the request to the DB query for opportunity audit events"""
    if filters is None:
        return stmt

    if (
        filters.opportunity_audit_event is not None
        and filters.opportunity_audit_event.one_of is not None
    ):
        stmt = stmt.where(
            OpportunityAudit.opportunity_audit_event.in_(filters.opportunity_audit_event.one_of)
        )

    return stmt


def list_opportunity_audit(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    request: dict,
) -> tuple[list[dict], PaginationInfo]:
    params = OpportunityAuditRequest.model_validate(request)

    # Fetch the opportunity, verifying it exists and user has VIEW_OPPORTUNITY access
    get_opportunity_for_grantors(db_session, user, opportunity_id)

    stmt = (
        select(OpportunityAudit)
        .where(OpportunityAudit.opportunity_id == opportunity_id)
        .options(
            # Preload the user + their profile & login.gov email
            selectinload(OpportunityAudit.user).options(
                selectinload(User.profile), selectinload(User.linked_login_gov_external_user)
            ),
        )
    )
    stmt = apply_filters(stmt, params.filters)
    stmt = apply_sorting(stmt, params.pagination.sort_order, OpportunityAudit)

    paginator: Paginator[OpportunityAudit] = Paginator(
        OpportunityAudit, stmt, db_session, page_size=params.pagination.page_size
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return _transform_audit_events(paginated_results), pagination_info


def _transform_audit_events(audit_events: Sequence[OpportunityAudit]) -> list[dict]:
    results = []
    for audit_event in audit_events:
        results.append(
            {
                "opportunity_audit_id": audit_event.opportunity_audit_id,
                "opportunity_audit_event": audit_event.opportunity_audit_event,
                "user": audit_event.user,
                "opportunity": audit_event.opportunity_data,
                "nonforecast_opportunity_summary": audit_event.nonforecast_opportunity_summary,
                "competition": audit_event.competition,
                "created_at": audit_event.created_at,
            }
        )

    return results
