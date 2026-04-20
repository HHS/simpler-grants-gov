import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

import src.adapters.db as db
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.search.search_models import StrSearchFilter
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)
from src.services.service_utils import apply_sorting


class AwardRecommendationAuditFilters(BaseModel):
    award_recommendation_audit_event: StrSearchFilter | None = None


class AwardRecommendationAuditRequest(BaseModel):
    filters: AwardRecommendationAuditFilters | None = None
    pagination: PaginationParams


def apply_filters(stmt: Select, filters: AwardRecommendationAuditFilters | None) -> Select:
    """Apply filters from the request to the DB query for award recommendation audit events"""
    if filters is None:
        return stmt

    if (
        filters.award_recommendation_audit_event is not None
        and filters.award_recommendation_audit_event.one_of is not None
    ):
        stmt = stmt.where(
            AwardRecommendationAudit.award_recommendation_audit_event.in_(
                filters.award_recommendation_audit_event.one_of
            )
        )

    return stmt


def list_award_recommendation_audit(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request: dict,
) -> tuple[list[dict], PaginationInfo]:
    params = AwardRecommendationAuditRequest.model_validate(request)

    # Fetch the award recommendation, verifying it exists and user has access
    get_award_recommendation_and_verify_access(db_session, user, award_recommendation_id)

    stmt = (
        select(AwardRecommendationAudit)
        .where(AwardRecommendationAudit.award_recommendation_id == award_recommendation_id)
        .options(
            # Preload the user + their profile & login.gov email
            selectinload(AwardRecommendationAudit.user).options(
                selectinload(User.profile), selectinload(User.linked_login_gov_external_user)
            ),
            # Preload related entities
            selectinload(AwardRecommendationAudit.award_recommendation_risk),
            selectinload(AwardRecommendationAudit.award_recommendation_attachment),
            selectinload(AwardRecommendationAudit.award_recommendation_review),
            selectinload(
                AwardRecommendationAudit.award_recommendation_application_submission
            ).selectinload(AwardRecommendationApplicationSubmission.application_submission),
            selectinload(AwardRecommendationAudit.workflow_approval),
        )
    )
    stmt = apply_filters(stmt, params.filters)
    stmt = apply_sorting(stmt, AwardRecommendationAudit, params.pagination.sort_order)

    paginator: Paginator[AwardRecommendationAudit] = Paginator(
        AwardRecommendationAudit, stmt, db_session, page_size=params.pagination.page_size
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return _transform_audit_events(paginated_results), pagination_info


def _transform_audit_events(audit_events: Sequence[AwardRecommendationAudit]) -> list[dict]:
    results = []
    for audit_event in audit_events:
        results.append(
            {
                "award_recommendation_audit_id": audit_event.award_recommendation_audit_id,
                "award_recommendation_audit_event": audit_event.award_recommendation_audit_event,
                "user": audit_event.user,
                "award_recommendation_risk": audit_event.award_recommendation_risk,
                "award_recommendation_attachment": audit_event.award_recommendation_attachment,
                "award_recommendation_review": audit_event.award_recommendation_review,
                "award_recommendation_application_submission": audit_event.award_recommendation_application_submission,
                "workflow_approval": audit_event.workflow_approval,
                "audit_metadata": audit_event.audit_metadata,
                "created_at": audit_event.created_at,
            }
        )

    return results
