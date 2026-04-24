import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.award_recommendation_models import AwardRecommendationRisk
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.pagination.sorting_util import apply_sorting
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)

COLUMN_MAPPING = {
    "created_at": AwardRecommendationRisk.created_at,
}


class AwardRecommendationRiskListRequest(BaseModel):
    pagination: PaginationParams


def list_award_recommendation_risks(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request: dict,
) -> tuple[Sequence[AwardRecommendationRisk], PaginationInfo]:
    params = AwardRecommendationRiskListRequest.model_validate(request)

    get_award_recommendation_and_verify_access(db_session, user, award_recommendation_id)

    stmt = (
        select(AwardRecommendationRisk)
        .where(
            AwardRecommendationRisk.award_recommendation_id == award_recommendation_id,
            AwardRecommendationRisk.is_deleted.isnot(True),
        )
        .options(selectinload(AwardRecommendationRisk.award_recommendation_risk_submissions))
    )
    stmt = apply_sorting(stmt, params.pagination.sort_order, COLUMN_MAPPING)

    paginator: Paginator[AwardRecommendationRisk] = Paginator(
        AwardRecommendationRisk,
        stmt,
        db_session,
        page_size=params.pagination.page_size,
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return paginated_results, pagination_info
