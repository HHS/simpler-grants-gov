import logging
from datetime import timedelta
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import select

import src.adapters.db as db
from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.search.search_models import DateSearchFilter
from src.util import datetime_util
from src.util.file_util import pre_sign_file_location

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
) -> Tuple[Sequence[ExtractMetadata], PaginationInfo]:
    stmt = select(ExtractMetadata)

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

    for extract in extracts:
        file_loc = extract.file_path
        setattr(extract, "download_path", pre_sign_file_location(file_loc))  # noqa: B010

    return extracts, pagination_info
