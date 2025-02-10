import logging
from typing import Sequence, Tuple
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity, UserSavedSearch
from src.pagination.pagination_models import PaginationParams, PaginationInfo
from src.pagination.paginator import Paginator

logger = logging.getLogger(__name__)

class SavedOpportunityListParams(BaseModel):
    opportunity: PaginationParams

def get_saved_opportunities(db_session: db.Session, user_id: UUID, raw_opportunity_params: dict ) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    opportunity_params = SavedOpportunityListParams.model_validate(raw_opportunity_params)

    stmt = select(Opportunity).join(UserSavedOpportunity).where(UserSavedOpportunity.user_id == user_id).options(selectinload("*"))

    stmt = apply_sorting(stmt, UserSavedOpportunity, opportunity_params.pagination.sort_order)

    paginator: Paginator[UserSavedSearch] = Paginator(
        UserSavedOpportunity, stmt, db_session, page_size=opportunity_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=opportunity_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(opportunity_params.pagination, paginator)

    return paginated_search, pagination_info



    return list(saved_opportunities)
