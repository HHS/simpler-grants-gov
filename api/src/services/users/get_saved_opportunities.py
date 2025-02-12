import logging
from typing import Sequence, Tuple
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import asc, desc, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

from src.adapters import db
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import UserSavedOpportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator

logger = logging.getLogger(__name__)


class SavedOpportunityListParams(BaseModel):
    pagination: PaginationParams


def add_sort_order(stmt: Select, sort_order: list) -> Select:
    model_mapping = {
        "opportunity_title": Opportunity.opportunity_title,
        "close_date": OpportunitySummary.close_date,
    }

    order_cols: list = []
    for order in sort_order:
        column = (
            model_mapping.get(order.order_by)
            if order.order_by in model_mapping
            else getattr(UserSavedOpportunity, order.order_by)
        )

        if (
            order.sort_direction == SortDirection.ASCENDING
        ):  # defaults to nulls at the end when asc order
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_col = desc(column)
            if order.order_by == "close_date":
                order_col = order_col.nullslast()
            order_cols.append(order_col)

    return stmt.order_by(*order_cols)


def get_saved_opportunities(
    db_session: db.Session, user_id: UUID, raw_opportunity_params: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    opportunity_params = SavedOpportunityListParams.model_validate(raw_opportunity_params)

    stmt = (
        select(Opportunity)
        .join(
            UserSavedOpportunity, UserSavedOpportunity.opportunity_id == Opportunity.opportunity_id
        )
        .join(
            CurrentOpportunitySummary,
            CurrentOpportunitySummary.opportunity_id == Opportunity.opportunity_id,
        )
        .join(
            OpportunitySummary,
            CurrentOpportunitySummary.opportunity_summary_id
            == OpportunitySummary.opportunity_summary_id,
        )
        .options(selectinload("*"))
    )

    stmt = add_sort_order(stmt, opportunity_params.pagination.sort_order)

    paginator: Paginator[Opportunity] = Paginator(
        Opportunity, stmt, db_session, page_size=opportunity_params.pagination.page_size
    )

    paginated_search = paginator.page_at(page_offset=opportunity_params.pagination.page_offset)

    pagination_info = PaginationInfo.from_pagination_params(
        opportunity_params.pagination, paginator
    )

    return paginated_search, pagination_info
