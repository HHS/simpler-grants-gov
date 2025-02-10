import logging
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity
from src.pagination.pagination_models import PaginationParams

logger = logging.getLogger(__name__)

class SavedOpportunityListParams(BaseModel):
    opportunity: PaginationParams

def get_saved_opportunities(db_session: db.Session, user_id: UUID, raw_opportunity_params: dict ) -> list[Opportunity]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    opportunity_params = SavedOpportunityListParams.model_validate(raw_opportunity_params)

    stmt = select(Opportunity).join(UserSavedOpportunity).where(UserSavedOpportunity.user_id == user_id).options(selectinload("*"))

    order_cols: list = []
    for order in opportunity_params.pagination.sort_order:
        column = getattr(opportunity_params, order.order_by)

        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column))


    return list(saved_opportunities)
