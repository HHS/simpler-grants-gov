import logging
from datetime import timedelta

from pydantic import BaseModel, Field
from sqlalchemy import select

import src.adapters.db as db
from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from src.pagination.pagination_models import PaginationParams
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


def get_extracts(db_session: db.Session, list_params: ExtractListParams) -> list[ExtractMetadata]:
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
    offset = list_params.pagination.page_size * (list_params.pagination.page_offset - 1)
    stmt = stmt.offset(offset).limit(list_params.pagination.page_size)

    extracts = list(db_session.execute(stmt).scalars().all())

    for extract in extracts:
        file_loc = extract.file_path
        setattr(extract, "download_path", pre_sign_file_location(file_loc))  # noqa: B010

    return extracts
