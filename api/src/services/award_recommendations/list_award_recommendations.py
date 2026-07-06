import uuid
from collections.abc import Sequence

import grants_shared.adapters.db as db
from grants_shared.api.response import ValidationErrorDetail
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams
from grants_shared.pagination.paginator import Paginator
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationApplicationSubmission,
)
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.db.models.user_models import User
from src.search.search_models import UuidSearchFilter
from src.validation.validation_constants import ValidationErrorType

COLUMN_MAPPING = {
    "created_at": AwardRecommendation.created_at,
}


class AwardRecommendationListFilters(BaseModel):
    agency_id: UuidSearchFilter


class AwardRecommendationListRequest(BaseModel):
    filters: AwardRecommendationListFilters
    pagination: PaginationParams


def verify_agencies_access(
    db_session: db.Session, user: User, agency_ids: set[uuid.UUID]
) -> list[Agency]:
    """Fetch agencies by ID, 404 on missing, 403 if user lacks view access on any."""
    agencies = list(
        db_session.execute(select(Agency).where(Agency.agency_id.in_(agency_ids))).scalars().all()
    )

    if len(agencies) != len(agency_ids):
        found_ids = {a.agency_id for a in agencies}
        missing_ids = [aid for aid in agency_ids if aid not in found_ids]

        validation_errors = [
            ValidationErrorDetail(
                type=ValidationErrorType.AGENCY_NOT_FOUND,
                message=f"Could not find Agency with ID {missing_id}",
                field="filters.agency_id.one_of",
                value=str(missing_id),
            )
            for missing_id in missing_ids
        ]
        raise_flask_error(
            404,
            message="Could not find one or more Agencies",
            validation_issues=validation_errors,
        )

    for agency in agencies:
        verify_access(user, {Privilege.VIEW_AWARD_RECOMMENDATION}, agency)

    return agencies


def list_award_recommendations(
    db_session: db.Session, user: User, request: dict
) -> tuple[Sequence[AwardRecommendation], PaginationInfo]:
    params = AwardRecommendationListRequest.model_validate(request)

    agency_ids = set(params.filters.agency_id.one_of or [])

    agencies = verify_agencies_access(db_session, user, agency_ids)
    agency_codes = [a.agency_code for a in agencies]

    stmt = (
        select(AwardRecommendation)
        .join(Opportunity, Opportunity.opportunity_id == AwardRecommendation.opportunity_id)
        .where(
            AwardRecommendation.is_deleted.isnot(True),
            Opportunity.agency_code.in_(agency_codes),
        )
        .options(
            selectinload(AwardRecommendation.opportunity).selectinload(Opportunity.agency_record),
            selectinload(AwardRecommendation.opportunity)
            .selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary),
            selectinload(AwardRecommendation.award_recommendation_reviews),
        )
    )
    stmt = apply_sorting(stmt, params.pagination.sort_order, COLUMN_MAPPING, nulls_last=True)

    paginator: Paginator[AwardRecommendation] = Paginator(
        AwardRecommendation,
        stmt,
        db_session,
        page_size=params.pagination.page_size,
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    add_total_received_count_to_award_recommendations(db_session, paginated_results)

    return paginated_results, pagination_info


def add_total_received_count_to_award_recommendations(
    db_session: db.Session, award_recommendations: Sequence[AwardRecommendation]
) -> None:
    award_recommendation_ids = [
        award_recommendation.award_recommendation_id
        for award_recommendation in award_recommendations
    ]

    if not award_recommendation_ids:
        return

    count_rows = db_session.execute(
        select(
            AwardRecommendationApplicationSubmission.award_recommendation_id,
            func.count(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
            ).label("total_received_count"),
        )
        .where(
            AwardRecommendationApplicationSubmission.award_recommendation_id.in_(
                award_recommendation_ids
            )
        )
        .group_by(AwardRecommendationApplicationSubmission.award_recommendation_id)
    ).all()
    total_received_counts = {
        row.award_recommendation_id: int(row.total_received_count) for row in count_rows
    }

    for award_recommendation in award_recommendations:
        award_recommendation.award_recommendation_summary = {  # type: ignore[attr-defined]
            "total_received_count": total_received_counts.get(
                award_recommendation.award_recommendation_id, 0
            )
        }
