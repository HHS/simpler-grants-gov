from typing import Sequence, Tuple

from sqlalchemy import asc, desc, select

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityCategoryLegacy
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParamsV0
from src.pagination.paginator import Paginator
from src.services.opportunities_v0.opportunity_service_shared import convert_transfer_opp_to_regular


class SearchOpportunityParams(PaginationParamsV0):
    opportunity_title: str | None = None
    category: OpportunityCategoryLegacy | None = None


def _get_order_by_field_name_for_transfer_table(order_by: str) -> str:
    # Allowed values based on our schema
    # opportunity_id, agency, opportunity_number, created_at, updated_at
    # the transfer table has the following column names
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

    # TODO - until we setup the transform layer, we query the transfer table directly
    # and have to translate the name of the order_by parameter to match the DB
    order_by_field_name = _get_order_by_field_name_for_transfer_table(
        search_params.sorting.order_by
    )
    stmt = (
        select(TransferTopportunity)
        .order_by(sort_fn(getattr(TransferTopportunity, order_by_field_name)))
        .where(TransferTopportunity.is_draft == "N")  # Only ever return non-drafts
    )

    if search_params.opportunity_title is not None:
        stmt = stmt.where(
            TransferTopportunity.opptitle.ilike(f"%{search_params.opportunity_title}%")
        )

    if search_params.category is not None:
        stmt = stmt.where(TransferTopportunity.oppcategory == search_params.category)

    paginator: Paginator[TransferTopportunity] = Paginator(
        TransferTopportunity, stmt, db_session, page_size=search_params.paging.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.paging.page_offset)
    pagination_info = PaginationInfo.from_pagination_models(search_params, paginator)

    return [convert_transfer_opp_to_regular(opp) for opp in opportunities], pagination_info
