import logging
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import joinedload

import src.adapters.db as db
from src.db.models.agency_models import Agency
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator

logger = logging.getLogger(__name__)


class AgencyFilters(BaseModel):
    agency_id: int | None = None
    agency_name: str | None = None


class AgencyListParams(BaseModel):
    pagination: PaginationParams

    filters: AgencyFilters | None = Field(default_factory=AgencyFilters)


def get_agencies(
    db_session: db.Session, list_params: AgencyListParams
) -> Tuple[Sequence[Agency], PaginationInfo]:
    stmt = select(Agency).options(joinedload(Agency.top_level_agency), joinedload("*"))

    # Exclude test agencies
    stmt = stmt.where(Agency.is_test_agency != True)  # noqa: E712

    if list_params.filters:
        if list_params.filters.agency_name:
            stmt = stmt.where(Agency.agency_name == list_params.filters.agency_name)

    # Execute the query and fetch all agencies
    agencies = db_session.execute(stmt).unique().scalars().all()

    # Create a dictionary to map agency names to agency instances
    agency_dict = {agency.agency_name: agency for agency in agencies}

    # Process top-level agencies
    for agency in agencies:
        if "-" in agency.agency_name:
            top_level_name = agency.agency_name.split("-")[0].strip()
            # Find the top-level agency using the dictionary
            top_level_agency = agency_dict.get(top_level_name)
            if top_level_agency:
                agency.top_level_agency = top_level_agency

    # Apply pagination after processing
    paginator: Paginator[Agency] = Paginator(
        Agency, stmt, db_session, page_size=list_params.pagination.page_size
    )

    paginated_agencies = paginator.page_at(page_offset=list_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(list_params.pagination, paginator)

    return paginated_agencies, pagination_info
