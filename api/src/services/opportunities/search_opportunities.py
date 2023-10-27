from typing import Sequence, Tuple

from sqlalchemy import asc, desc, select

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator


class SearchOpportunityParams(PaginationParams):
    opportunity_title: str | None = None
    is_draft: bool | None = None
    category: OpportunityCategory | None = None


def search_opportunities(
    db_session: db.Session, search_opportunity_dict: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(search_opportunity_dict)

    sort_fn = asc if search_params.sorting.is_ascending else desc

    stmt = select(Opportunity).order_by(
        sort_fn(getattr(Opportunity, search_params.sorting.order_by))
    )

    if search_params.opportunity_title is not None:
        # TODO - we'll need to figure out if we need more escaping for this
        stmt = stmt.where(
            Opportunity.opportunity_title.ilike(f"%{search_params.opportunity_title}%")
        )

    if search_params.is_draft is not None:
        stmt = stmt.where(Opportunity.is_draft == search_params.is_draft)

    if search_params.category is not None:
        stmt = stmt.where(Opportunity.category == search_params.category)

    paginator: Paginator[Opportunity] = Paginator(
        stmt, db_session, page_size=search_params.paging.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.paging.page_offset)
    pagination_info = PaginationInfo.from_pagination_models(search_params, paginator)

    # just creating a static pagination info for the moment until we hook up pagination
    return opportunities, pagination_info
