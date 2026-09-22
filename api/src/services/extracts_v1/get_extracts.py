import logging
from collections.abc import Sequence
from datetime import timedelta

from pydantic import BaseModel, Field
from sqlalchemy import asc, desc, select

import src.adapters.db as db
from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from src.db.models.lookup_models import LkExtractType
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator
from src.search.search_models import DateSearchFilter
from src.util import datetime_util

logger = logging.getLogger(__name__)


class ExtractFilters(BaseModel):
    extract_type: ExtractType | None = None
    # Default to last 7 days if no date range is provided
    created_at: DateSearchFilter | None = Field(
        default_factory=lambda: DateSearchFilter(
            start_date=(datetime_util.utcnow() - timedelta(days=7)).date(),
            end_date=datetime_util.utcnow().date() + timedelta(days=1),
        )
    )


class ExtractListParams(BaseModel):
    pagination: PaginationParams

    filters: ExtractFilters | None = Field(default_factory=ExtractFilters)


def get_extracts(
    db_session: db.Session, list_params: ExtractListParams
) -> tuple[Sequence[ExtractMetadata], PaginationInfo]:
    stmt = select(ExtractMetadata)

    # Apply sorting from pagination params
    for sort_order in list_params.pagination.sort_order:
        if sort_order.order_by == "extract_type":
            # Join with lookup table for extract type description
            stmt = stmt.join(
                LkExtractType, ExtractMetadata.extract_type == LkExtractType.extract_type_id
            )
            sort_column = LkExtractType.description
        else:
            sort_column = getattr(ExtractMetadata, sort_order.order_by)

        if sort_order.sort_direction == SortDirection.ASCENDING:
            stmt = stmt.order_by(asc(sort_column))
        else:
            stmt = stmt.order_by(desc(sort_column))

    if list_params.filters:
        if list_params.filters.extract_type:
            stmt = stmt.where(ExtractMetadata.extract_type == list_params.filters.extract_type)

        if list_params.filters.created_at:
            if list_params.filters.created_at.start_date:
                stmt = stmt.where(
                    ExtractMetadata.created_at >= list_params.filters.created_at.start_date
                )
            if list_params.filters.created_at.end_date:
                stmt = stmt.where(
                    ExtractMetadata.created_at <= list_params.filters.created_at.end_date
                )

    # Apply pagination
    paginator: Paginator[ExtractMetadata] = Paginator(
        ExtractMetadata, stmt, db_session, page_size=list_params.pagination.page_size
    )

    extracts = paginator.page_at(page_offset=list_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(list_params.pagination, paginator)

    return extracts, pagination_info
