import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

import src.adapters.db as db
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationSubmissionDetail,
)
from src.db.models.competition_models import Application, ApplicationSubmission
from src.db.models.entity_models import Organization
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.pagination.sorting_util import apply_sorting
from src.search.search_models import BoolSearchFilter, StrSearchFilter
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)


class AwardRecommendationSubmissionFilters(BaseModel):
    award_recommendation_type: StrSearchFilter | None = None
    has_exception: BoolSearchFilter | None = None


class AwardRecommendationSubmissionListRequest(BaseModel):
    filters: AwardRecommendationSubmissionFilters | None = None
    pagination: PaginationParams


def apply_filters(stmt: Select, filters: AwardRecommendationSubmissionFilters | None) -> Select:
    if filters is None:
        return stmt

    if filters.award_recommendation_type is not None and filters.award_recommendation_type.one_of:
        stmt = stmt.where(
            AwardRecommendationSubmissionDetail.award_recommendation_type.in_(
                filters.award_recommendation_type.one_of
            )
        )

    if filters.has_exception is not None and filters.has_exception.one_of:
        stmt = stmt.where(
            AwardRecommendationSubmissionDetail.has_exception.in_(filters.has_exception.one_of)
        )

    return stmt


def list_award_recommendation_submissions(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request: dict,
) -> tuple[Sequence[AwardRecommendationApplicationSubmission], PaginationInfo]:
    """
    List award recommendation submissions for an award recommendation.

    Args:
        db_session: Database session
        user: User requesting the submissions
        award_recommendation_id: Award recommendation ID
        request: Request payload containing pagination and filters
    """
    params = AwardRecommendationSubmissionListRequest.model_validate(request)

    get_award_recommendation_and_verify_access(db_session, user, award_recommendation_id)

    stmt = (
        select(AwardRecommendationApplicationSubmission)
        .where(
            AwardRecommendationApplicationSubmission.award_recommendation_id
            == award_recommendation_id
        )
        .options(
            selectinload(
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail
            ),
            selectinload(AwardRecommendationApplicationSubmission.application_submission)
            .selectinload(ApplicationSubmission.application)
            .selectinload(Application.organization)
            .selectinload(Organization.sam_gov_entity),
        )
        .join(
            ApplicationSubmission,
            AwardRecommendationApplicationSubmission.application_submission_id
            == ApplicationSubmission.application_submission_id,
        )
        .join(
            AwardRecommendationSubmissionDetail,
            AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
            == AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id,
        )
    )

    stmt = apply_filters(stmt, params.filters)
    stmt = apply_sorting(
        stmt,
        params.pagination.sort_order,
        {
            "application_submission_number": ApplicationSubmission.application_submission_number,
        },
    )

    paginator: Paginator[AwardRecommendationApplicationSubmission] = Paginator(
        AwardRecommendationApplicationSubmission,
        stmt,
        db_session,
        page_size=params.pagination.page_size,
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return paginated_results, pagination_info
