from typing import Sequence, Tuple

from pydantic import BaseModel
from sqlalchemy import asc, desc, select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.db.models.opportunity_models import Opportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator


class SearchOpportunityParams(BaseModel):
    # Filters will be added in a subsequent ticket

    pagination: PaginationParams


def search_opportunities(
    db_session: db.Session, raw_search_params: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    sort_fn = asc if search_params.pagination.is_ascending else desc
    stmt = (
        select(Opportunity)
        # TODO - when we want to sort by non-opportunity table fields we'll need to change this
        .order_by(sort_fn(getattr(Opportunity, search_params.pagination.order_by)))
        .where(Opportunity.is_draft.is_(False))  # Only ever return non-drafts
        # Filter anything without a current opportunity summary
        .where(Opportunity.current_opportunity_summary != None)  # noqa: E711
        .options(joinedload("*"))  # Automatically load all relationships
    )

    paginator: Paginator[Opportunity] = Paginator(
        stmt, db_session, page_size=search_params.pagination.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return opportunities, pagination_info
