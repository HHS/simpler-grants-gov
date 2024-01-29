from typing import Sequence, Tuple

from sqlalchemy import asc, desc, select

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.staging_topportunity_models import StagingTopportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.opportunities.opportunity_service_shared import convert_staging_opp_to_regular


class SearchOpportunityParams(PaginationParams):
    opportunity_title: str | None = None
    category: OpportunityCategory | None = None


def _get_order_by_field_name_for_staging_table(order_by: str) -> str:
    # Allowed values based on our schema
    # opportunity_id, agency, opportunity_number, created_at, updated_at
    # the staging table has the following column names
    # opportunity_id, owningagency, oppnumber, created_at, updated_at
    if order_by == "agency":
        return "owningagency"
    elif order_by == "opportunity_number":
        return "oppnumber"

    return order_by


def search_opportunities(
    db_session: db.Session, search_opportunity_dict: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(search_opportunity_dict)

    sort_fn = asc if search_params.sorting.is_ascending else desc

    # TODO - until we setup the transform layer, we query the staging table directly
    # and have to translate the name of the order_by parameter to match the DB
    order_by_field_name = _get_order_by_field_name_for_staging_table(search_params.sorting.order_by)
    stmt = (
        select(StagingTopportunity)
        .order_by(sort_fn(getattr(StagingTopportunity, order_by_field_name)))
        .where(StagingTopportunity.is_draft == "N")  # Only ever return non-drafts
    )

    if search_params.opportunity_title is not None:
        stmt = stmt.where(
            StagingTopportunity.opptitle.ilike(f"%{search_params.opportunity_title}%")
        )

    if search_params.category is not None:
        stmt = stmt.where(StagingTopportunity.oppcategory == search_params.category)

    paginator: Paginator[StagingTopportunity] = Paginator(
        stmt, db_session, page_size=search_params.paging.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.paging.page_offset)
    pagination_info = PaginationInfo.from_pagination_models(search_params, paginator)

    return [convert_staging_opp_to_regular(opp) for opp in opportunities], pagination_info
