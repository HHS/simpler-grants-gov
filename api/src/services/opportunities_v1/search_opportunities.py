import logging
from typing import Sequence, Tuple

from pydantic import BaseModel, Field

from src.db.models.opportunity_models import Opportunity
from src.pagination.pagination_models import PaginationInfo, PaginationParams

logger = logging.getLogger(__name__)


class SearchOpportunityFilters(BaseModel):
    funding_instrument: dict | None = Field(default=None)
    funding_category: dict | None = Field(default=None)
    applicant_type: dict | None = Field(default=None)
    opportunity_status: dict | None = Field(default=None)
    agency: dict | None = Field(default=None)


class SearchOpportunityParams(BaseModel):
    pagination: PaginationParams

    query: str | None = Field(default=None)
    filters: SearchOpportunityFilters | None = Field(default=None)


def search_opportunities(raw_search_params: dict) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    pagination_info = PaginationInfo(
        page_offset=search_params.pagination.page_offset,
        page_size=search_params.pagination.page_size,
        order_by=search_params.pagination.order_by,
        sort_direction=search_params.pagination.sort_direction,
        total_records=0,
        total_pages=0,
    )

    return [], pagination_info
