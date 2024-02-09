from typing import Sequence, Tuple

from sqlalchemy import asc, desc, select
from sqlalchemy.orm import joinedload
from pydantic import BaseModel

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityCategoryLegacy
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParamsV0, PaginationParams
from src.pagination.paginator import Paginator
from src.services.opportunities.opportunity_service_shared import convert_transfer_opp_to_regular


class SearchOpportunityParamsV0(PaginationParamsV0):
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


def search_opportunities_v0(
    db_session: db.Session, search_opportunity_dict: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParamsV0.model_validate(search_opportunity_dict)

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
        stmt, db_session, page_size=search_params.paging.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.paging.page_offset)
    pagination_info = PaginationInfo.from_pagination_models(search_params, paginator)

    return [convert_transfer_opp_to_regular(opp) for opp in opportunities], pagination_info

class SearchOpportunityParamsV01(BaseModel):
    # Filters will be added in a subsequent ticket

    pagination: PaginationParams

def search_opportunities_v01(db_session: db.Session, search_params: dict) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParamsV01.model_validate(search_params)

    sort_fn = asc if search_params.pagination.is_ascending else desc
    stmt = (
        select(Opportunity)
        # TODO - when we want to sort by non-opportunity table fields we'll need to change this
        .order_by(sort_fn(getattr(Opportunity, search_params.pagination.order_by)))
        .where(Opportunity.is_draft.is_(False))  # Only ever return non-drafts
        .options(joinedload("*")) # Automatically load all relationships
    )

    paginator: Paginator[Opportunity] = Paginator(
        stmt, db_session, page_size=search_params.pagination.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return opportunities, pagination_info